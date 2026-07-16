import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AppState {
  hasCompletedOnboarding: boolean;
  completeOnboarding: () => void;
  isSplashComplete: boolean;
  setSplashComplete: (status: boolean) => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  
  // Settings
  pushNotifications: boolean;
  togglePushNotifications: () => void;
  videoQuality: 'Auto' | '720p' | '1080p';
  setVideoQuality: (q: 'Auto' | '720p' | '1080p') => void;
  downloadQuality: '720p' | '1080p';
  setDownloadQuality: (q: '720p' | '1080p') => void;
  language: string;
  setLanguage: (lang: string) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      hasCompletedOnboarding: false,
      completeOnboarding: () => set({ hasCompletedOnboarding: true }),
      isSplashComplete: false,
      setSplashComplete: (status) => set({ isSplashComplete: status }),
      isDarkMode: false,
      toggleDarkMode: () => set((state) => ({ isDarkMode: !state.isDarkMode })),
      
      pushNotifications: true,
      togglePushNotifications: () => set((state) => ({ pushNotifications: !state.pushNotifications })),
      videoQuality: 'Auto',
      setVideoQuality: (q) => set({ videoQuality: q }),
      downloadQuality: '720p',
      setDownloadQuality: (q) => set({ downloadQuality: q }),
      language: 'English',
      setLanguage: (lang) => set({ language: lang }),
    }),
    {
      name: 'hari-pathshala-app-store',
      partialize: (state) => ({ 
        hasCompletedOnboarding: state.hasCompletedOnboarding,
        isDarkMode: state.isDarkMode,
        pushNotifications: state.pushNotifications,
        videoQuality: state.videoQuality,
        downloadQuality: state.downloadQuality,
        language: state.language
      }),
    }
  )
);
