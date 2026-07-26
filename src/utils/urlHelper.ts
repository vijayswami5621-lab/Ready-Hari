import { Capacitor } from '@capacitor/core';

export const PRODUCTION_BACKEND_URL = "https://ready-hari.onrender.com";

export const isNativeApp = (): boolean => {
  try {
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
};

/**
 * Returns the centralized origin of the application.
 * In a browser, it detects window.location.origin.
 * In native Capacitor, it falls back to the production API URL.
 */
export const getAppOrigin = (): string => {
  const envApiUrl = import.meta.env.VITE_API_URL;
  const prodUrl = envApiUrl || PRODUCTION_BACKEND_URL;

  if (typeof window === 'undefined') {
    return prodUrl;
  }
  
  if (isNativeApp()) {
    return prodUrl;
  }
  
  return window.location.origin;
};

/**
 * Automatically determines the API base URL.
 * - Native Capacitor: Configured production backend URL (https://ready-hari.onrender.com)
 * - Local Development: http://localhost:3000 (or current origin if served from port 3000)
 * - Deployed Browser (Render, VPS, custom domain): Current origin if backend is on same host, 
 *   otherwise falls back to production backend URL.
 */
export const getApiBaseUrl = (): string => {
  const envApiUrl = import.meta.env.VITE_API_URL;
  const prodUrl = envApiUrl || PRODUCTION_BACKEND_URL;

  if (typeof window === 'undefined') {
    return prodUrl;
  }

  if (isNativeApp()) {
    return prodUrl;
  }

  const { hostname, origin } = window.location;

  // Local development
  if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.startsWith('192.168.')) {
    if (window.location.port === '3000') {
      return origin;
    }
    // Standard backend is port 3000 in dev
    return `${window.location.protocol}//${hostname}:3000`;
  }

  // Deployed frontend-only hosts where the backend is not on the same host
  const isFrontendOnlyHost = hostname.endsWith('.netlify.app') || 
                             hostname.endsWith('.vercel.app') || 
                             hostname.endsWith('.github.io') ||
                             hostname.includes('netlify') ||
                             hostname.includes('github') ||
                             hostname.includes('vercel');
                             
  if (isFrontendOnlyHost) {
    return prodUrl;
  }

  // If we are running on AI Studio run.app preview container, use same origin
  if (hostname.includes('.run.app') || hostname.includes('web-demo')) {
    return origin;
  }

  // Otherwise, fallback to the production backend to ensure API calls never break
  return prodUrl;
};

/**
 * Generates dynamic sharing links from the current app origin.
 */
export const generateShareLink = (route: string): string => {
  const origin = getAppOrigin();
  const cleanRoute = route.startsWith('/') ? route : `/${route}`;
  return `${origin}${cleanRoute}`;
};
