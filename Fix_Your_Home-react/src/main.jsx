// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import './App.css';
import App from './App.jsx';
import axios from 'axios';
import { AuthProvider } from './context/AuthContext.jsx';

// Don't set baseURL if using Vite proxy, or set it to empty string
// The proxy in vite.config.js will handle /api routes
axios.defaults.baseURL = '';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>,
);
