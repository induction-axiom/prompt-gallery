import { useState, useEffect } from 'react'
import { signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
import { auth, googleProvider } from "./firebase";
import { getRecentTemplates, saveExecutionMetadata, getTemplateExecutions, deleteExecution, getUserLikes, togglePromptLike, getUserExecutionLikes, toggleExecutionLike, syncUserInfo } from './services/firestore';
import { useTemplates } from './hooks/useTemplates';

// Components
import Header from './components/layout/Header';
import LoginScreen from './components/auth/LoginScreen';
import TemplateEditor from './components/templates/TemplateEditor';
import TemplateRunner from './components/templates/TemplateRunner';
import TemplateViewer from './components/templates/TemplateViewer';
import TemplateGrid from './components/templates/TemplateGrid';
import SortDropdown from './components/common/SortDropdown';

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
  const [viewTemplate, setViewTemplate] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthLoading(false);

      if (currentUser) {
        syncUserInfo(currentUser);
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
    setViewTemplate(template);
    setIsViewModalOpen(true);
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

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white"></h2>
        <SortDropdown
          currentSort={state.sortBy}
          onSortChange={actions.setSortBy}
        />
      </div>

      <TemplateGrid
        templates={state.templates}
        state={state}
        actions={{
          ...actions,
          handleViewWrapper,
          handleOpenEdit,
          handleToggleExecutionLike: actions.handleToggleExecutionLike,
          setSelectedRunTemplate,
        }}
        user={user}
        likedExecutionIds={state.likedExecutionIds}
      />

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
        template={viewTemplate}
      />
    </div>
  );
}

export default App