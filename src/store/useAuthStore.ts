import { create } from 'zustand';
import { User } from 'firebase/auth';

interface AuthState {
  user: User | null;
  userData: any | null; // Firestore user data
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: User | null, userData?: any) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  userData: null,
  isAuthenticated: false,
  isLoading: true,
  setUser: (user, userData = null) => 
    set({ user, userData, isAuthenticated: !!user, isLoading: false }),
  setLoading: (loading) => set({ isLoading: loading }),
  logout: () => set({ user: null, userData: null, isAuthenticated: false }),
}));
