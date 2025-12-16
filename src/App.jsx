import { useState } from 'react'
import './App.css'
import { getFunctions, httpsCallable } from "firebase/functions";
import { app } from "./firebase";

function App() {
  const [status, setStatus] = useState("Ready");
  // State to hold the ID of the template to delete
  const [templateIdToDelete, setTemplateIdToDelete] = useState("");

  const saveTemplate = async () => {
    setStatus("Calling create function...");
    const functions = getFunctions(app);
    const createTemplate = httpsCallable(functions, 'createPromptTemplate');

    try {
      const result = await createTemplate({
        displayName: "Test Prompt",
        dotPromptString: `---
model: gemini-1.5-flash
---
Tell me a joke about a software engineer.`
      });

      console.log("Creation Success:", result);
      // Helpful message to find the ID for testing delete
      setStatus("Template Created! Check Console for the ID (look for 'name' field).");
    } catch (error) {
      console.error("Error:", error);
      setStatus("Create Error: " + error.message);
    }
  };

  const deleteTemplate = async () => {
    if (!templateIdToDelete) {
      setStatus("Please enter a Template ID first.");
      return;
    }

    setStatus("Calling delete function...");
    const functions = getFunctions(app);
    const deleteFn = httpsCallable(functions, 'deletePromptTemplate');

    try {
      // Pass the ID to the backend function
      await deleteFn({ templateId: templateIdToDelete });

      console.log("Delete Success");
      setStatus(`Successfully deleted template: ${templateIdToDelete}`);
      setTemplateIdToDelete(""); // Clear input on success
    } catch (error) {
      console.error("Error:", error);
      setStatus("Delete Error: " + error.message);
    }
  };

  return (
    <div className="card">
      <h1>Prompt Manager</h1>

      <div style={{ padding: '20px', border: '1px solid #ccc', borderRadius: '8px', marginBottom: '20px' }}>
        <h2>1. Create</h2>
        <button onClick={saveTemplate}>
          Create Test Template
        </button>
      </div>

      <div style={{ padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
        <h2>2. Delete</h2>
        <input
          type="text"
          value={templateIdToDelete}
          onChange={(e) => setTemplateIdToDelete(e.target.value)}
          placeholder="Paste Template ID here"
          style={{ padding: '8px', marginRight: '10px', width: '200px' }}
        />
        <button onClick={deleteTemplate} style={{ backgroundColor: '#ff4444' }}>
          Delete Template
        </button>
      </div>

      <div style={{ marginTop: '20px' }}>
        <strong>Status:</strong> {status}
      </div>
    </div>
  )
}

export default App