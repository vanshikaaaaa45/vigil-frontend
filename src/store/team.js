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
      // Persist BOTH — teamId needed to send X-Team-Id header
      // role needed so restrictions work on page refresh
      partialize: s => ({
        activeTeamId: s.activeTeamId,
        activeRole:   s.activeRole,
      }),
    }
  )
);

export const useCanEdit = () => {
  const role = useTeam(s => s.activeRole);
  return role === 'admin' || role === 'member';
};