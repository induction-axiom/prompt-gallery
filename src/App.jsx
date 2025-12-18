import { useState } from 'react'
import { signInWithPopup, signOut } from "firebase/auth";
import { auth, googleProvider } from "./firebase";
import { useTemplatesContext } from './context/TemplatesContext';

// Components
import Header from './components/layout/Header';
import LoginScreen from './components/auth/LoginScreen';
import TemplateEditor from './components/templates/TemplateEditor';
import TemplateRunner from './components/templates/TemplateRunner';
import TemplateViewer from './components/templates/TemplateViewer';
import TemplateGrid from './components/templates/TemplateGrid';
import SortDropdown from './components/common/SortDropdown';
import LabelFilter from './components/common/LabelFilter';

function App() {
  const { state, actions, user, isAuthLoading } = useTemplatesContext();

  // UI State (Visuals only)
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [selectedRunTemplate, setSelectedRunTemplate] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewTemplate, setViewTemplate] = useState(null);

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

  const handleViewWrapper = (template) => {
    setViewTemplate(template);
    setIsViewModalOpen(true);
  };

  const handleCloseRun = () => {
    setSelectedRunTemplate(null);
  };

  // --- Render ---

  if (isAuthLoading) {
    return <div style={{ padding: '50px', textAlign: 'center' }}>Loading App...</div>;
  }

  if (!user) {
    return <LoginScreen onLogin={handleGoogleLogin} />;
  }

  return (
    <div className="max-w-[1600px] mx-auto p-5">
      <Header
        onLogout={handleLogout}
        onCreate={handleOpenCreate}
      />

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          <LabelFilter />
        </h2>
        <SortDropdown />
      </div>

      <TemplateGrid
        handleViewWrapper={handleViewWrapper}
        handleOpenEdit={handleOpenEdit}
        setSelectedRunTemplate={setSelectedRunTemplate}
      />

      <TemplateEditor
        isOpen={isEditorOpen}
        isEditing={!!editingTemplate}
        onClose={() => setIsEditorOpen(false)}
        initialData={editingTemplate}
      />

      <TemplateRunner
        template={selectedRunTemplate}
        onClose={handleCloseRun}
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