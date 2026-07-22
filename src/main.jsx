import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

if (import.meta.env.DEV) {
  const { applyDevSafeAreaOverride } = await import('./utils/devSafeArea.js');
  applyDevSafeAreaOverride();
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
