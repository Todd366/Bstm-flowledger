import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import './inject-fixes.js';   // <-- one line
import './final-auth-inject.js';
import './final-fix-inject.js';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
