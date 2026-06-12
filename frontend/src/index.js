import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { clearAuthSession } from './services/authSession';
import { openAuthModal } from './utils/authModalEvents';

const USER_PROTECTED_PATH_PREFIXES = [
  "/bus/payment",
  "/flight/payment",
  "/hotel/payment",
  "/dashboard",
  "/change-password",
  "/edit-profile",
  "/booking-confirmation",
];

function isUserProtectedPath(pathname) {
  const normalizedPath = String(pathname || "").toLowerCase();
  return USER_PROTECTED_PATH_PREFIXES.some((prefix) =>
    normalizedPath === prefix || normalizedPath.startsWith(`${prefix}/`)
  );
}

// Global Fetch Interceptor to handle session completion/expiration (401 Unauthorized)
const originalFetch = window.fetch;
window.fetch = async function (...args) {
  try {
    const response = await originalFetch(...args);
    if (response && response.status === 401) {
      if (typeof window !== "undefined") {
        const currentPath = window.location.pathname.toLowerCase();
        const isAdmin = currentPath.startsWith("/admin");

        if (isAdmin) {
          clearAuthSession();
          const loginPath = "/admin/login";
          if (currentPath !== loginPath) {
            window.location.href = loginPath;
          }
        } else {
          if (!isUserProtectedPath(currentPath)) {
            return response;
          }

          clearAuthSession();
          if (currentPath !== "/") {
            window.history.replaceState(null, "", "/");
            window.dispatchEvent(new PopStateEvent("popstate"));
          }
          openAuthModal("login");
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
