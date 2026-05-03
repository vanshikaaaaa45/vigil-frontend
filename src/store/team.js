import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useTeam = create(
  persist(
    (set) => ({
      activeTeamId: null,
      activeRole:   null,    // null = not loaded yet, always fetch from API on boot
      teams:        [],

      setTeams:  (teams)        => set({ teams }),
      setActive: (teamId, role) => set({ activeTeamId: teamId, activeRole: role }),
      clear:     ()             => set({ activeTeamId: null, activeRole: null, teams: [] }),
    }),
    {
      name: 'vigil-team',
      // Only persist the activeTeamId — NEVER persist role
      // Role must always come from the API so it can't be spoofed
      partialize: s => ({ activeTeamId: s.activeTeamId }),
    }
  )
);

// Returns true if user can create/edit/delete
// null role = still loading, default to false (safer — viewer sees read-only briefly)
export const useCanEdit = () => {
  const role = useTeam(s => s.activeRole);
  return role === 'admin' || role === 'member';
};