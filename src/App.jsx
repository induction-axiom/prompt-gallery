import { useState, useEffect } from 'react'
import './App.css'
import { getFunctions, httpsCallable } from "firebase/functions";
import { app } from "./firebase";

// --- Simple Modal Component ---
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
          <h2 style={{ margin: 0 }}>{title}</h2>
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
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null); // If set, Run modal is open

  // -- Form States --
  const [newDisplayName, setNewDisplayName] = useState("");
  const [newDotPromptString, setNewDotPromptString] = useState(`---
model: gemini-2.5-flash
input:
  schema:
    subject: string
---
Tell me a joke about {{subject}}.`);

  const [runInputJson, setRunInputJson] = useState('{}');
  const [runResult, setRunResult] = useState("");

  const functions = getFunctions(app);

  // Load templates on mount
  useEffect(() => {
    fetchTemplates();
  }, []);

  const getTemplateId = (fullResourceName) => fullResourceName ? fullResourceName.split('/').pop() : 'Unknown';

  const fetchTemplates = async () => {
    setStatus("Fetching templates...");
    setIsLoading(true);
    const listTemplates = httpsCallable(functions, 'listPromptTemplates');
    try {
      const result = await listTemplates();
      setTemplates(result.data.templates || []);
      setStatus("Ready");
    } catch (error) {
      console.error(error);
      setStatus("Error fetching: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const saveTemplate = async () => {
    if (!newDisplayName || !newDotPromptString) return alert("Missing fields");
    setStatus("Creating...");
    setIsLoading(true);
    const createTemplate = httpsCallable(functions, 'createPromptTemplate');
    try {
      await createTemplate({ displayName: newDisplayName, dotPromptString: newDotPromptString });
      setStatus("Template Created!");
      setIsCreateOpen(false); // Close modal
      fetchTemplates(); // Refresh
      // Reset form
      setNewDisplayName("");
      setNewDotPromptString(`---
model: gemini-1.5-flash
input:
  schema:
    subject: string
---
Tell me a joke about {{subject}}.`);
    } catch (error) {
      console.error(error);
      alert("Error: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteTemplate = async (e, fullResourceName) => {
    e.stopPropagation(); // Prevent opening the run modal
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
    setSelectedTemplate(template);
    setRunResult("");
    setRunInputJson('{"subject": "software engineers"}'); // Default test input
  };

  const runTemplate = async () => {
    if (!selectedTemplate) return;
    setStatus("Running...");
    setIsLoading(true);
    setRunResult("");
    const runFn = httpsCallable(functions, 'runPromptTemplate');
    try {
      const reqBody = JSON.parse(runInputJson);
      const templateId = getTemplateId(selectedTemplate.name);
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
          onClick={() => setIsCreateOpen(true)}
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
            onClick={() => openRunModal(t)}
            style={{
              border: '1px solid #e0e0e0', borderRadius: '12px', padding: '20px',
              cursor: 'pointer', backgroundColor: '#fff', transition: 'transform 0.2s, box-shadow 0.2s',
              boxShadow: '0 2px 4px rgba(0,0,0,0.05)', position: 'relative'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.1)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.05)'; }}
          >
            <h3 style={{ margin: '0 0 10px 0', color: '#333' }}>{t.displayName}</h3>
            <p style={{ margin: 0, color: '#888', fontSize: '0.85rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              ID: {getTemplateId(t.name)}
            </p>
            <div style={{ marginTop: '15px', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={(e) => deleteTemplate(e, t.name)}
                style={{ backgroundColor: '#ffccc7', color: '#cf1322', border: 'none', borderRadius: '4px', padding: '4px 8px', fontSize: '0.8rem', cursor: 'pointer' }}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {templates.length === 0 && !isLoading && (
        <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>No templates found. Create one to get started!</div>
      )}

      {/* --- Create Modal --- */}
      {isCreateOpen && (
        <Modal
          title="Create New Prompt"
          onClose={() => setIsCreateOpen(false)}
          footer={
            <>
              <button onClick={() => setIsCreateOpen(false)} style={{ padding: '8px 16px', cursor: 'pointer' }}>Cancel</button>
              <button onClick={saveTemplate} disabled={isLoading} style={{ padding: '8px 16px', backgroundColor: '#1890ff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                {isLoading ? 'Creating...' : 'Create'}
              </button>
            </>
          }
        >
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Display Name</label>
            <input
              type="text"
              value={newDisplayName}
              onChange={(e) => setNewDisplayName(e.target.value)}
              placeholder="e.g., Joke Generator"
              style={{ width: '100%', padding: '8px', boxSizing: 'border-box', border: '1px solid #ddd', borderRadius: '4px' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>DotPrompt String</label>
            <textarea
              value={newDotPromptString}
              onChange={(e) => setNewDotPromptString(e.target.value)}
              rows={12}
              style={{ width: '100%', padding: '8px', boxSizing: 'border-box', fontFamily: 'monospace', border: '1px solid #ddd', borderRadius: '4px', resize: 'vertical' }}
            />
          </div>
        </Modal>
      )}

      {/* --- Run Modal --- */}
      {selectedTemplate && (
        <Modal
          title={`Run: ${selectedTemplate.displayName}`}
          onClose={() => setSelectedTemplate(null)}
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
              <pre style={{ backgroundColor: '#f5f5f5', padding: '15px', borderRadius: '6px', overflowX: 'auto', border: '1px solid #eee' }}>
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