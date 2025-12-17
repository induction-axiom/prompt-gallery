import { useState, useEffect } from 'react'
import { signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
import { auth, googleProvider } from "./firebase";
import { useTemplates } from './hooks/useTemplates';

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

  // Use Custom Hook for Data & Logic
  const { state, actions } = useTemplates(user);

  // UI State (Visuals only)
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [selectedRunTemplate, setSelectedRunTemplate] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthLoading(false);

      if (currentUser) {
        actions.fetchTemplates();
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
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  // --- UI Handlers ---

  const handleOpenCreate = () => {
    setEditingTemplate(null);
    setIsEditorOpen(true);
  };

  const handleOpenEdit = (e, template) => {
    e.stopPropagation();
    setEditingTemplate(template);
    setIsEditorOpen(true);
  };

  const handleSaveWrapper = async (data) => {
    await actions.handleSaveTemplate({ ...data, editingTemplate });
    setIsEditorOpen(false);
  };

  const handleViewWrapper = (template) => {
    setIsViewModalOpen(true);
    actions.handleViewTemplate(template);
  };

  const handleRunWrapper = async ({ inputJson }) => {
    await actions.handleRunTemplate({ selectedRunTemplate, inputJson });
  };

  const handleCloseRun = () => {
    setSelectedRunTemplate(null);
    actions.clearRunResult();
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
        status={state.status}
        onLogout={handleLogout}
        onCreate={handleOpenCreate}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {state.templates.map((t) => (
          <TemplateCard
            key={t.name}
            template={t}
            getTemplateId={actions.getTemplateId}
            onRun={() => setSelectedRunTemplate(t)}
            onView={handleViewWrapper}
            onEdit={handleOpenEdit}
            onDelete={actions.handleDeleteTemplate}
            onDeleteExecution={actions.handleDeleteExecution}
            onToggleLike={actions.handleToggleLike}
            isLiked={state.likedTemplateIds.includes(actions.getTemplateId(t.name))}
            currentUser={user}
          />
        ))}
      </div>

      <TemplateEditor
        isOpen={isEditorOpen}
        isEditing={!!editingTemplate}
        onClose={() => setIsEditorOpen(false)}
        onSave={handleSaveWrapper}
        isLoading={state.isLoading}
        initialData={editingTemplate}
      />

      <TemplateRunner
        template={selectedRunTemplate}
        onClose={handleCloseRun}
        onRun={handleRunWrapper}
        isLoading={state.isLoading}
        runResult={state.runResult}
      />

      <TemplateViewer
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        data={state.viewTemplateData}
        isLoading={state.isLoading && !state.viewTemplateData}
      />
    </div>
  );
}

export default App