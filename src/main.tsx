import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import axios from 'axios';

import { getApiBaseUrl } from './utils/urlHelper';

// Intercept global fetch and axios to route relative API requests to the resolved backend server automatically
const baseUrl = getApiBaseUrl().replace(/\/$/, '');

// Intercept fetch safely without throwing uncaught errors in strict/sandboxed environments
try {
  const originalFetch = window.fetch;
  
  const customFetch = function(input: RequestInfo | URL, init?: RequestInit) {
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

  // Try standard assignment
  try {
    window.fetch = customFetch;
  } catch (assignError) {
    // Fallback to defineProperty
    Object.defineProperty(window, 'fetch', {
      value: customFetch,
      configurable: true,
      writable: true,
      enumerable: true
    });
  }
} catch (e) {
  console.warn('[Fetch Interception] Safely caught error when overriding global fetch:', e);
}

// Set axios default baseURL
axios.defaults.baseURL = baseUrl;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
