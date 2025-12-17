import { useState, useEffect } from 'react'
import { getFunctions, httpsCallable } from "firebase/functions";
import { signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
import { app, auth, googleProvider } from "./firebase";
import { isImageModel, extractImageFromGeminiResult } from './utils/geminiParsers';
import { getRecentTemplates, saveExecutionMetadata, getTemplateExecutions } from './services/firestore';
import { uploadImage } from './services/storage';

// Components
import Header from './components/layout/Header';
import LoginScreen from './components/auth/LoginScreen';
import TemplateCard from './components/templates/TemplateCard';
import TemplateEditor from './components/templates/TemplateEditor';
import TemplateRunner from './components/templates/TemplateRunner';
import TemplateViewer from './components/templates/TemplateViewer';

function App() {
  const [user, setUser] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  const [status, setStatus] = useState("Ready");
  const [templates, setTemplates] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Editor State
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);

  // Runner State
  const [selectedRunTemplate, setSelectedRunTemplate] = useState(null);
  const [runResult, setRunResult] = useState("");

  // Viewer State
  const [viewTemplateData, setViewTemplateData] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  const functions = getFunctions(app);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthLoading(false);

      if (currentUser) {
        fetchTemplates();
      }
    });
    return () => unsubscribe();
  }, []);

  // --- Auth Handlers ---
  const handleGoogleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Login failed", error);
      alert(error.message);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setTemplates([]);
      setStatus("Ready");
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  // --- API Handlers ---
  const getTemplateId = (fullResourceName) => fullResourceName ? fullResourceName.split('/').pop() : 'Unknown';

  const fetchTemplates = async () => {
    setStatus("Fetching list from Firestore...");
    setIsLoading(true);
    try {
      // 1. Get recent templates from Firestore
      const firestoreDocs = await getRecentTemplates(10);

      if (firestoreDocs.length === 0) {
        setTemplates([]);
        setStatus("Ready (No templates found)");
        return;
      }

      // 2. Fetch details for each template in parallel
      setStatus(`Fetching details for ${firestoreDocs.length} templates...`);
      const getFn = httpsCallable(functions, 'getPromptTemplate');

      const promises = firestoreDocs.map(async (docData) => {
        try {
          // Fetch template details from Cloud Function
          const res = await getFn({ templateId: docData.id });

          // Fetch recent executions (images) from Firestore
          let executions = [];
          try {
            executions = await getTemplateExecutions(docData.id, 10);
          } catch (e) {
            console.error("Failed to fetch executions for", docData.id, e);
          }

          return {
            ...res.data,
            ownerId: docData.ownerId,
            createdAt: docData.createdAt,
            executions: executions
          };
        } catch (err) {
          console.error(`Failed to fetch template ${docData.id}`, err);
          // Return a placeholder so the UI doesn't crash
          return {
            name: `projects/-/locations/-/templates/${docData.id}`,
            displayName: 'Unavailable Template',
            description: `Could not load details: ${err.message}`,
            error: true,
            ownerId: docData.ownerId, // Still return ownerId so they might delete it if they own it
            executions: []
          };
        }
      });

      const results = await Promise.all(promises);
      setTemplates(results);
      setStatus("Ready");
    } catch (error) {
      console.error(error);
      setStatus("Fetch Error: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewTemplate = async (template) => {
    setStatus("Fetching details...");
    setIsLoading(true);
    setViewTemplateData(null);
    setIsViewModalOpen(true);

    const getFn = httpsCallable(functions, 'getPromptTemplate');
    try {
      const templateId = getTemplateId(template.name);
      const result = await getFn({ templateId });
      setViewTemplateData(result.data);
      setStatus("Details loaded");
    } catch (error) {
      console.error(error);
      setViewTemplateData({ error: error.message });
      setStatus("Error loading details");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingTemplate(null);
    setIsEditorOpen(true);
  };

  const handleOpenEdit = (e, template) => {
    e.stopPropagation();
    setEditingTemplate(template);
    setIsEditorOpen(true);
  };

  const saveTemplate = async ({ displayName, dotPromptString }) => {
    if (!displayName || !dotPromptString) return alert("Missing fields");

    setIsLoading(true);
    try {
      if (editingTemplate) {
        setStatus("Updating...");
        const updateFn = httpsCallable(functions, 'updatePromptTemplate');
        await updateFn({
          templateId: getTemplateId(editingTemplate.name),
          displayName,
          dotPromptString
        });
        setStatus("Template Updated!");
      } else {
        setStatus("Creating...");
        const createFn = httpsCallable(functions, 'createPromptTemplate');
        await createFn({
          displayName,
          dotPromptString
        });
        setStatus("Template Created!");
      }
      setIsEditorOpen(false);
      fetchTemplates();
    } catch (error) {
      console.error(error);
      alert("Error: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteTemplate = async (e, fullResourceName) => {
    e.stopPropagation();
    const templateId = getTemplateId(fullResourceName);
    if (!window.confirm(`Delete "${templateId}"?`)) return;

    setStatus(`Deleting ${templateId}...`);
    setIsLoading(true);
    const deleteFn = httpsCallable(functions, 'deletePromptTemplate');
    try {
      await deleteFn({ templateId });
      setStatus("Deleted.");
      fetchTemplates();
    } catch (error) {
      alert("Delete Error: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const openRunModal = (template) => {
    setSelectedRunTemplate(template);
    setRunResult("");
  };

  const runTemplate = async ({ inputJson }) => {
    if (!selectedRunTemplate) return;
    setStatus("Running...");
    setIsLoading(true);
    setRunResult("");
    const runFn = httpsCallable(functions, 'runPromptTemplate');
    try {
      const reqBody = JSON.parse(inputJson);
      const templateId = getTemplateId(selectedRunTemplate.name);
      const result = await runFn({ templateId, reqBody });

      // Auto-save generated images
      if (isImageModel(selectedRunTemplate)) {
        const imageParams = extractImageFromGeminiResult(result.data);
        if (imageParams && imageParams.type === 'base64') {
          try {
            // Upload to Storage
            const { storagePath, downloadURL } = await uploadImage(user.uid, templateId, imageParams.data, imageParams.mimeType);

            // Save Metadata to Firestore
            await saveExecutionMetadata({
              templateId,
              user,
              storagePath,
              downloadURL,
              reqBody
            });
            console.log("Image saved successfully");
          } catch (err) {
            console.error("Failed to save image:", err);
          }
        }
      }

      setRunResult(result.data);
      setStatus("Run Complete");
    } catch (error) {
      setRunResult("Error: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // --- Render ---

  if (isAuthLoading) {
    return <div style={{ padding: '50px', textAlign: 'center' }}>Loading App...</div>;
  }

  if (!user) {
    return <LoginScreen onLogin={handleGoogleLogin} />;
  }

  return (
    <div className="max-w-[1200px] mx-auto p-5">
      <Header
        user={user}
        status={status}
        onLogout={handleLogout}
        onCreate={handleOpenCreate}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {templates.map((t) => (
          <TemplateCard
            key={t.name}
            template={t}
            getTemplateId={getTemplateId}
            onRun={() => openRunModal(t)}
            onView={handleViewTemplate}
            onEdit={handleOpenEdit}
            onDelete={deleteTemplate}
            currentUser={user}
          />
        ))}
      </div>

      <TemplateEditor
        isOpen={isEditorOpen}
        isEditing={!!editingTemplate}
        onClose={() => setIsEditorOpen(false)}
        onSave={saveTemplate}
        isLoading={isLoading}
        initialData={editingTemplate}
      />

      <TemplateRunner
        template={selectedRunTemplate}
        onClose={() => setSelectedRunTemplate(null)}
        onRun={runTemplate}
        isLoading={isLoading}
        runResult={runResult}
      />

      <TemplateViewer
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        data={viewTemplateData}
        isLoading={isLoading && !viewTemplateData}
      />
    </div>
  );
}

export default App