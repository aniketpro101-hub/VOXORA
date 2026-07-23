import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'agent' | 'viewer';
  avatar?: string;
  phone?: string;
}

interface AuthState {
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: UserProfile | null, token?: string | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: typeof window !== 'undefined' ? localStorage.getItem('voxora_access_token') : null,
      isAuthenticated: false,
      isLoading: true,
      setUser: (user, token) => {
        if (token && typeof window !== 'undefined') {
          localStorage.setItem('voxora_access_token', token);
        }
        set({
          user,
          token: token ?? (typeof window !== 'undefined' ? localStorage.getItem('voxora_access_token') : null),
          isAuthenticated: !!user,
          isLoading: false,
        });
      },
      logout: () => {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('voxora_access_token');
          localStorage.removeItem('voxora_auth_storage');
        }
        set({ user: null, token: null, isAuthenticated: false, isLoading: false });
      },
    }),
    {
      name: 'voxora_auth_storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
