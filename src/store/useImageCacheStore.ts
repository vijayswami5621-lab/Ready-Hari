import { create } from 'zustand';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config';

interface ImageCacheState {
  globalCacheBuster: number;
  isListening: boolean;
  startListening: () => void;
}

export const useImageCacheStore = create<ImageCacheState>((set, get) => ({
  globalCacheBuster: Date.now(),
  isListening: false,
  startListening: () => {
    if (get().isListening) return;
    
    set({ isListening: true });
    
    const unsub = onSnapshot(doc(db, 'settings', 'cache'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.imageUpdatedAt) {
          set({ globalCacheBuster: data.imageUpdatedAt.toMillis ? data.imageUpdatedAt.toMillis() : data.imageUpdatedAt });
        } else {
          set({ globalCacheBuster: Date.now() });
        }
      }
    }, (error) => {
      console.error("Error listening to cache settings:", error);
    });

    // We intentionally don't provide an unlisten here because it's a global app-level listener.
    // If needed, we could store the unsubscribe function in the state.
  }
}));
