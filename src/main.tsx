import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import axios from 'axios';

// Intercept global fetch and axios to route relative API requests to production server in Capacitor
if (import.meta.env.VITE_API_URL) {
  const baseUrl = import.meta.env.VITE_API_URL.replace(/\/$/, '');
  
  // Intercept fetch
  const originalFetch = window.fetch;
  window.fetch = function(input, init) {
    if (typeof input === 'string' && input.startsWith('/api/')) {
      input = `${baseUrl}${input}`;
    } else if (input instanceof URL && input.pathname.startsWith('/api/')) {
      input = new URL(`${baseUrl}${input.pathname}${input.search}`);
    } else if (input && typeof input === 'object' && 'url' in input && typeof input.url === 'string' && input.url.startsWith('/api/')) {
      // Handle Request object
      const newUrl = `${baseUrl}${input.url}`;
      input = new Request(newUrl, input as RequestInit);
    }
    return originalFetch(input, init);
  };

  // Set axios default baseURL
  axios.defaults.baseURL = baseUrl;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
