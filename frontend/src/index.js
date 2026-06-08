import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { clearAuthSession } from './services/authSession';

// Global Fetch Interceptor to handle session completion/expiration (401 Unauthorized)
const originalFetch = window.fetch;
window.fetch = async function (...args) {
  try {
    const response = await originalFetch(...args);
    if (response && response.status === 401) {
      clearAuthSession();
      if (typeof window !== "undefined") {
        const currentPath = window.location.pathname.toLowerCase();
        const isAdmin = currentPath.startsWith("/admin");
        const loginPath = isAdmin ? "/admin/login" : "/login";
        
        // Prevent redirect loop if the user is already on the login page
        if (currentPath !== loginPath) {
          window.location.href = loginPath;
        }
      }
    }
    return response;
  } catch (error) {
    throw error;
  }
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
      <App />
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();

