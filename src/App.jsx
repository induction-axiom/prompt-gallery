import { useState } from 'react'
import './App.css'
import { getFunctions, httpsCallable } from "firebase/functions";
import { app } from "./firebase";

function App() {
  const [status, setStatus] = useState("Ready");

  const saveTemplate = async () => {
    setStatus("Calling function...");
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
      console.log("Success:", result);
      setStatus("Template Created! Check Console.");
    } catch (error) {
      console.error("Error:", error);
      setStatus("Error: " + error.message);
    }
  };

  return (
    <div className="card">
      <h1>Prompt Creator</h1>
      <p>Status: {status}</p>
      <button onClick={saveTemplate}>
        Create Prompt Template
      </button>
    </div>
  )
}

export default App