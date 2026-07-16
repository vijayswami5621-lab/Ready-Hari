/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { AppRouter } from './routes';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAppStore } from './store/useAppStore';
import { useAuthStore } from './store/useAuthStore';
import { useStoreState } from './store/useStoreState';
import { HelmetProvider } from 'react-helmet-async';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from './firebase/config';
import { motion, AnimatePresence } from 'motion/react';
import { ErrorBoundary } from './components/ErrorBoundary';
import { OfflineOverlay } from './components/OfflineOverlay';
import { syncTodayPanchang } from './services/panchangService';
import { AppSettingsProvider } from './contexts/AppSettingsContext';
import { useImageCacheStore } from './store/useImageCacheStore';

const queryClient = new QueryClient();

export default function App() {
  const { isDarkMode } = useAppStore();
  const { user, setUser, isLoading } = useAuthStore();
  const { cart, wishlist, setCart, setWishlist } = useStoreState();
  const startListeningImageCache = useImageCacheStore(state => state.startListening);

  useEffect(() => {
    startListeningImageCache();
  }, [startListeningImageCache]);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  useEffect(() => {
    syncTodayPanchang();
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      if (authUser) {
        try {
          const docRef = doc(db, 'users', authUser.uid);
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists()) {
            const data = docSnap.data();
            setUser(authUser, data);
            
            // Sync cart and wishlist from Firestore on login
            if (data.cart) setCart(data.cart);
            if (data.wishlist) setWishlist(data.wishlist);
            
            // Sync settings
            if (data.settings && data.settings.isDarkMode !== undefined) {
              if (useAppStore.getState().isDarkMode !== data.settings.isDarkMode) {
                useAppStore.getState().toggleDarkMode();
              }
            }
          } else {
            setUser(authUser, { email: authUser.email });
          }
        } catch (error) {
          console.error("Error fetching user data", error);
          setUser(authUser, null);
        }
      } else {
        setUser(null, null);
      }
    });

    return () => unsubscribe();
  }, [setUser, setCart, setWishlist]);

  // Sync cart and wishlist to Firestore when they change
  useEffect(() => {
    if (user && user.uid) {
      const syncToFirestore = async () => {
        try {
          const userRef = doc(db, 'users', user.uid);
          // Recursively sanitize to remove undefined fields from cart & wishlist before writing to Firestore
          const cleanData = JSON.parse(JSON.stringify({ 
            cart: cart || [], 
            wishlist: wishlist || [] 
          }));
          await setDoc(userRef, cleanData, { merge: true });
        } catch (error) {
          console.error("Error syncing store state to Firestore", error);
        }
      };
      
      const timeoutId = setTimeout(syncToFirestore, 1000); // Debounce
      return () => clearTimeout(timeoutId);
    }
  }, [cart, wishlist, user]);

  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <AppSettingsProvider>
          <OfflineOverlay />
          <ErrorBoundary>
            <AppRouter />
          </ErrorBoundary>
        </AppSettingsProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
}
