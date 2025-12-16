import { useState, useEffect } from 'react'
import './App.css'
import { getFunctions, httpsCallable } from "firebase/functions";
import { app } from "./firebase";

// --- Reusable Modal Component ---
const Modal = ({ title, onClose, children, footer }) => {
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white', padding: '20px', borderRadius: '8px',
        width: '90%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', gap: '15px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
          <h2 style={{ margin: 0, fontSize: '1.25rem' }}>{title}</h2>
          <button onClick={onClose} style={{ border: 'none', background: 'transparent', fontSize: '1.5rem', cursor: 'pointer' }}>&times;</button>
        </div>
        <div style={{ flex: 1 }}>{children}</div>
        {footer && <div style={{ borderTop: '1px solid #eee', paddingTop: '10px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>{footer}</div>}
      </div>
    </div>
  );
};

function App() {
  const [status, setStatus] = useState("Ready");
  const [templates, setTemplates] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // -- Modal States --
  // 'editingTemplate' holds the template object if we are editing, or null if creating
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);

  const [selectedRunTemplate, setSelectedRunTemplate] = useState(null);

  // -- Editor Form States --
  const [formDisplayName, setFormDisplayName] = useState("");
  const [formDotPromptString, setFormDotPromptString] = useState("");

  // -- Run Form States --
  const [runInputJson, setRunInputJson] = useState('{}');
  const [runResult, setRunResult] = useState("");

  const functions = getFunctions(app);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const getTemplateId = (fullResourceName) => fullResourceName ? fullResourceName.split('/').pop() : 'Unknown';

  // --- Handlers ---

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
    e.stopPropagation(); // Stop card click (which opens Run)
    setEditingTemplate(template);
    setFormDisplayName(template.displayName);
    setFormDotPromptString(template.templateString || ""); // API returns 'templateString'
    setIsEditorOpen(true);
  };

  const saveTemplate = async () => {
    if (!formDisplayName || !formDotPromptString) return alert("Missing fields");

    setIsLoading(true);
    try {
      if (editingTemplate) {
        // --- UPDATE MODE ---
        setStatus("Updating...");
        const updateFn = httpsCallable(functions, 'updatePromptTemplate');
        await updateFn({
          templateId: getTemplateId(editingTemplate.name),
          displayName: formDisplayName,
          dotPromptString: formDotPromptString
        });
        setStatus("Template Updated!");
      } else {
        // --- CREATE MODE ---
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

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px', fontFamily: 'sans-serif' }}>

      {/* --- Header --- */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <div>
          <h1 style={{ margin: 0 }}>Prompt Gallery</h1>
          <small style={{ color: '#666' }}>Status: {status}</small>
        </div>
        <button
          onClick={handleOpenCreate}
          style={{ padding: '10px 20px', fontSize: '1rem', backgroundColor: '#1890ff', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
        >
          + New Template
        </button>
      </header>

      {/* --- Gallery Matrix --- */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
        {templates.map((t) => (
          <div
            key={t.name}
            style={{
              border: '1px solid #e0e0e0', borderRadius: '12px', padding: '20px',
              backgroundColor: '#fff', boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
              display: 'flex', flexDirection: 'column', height: '180px'
            }}
          >
            {/* Card Content */}
            <div style={{ flex: 1, cursor: 'pointer' }} onClick={() => openRunModal(t)}>
              <h3 style={{ margin: '0 0 10px 0', color: '#333' }}>{t.displayName}</h3>
              <p style={{ margin: 0, color: '#888', fontSize: '0.85rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                ID: {getTemplateId(t.name)}
              </p>
            </div>

            {/* Card Actions */}
            <div style={{ marginTop: '15px', display: 'flex', justifyContent: 'flex-end', gap: '10px', borderTop: '1px solid #f0f0f0', paddingTop: '15px' }}>
              <button
                onClick={() => openRunModal(t)}
                style={{ backgroundColor: '#e6f7ff', color: '#1890ff', border: 'none', borderRadius: '4px', padding: '6px 12px', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 'bold' }}
              >
                Run
              </button>
              <button
                onClick={(e) => handleOpenEdit(e, t)}
                style={{ backgroundColor: '#f9f0ff', color: '#722ed1', border: 'none', borderRadius: '4px', padding: '6px 12px', fontSize: '0.8rem', cursor: 'pointer' }}
              >
                Edit
              </button>
              <button
                onClick={(e) => deleteTemplate(e, t.name)}
                style={{ backgroundColor: '#fff1f0', color: '#f5222d', border: 'none', borderRadius: '4px', padding: '6px 12px', fontSize: '0.8rem', cursor: 'pointer' }}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* --- Create / Edit Modal --- */}
      {isEditorOpen && (
        <Modal
          title={editingTemplate ? "Edit Template" : "Create New Template"}
          onClose={() => setIsEditorOpen(false)}
          footer={
            <>
              <button onClick={() => setIsEditorOpen(false)} style={{ padding: '8px 16px', cursor: 'pointer', border: '1px solid #ccc', borderRadius: '4px', background: 'white' }}>Cancel</button>
              <button onClick={saveTemplate} disabled={isLoading} style={{ padding: '8px 16px', backgroundColor: '#1890ff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                {isLoading ? 'Saving...' : 'Save Template'}
              </button>
            </>
          }
        >
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Display Name</label>
            <input
              type="text"
              value={formDisplayName}
              onChange={(e) => setFormDisplayName(e.target.value)}
              placeholder="e.g., Joke Generator"
              style={{ width: '100%', padding: '8px', boxSizing: 'border-box', border: '1px solid #ddd', borderRadius: '4px' }}
            />
          </div>
          <div style={{ height: '300px', display: 'flex', flexDirection: 'column' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>DotPrompt String</label>
            <textarea
              value={formDotPromptString}
              onChange={(e) => setFormDotPromptString(e.target.value)}
              style={{ flex: 1, width: '100%', padding: '10px', boxSizing: 'border-box', fontFamily: 'monospace', border: '1px solid #ddd', borderRadius: '4px', resize: 'none' }}
            />
          </div>
        </Modal>
      )}

      {/* --- Run Modal --- */}
      {selectedRunTemplate && (
        <Modal
          title={`Run: ${selectedRunTemplate.displayName}`}
          onClose={() => setSelectedRunTemplate(null)}
          footer={
            <button onClick={runTemplate} disabled={isLoading} style={{ padding: '10px 20px', backgroundColor: '#52c41a', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
              {isLoading ? 'Running...' : 'Run Prompt'}
            </button>
          }
        >
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Input Variables (JSON)</label>
            <textarea
              value={runInputJson}
              onChange={(e) => setRunInputJson(e.target.value)}
              rows={6}
              style={{ width: '100%', padding: '10px', boxSizing: 'border-box', fontFamily: 'monospace', border: '1px solid #ddd', borderRadius: '4px', backgroundColor: '#f9f9f9' }}
            />
          </div>

          {runResult && (
            <div style={{ marginTop: '20px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Result</label>
              <pre style={{ backgroundColor: '#f5f5f5', padding: '15px', borderRadius: '6px', overflowX: 'auto', border: '1px solid #eee', maxHeight: '200px' }}>
                {runResult}
              </pre>
            </div>
          )}
        </Modal>
      )}
    </div>
  )
}

export default App