import { create } from 'zustand';

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

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: typeof window !== 'undefined' ? localStorage.getItem('voxora_access_token') : null,
  isAuthenticated: false,
  isLoading: true,
  setUser: (user, token) => {
    if (token) {
      localStorage.setItem('voxora_access_token', token);
    }
    set({
      user,
      token: token ?? localStorage.getItem('voxora_access_token'),
      isAuthenticated: !!user,
      isLoading: false,
    });
  },
  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('voxora_access_token');
    }
    set({ user: null, token: null, isAuthenticated: false, isLoading: false });
  },
}));
