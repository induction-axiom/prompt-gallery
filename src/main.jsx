import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { TemplatesProvider } from './context/TemplatesContext';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <TemplatesProvider>
      <App />
    </TemplatesProvider>
  </React.StrictMode>,
)
