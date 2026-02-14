import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import './simple-gate.js';  // active, crash-proof gate script
import './app-fix-inject.js';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
