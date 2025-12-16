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

function App() {
  const [user, setUser] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  const [status, setStatus] = useState("Ready");
  const [templates, setTemplates] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Editor State
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [formDisplayName, setFormDisplayName] = useState("");
  const [formDotPromptString, setFormDotPromptString] = useState("");

  // Runner State
  const [selectedRunTemplate, setSelectedRunTemplate] = useState(null);
  const [runInputJson, setRunInputJson] = useState('{}');
  const [runResult, setRunResult] = useState("");

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

  const handleOpenCreate = () => {
    setEditingTemplate(null);
    setFormDisplayName("");
    setFormDotPromptString(`---
model: gemini-2.5-flash
input:
  schema:
    subject: string
---
Tell me a joke about {{subject}}.`);
    setIsEditorOpen(true);
  };

  const handleOpenEdit = (e, template) => {
    e.stopPropagation();
    setEditingTemplate(template);
    setFormDisplayName(template.displayName);
    setFormDotPromptString(template.templateString || "");
    setIsEditorOpen(true);
  };

  const saveTemplate = async () => {
    if (!formDisplayName || !formDotPromptString) return alert("Missing fields");

    setIsLoading(true);
    try {
      if (editingTemplate) {
        setStatus("Updating...");
        const updateFn = httpsCallable(functions, 'updatePromptTemplate');
        await updateFn({
          templateId: getTemplateId(editingTemplate.name),
          displayName: formDisplayName,
          dotPromptString: formDotPromptString
        });
        setStatus("Template Updated!");
      } else {
        setStatus("Creating...");
        const createFn = httpsCallable(functions, 'createPromptTemplate');
        await createFn({
          displayName: formDisplayName,
          dotPromptString: formDotPromptString
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
    setRunInputJson('{"subject": "software engineers"}');
  };

  const runTemplate = async () => {
    if (!selectedRunTemplate) return;
    setStatus("Running...");
    setIsLoading(true);
    setRunResult("");
    const runFn = httpsCallable(functions, 'runPromptTemplate');
    try {
      const reqBody = JSON.parse(runInputJson);
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
            onEdit={handleOpenEdit}
            onDelete={deleteTemplate}
          />
        ))}
      </div>

      <TemplateEditor
        isOpen={isEditorOpen}
        isEditing={!!editingTemplate}
        onClose={() => setIsEditorOpen(false)}
        onSave={saveTemplate}
        isLoading={isLoading}
        formDisplayName={formDisplayName}
        setFormDisplayName={setFormDisplayName}
        formDotPromptString={formDotPromptString}
        setFormDotPromptString={setFormDotPromptString}
      />

      <TemplateRunner
        template={selectedRunTemplate}
        onClose={() => setSelectedRunTemplate(null)}
        onRun={runTemplate}
        isLoading={isLoading}
        runInputJson={runInputJson}
        setRunInputJson={setRunInputJson}
        runResult={runResult}
      />
    </div>
  );
}

export default App