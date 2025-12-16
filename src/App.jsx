import { useState, useEffect } from 'react'

import { getFunctions, httpsCallable } from "firebase/functions";
import { signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
import { app, auth, googleProvider } from "./firebase";

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
    setStatus("Fetching...");
    setIsLoading(true);
    const listTemplates = httpsCallable(functions, 'listPromptTemplates');
    try {
      const result = await listTemplates();
      setTemplates(result.data.templates || []);
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
      setRunResult(JSON.stringify(result.data, null, 2));
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

      <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-5">
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