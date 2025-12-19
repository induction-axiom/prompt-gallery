import { useState, useEffect } from 'react'
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
import FilterPill from './components/common/FilterPill';

import { X } from 'lucide-react';

function App() {
  const { state, actions, user, isAuthLoading } = useTemplatesContext();

  // UI State (Visuals only)
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [isEditMode, setIsEditMode] = useState(true); // true = edit, false = create/remix
  const [selectedRunTemplate, setSelectedRunTemplate] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewTemplate, setViewTemplate] = useState(null);

  // Scroll to top when author filter changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [state.authorFilter]);

  // --- Auth Handlers ---
  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const email = result.user.email;
      if (!email.endsWith('@google.com')) {
        await signOut(auth);
        alert("Access restricted to @google.com email addresses only.");
        return;
      }
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
    setIsEditMode(false);
    setIsEditorOpen(true);
  };

  const handleOpenEdit = (e, template) => {
    e.stopPropagation();
    setEditingTemplate(template);
    setIsEditMode(true);
    setIsEditorOpen(true);
  };

  const handleRemix = (e, template) => {
    e.stopPropagation();
    setEditingTemplate(template);
    setIsEditMode(false); // Remix = Create mode with initial data
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
    <>
      <Header
        onLogout={handleLogout}
        onCreate={handleOpenCreate}
      />

      <div className="max-w-[1600px] mx-auto p-4 md:p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <LabelFilter />

            {/* "Me" Filter (Visible if no filter OR if "Me" is selected) */}
            {(!state.authorFilter || state.authorFilter.id === user.uid) && (
              <FilterPill
                user={user}
                label="By me"
                isActive={state.authorFilter?.id === user.uid}
                onClick={() => {
                  if (state.authorFilter?.id === user.uid) {
                    actions.setAuthorFilter(null);
                  } else {
                    actions.setAuthorFilter({
                      id: user.uid,
                      displayName: 'By me',
                      photoURL: user.photoURL
                    });
                  }
                }}
              />
            )}

            {/* Other Author Filter (Visible only when active) */}
            {state.authorFilter && state.authorFilter.id !== user.uid && (
              <FilterPill
                user={state.authorFilter}
                label={`By ${state.authorFilter.displayName || state.authorFilter.name || 'Author'}`}
                isActive={true}
                onClick={() => actions.setAuthorFilter(null)}
                className="animate-in fade-in slide-in-from-left-4 duration-200"
              />
            )}
          </h2>
          <SortDropdown />
        </div>

        <TemplateGrid
          handleViewWrapper={handleViewWrapper}
          handleOpenEdit={handleOpenEdit}
          handleRemix={handleRemix}
          setSelectedRunTemplate={setSelectedRunTemplate}
        />

        <TemplateEditor
          isOpen={isEditorOpen}
          isEditing={!!editingTemplate && isEditMode}
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
    </>
  );
}

export default App