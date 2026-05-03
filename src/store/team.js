import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useTeam = create(
  persist(
    (set) => ({
      activeTeamId: null,
      activeRole:   null,

      setActive: (teamId, role) => set({ activeTeamId: teamId, activeRole: role }),
      clear:     ()             => set({ activeTeamId: null, activeRole: null }),
    }),
    {
      name: 'vigil-team',
      // NEVER persist role — always fetch fresh from API
      partialize: s => ({ activeTeamId: s.activeTeamId }),
    }
  )
);

// true = admin or member (can create/edit/delete)
// false = viewer OR role not loaded yet
// This means on first load, buttons are hidden until role is confirmed
export const useCanEdit = () => {
  const role = useTeam(s => s.activeRole);
  if (!role) return false; // not loaded yet = safe default = no buttons
  return role === 'admin' || role === 'member';
};