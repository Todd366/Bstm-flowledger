import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import './access-gate.js';  // keep this one - it's your active gate script

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
