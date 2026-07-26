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
  if (typeof window === 'undefined') {
    return PRODUCTION_BACKEND_URL;
  }
  
  if (isNativeApp()) {
    return PRODUCTION_BACKEND_URL;
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
  if (typeof window === 'undefined') {
    return PRODUCTION_BACKEND_URL;
  }

  if (isNativeApp()) {
    return PRODUCTION_BACKEND_URL;
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
                             hostname.endsWith('.github.io');
                             
  if (isFrontendOnlyHost) {
    return PRODUCTION_BACKEND_URL;
  }

  // Otherwise, use current origin
  return origin;
};

/**
 * Generates dynamic sharing links from the current app origin.
 */
export const generateShareLink = (route: string): string => {
  const origin = getAppOrigin();
  const cleanRoute = route.startsWith('/') ? route : `/${route}`;
  return `${origin}${cleanRoute}`;
};
