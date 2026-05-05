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
      partialize: s => ({
        activeTeamId: s.activeTeamId,
        activeRole:   s.activeRole,  // ← persist role so it survives refresh
      }),
    }
  )
);

export const useCanEdit = () => {
  const role = useTeam(s => s.activeRole);
  return role === 'admin' || role === 'member';
};