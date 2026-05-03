import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useTeam = create(
  persist(
    (set) => ({
      activeTeamId: null,
      activeRole:   'admin',   // 'admin' | 'member' | 'viewer'
      teams:        [],

      setTeams:  (teams)        => set({ teams }),
      setActive: (teamId, role) => set({ activeTeamId: teamId, activeRole: role }),
      clear:     ()             => set({ activeTeamId: null, activeRole: 'admin', teams: [] }),
    }),
    {
      name: 'vigil-team',
      partialize: s => ({ activeTeamId: s.activeTeamId, activeRole: s.activeRole }),
    }
  )
);

// Returns true for admin + member, false for viewer
export const useCanEdit = () => {
  const role = useTeam(s => s.activeRole);
  return role === 'admin' || role === 'member';
};