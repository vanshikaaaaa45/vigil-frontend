import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuth = create(
  persist(
    (set, get) => ({
      user:            null,
      accessToken:     null,
      isAuthenticated: false,
      isRehydrating:   true,  // true until we attempt token refresh on boot

      setAuth:       (user, accessToken) => set({ user, accessToken, isAuthenticated: true, isRehydrating: false }),
      setToken:      (accessToken)       => set({ accessToken, isAuthenticated: true, isRehydrating: false }),
      setUser:       (user)              => set({ user }),
      setRehydrating:(v)                 => set({ isRehydrating: v }),
      logout:        ()                  => set({ user: null, accessToken: null, isAuthenticated: false, isRehydrating: false }),
    }),
    {
      name: 'vigil-auth',
      // Only persist user + flag. Token is in memory only (security).
      // On refresh, App.jsx detects missing token and calls /auth/refresh silently.
      partialize: (s) => ({ user: s.user, isAuthenticated: s.isAuthenticated }),
    }
  )
);