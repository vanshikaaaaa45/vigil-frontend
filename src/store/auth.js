import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuth = create(
  persist(
    (set) => ({
      user:            null,
      accessToken:     null,   // never persisted — lives in memory only
      isAuthenticated: false,

      setAuth:  (user, accessToken) => set({ user, accessToken, isAuthenticated: true }),
      setToken: (accessToken)       => set({ accessToken, isAuthenticated: true }),
      setUser:  (user)              => set({ user }),
      logout:   ()                  => set({ user: null, accessToken: null, isAuthenticated: false }),
    }),
    {
      name: 'vigil-auth',
      // persist ONLY user and isAuthenticated — token always regenerated from cookie
      partialize: (s) => ({ user: s.user, isAuthenticated: s.isAuthenticated }),
    }
  )
);