import { create } from 'zustand';
import type { AuthState, User } from '../types';

// 🔧 Toggle this: true = skip login (dev), false = real auth (production)
const DEV_MODE = false;

interface AuthActions {
  setAuth: (token: string, user: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState & AuthActions>((set) => ({
  token: localStorage.getItem('preproute_token') || (DEV_MODE ? 'dev-mock-token' : null),
  user: localStorage.getItem('preproute_user')
    ? JSON.parse(localStorage.getItem('preproute_user')!)
    : DEV_MODE
      ? { id: 'admin-id', userId: 'vedant-admin', role: 'admin' }
      : null,
  isAuthenticated: !!localStorage.getItem('preproute_token') || DEV_MODE,

  setAuth: (token, user) => {
    localStorage.setItem('preproute_token', token);
    localStorage.setItem('preproute_user', JSON.stringify(user));
    set({ token, user, isAuthenticated: true });
  },

  logout: () => {
    localStorage.removeItem('preproute_token');
    localStorage.removeItem('preproute_user');
    set({ token: null, user: null, isAuthenticated: false });
  },
}));