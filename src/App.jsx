import { useState } from 'react'
import './App.css'
import { getFunctions, httpsCallable } from "firebase/functions";
import { app } from "./firebase";

function App() {
  const [status, setStatus] = useState("Ready");
  const [templates, setTemplates] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const functions = getFunctions(app);

  // Helper to extract ID from full resource name
  const getTemplateId = (fullResourceName) => {
    return fullResourceName.split('/').pop();
  };

  const saveTemplate = async () => {
    setStatus("Creating template...");
    setIsLoading(true);
    const createTemplate = httpsCallable(functions, 'createPromptTemplate');

    try {
      await createTemplate({
        displayName: "Test Prompt " + new Date().toLocaleTimeString(),
        dotPromptString: `---
model: gemini-1.5-flash
---
Tell me a joke about a software engineer.`
      });
      setStatus("Template Created!");
      fetchTemplates(); // Refresh list automatically
    } catch (error) {
      console.error(error);
      setStatus("Create Error: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTemplates = async () => {
    setStatus("Fetching templates...");
    setIsLoading(true);
    const listTemplates = httpsCallable(functions, 'listPromptTemplates');

    try {
      const result = await listTemplates();
      const fetchedTemplates = result.data.templates || [];
      console.log(fetchedTemplates);
      setTemplates(fetchedTemplates);
      setStatus(`Loaded ${fetchedTemplates.length} templates.`);
    } catch (error) {
      console.error(error);
      setStatus("List Error: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteTemplate = async (fullResourceName) => {
    const templateId = getTemplateId(fullResourceName);

    if (!window.confirm(`Are you sure you want to delete template ${templateId}?`)) return;

    setStatus(`Deleting ${templateId}...`);
    setIsLoading(true);
    const deleteFn = httpsCallable(functions, 'deletePromptTemplate');

    try {
      await deleteFn({ templateId: templateId });
      setStatus("Deleted successfully.");
      fetchTemplates(); // Refresh list automatically
    } catch (error) {
      console.error(error);
      setStatus("Delete Error: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="card" style={{ maxWidth: '600px', margin: '0 auto' }}>
      <h1>Prompt Gallery</h1>

      {/* Status Bar */}
      <div style={{
        padding: '10px',
        marginBottom: '20px',
        backgroundColor: '#f0f0f0',
        borderRadius: '4px',
        color: '#333'
      }}>
        <strong>Status:</strong> {status}
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', justifyContent: 'center' }}>
        <button onClick={saveTemplate} disabled={isLoading}>
          Create New Template
        </button>
        <button onClick={fetchTemplates} disabled={isLoading}>
          Refresh List
        </button>
      </div>

      {/* List */}
      <div style={{ textAlign: 'left' }}>
        <h3>Your Templates ({templates.length})</h3>

        {templates.length === 0 ? (
          <p style={{ color: '#888', fontStyle: 'italic' }}>No templates found. Create one above!</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {templates.map((t) => (
              <li key={t.name} style={{
                padding: '10px',
                border: '1px solid #ddd',
                marginBottom: '8px',
                borderRadius: '8px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <strong style={{ fontSize: '1.1em' }}>{t.displayName}</strong>
                  <br />
                  <small style={{ color: '#666', fontFamily: 'monospace' }}>
                    ID: {getTemplateId(t.name)}
                  </small>
                </div>
                <button
                  onClick={() => deleteTemplate(t.name)}
                  disabled={isLoading}
                  style={{
                    backgroundColor: '#ff444445',
                    fontSize: '0.8em',
                    padding: '5px 10px'
                  }}
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

export default App