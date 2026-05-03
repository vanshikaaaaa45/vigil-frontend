import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuth } from './store/auth';
import { useTeam } from './store/team';
import { rehydrateToken } from './api/client';
import api from './api/client';
import './styles/globals.css';

import Layout     from './components/shared/Layout';
import Landing    from './pages/Landing';
import Login      from './pages/Login';
import Signup     from './pages/Signup';
import Onboarding from './pages/Onboarding';
import Verify     from './pages/Verify';
import Forgot     from './pages/Forgot';
import Reset      from './pages/Reset';
import StatusPage from './pages/StatusPage';
import Watch      from './pages/Watch';
import Stream     from './pages/Stream';
import Relay      from './pages/Relay';
import Keys       from './pages/Keys';
import Settings   from './pages/Settings';
import Team       from './pages/Team';

const qc = new QueryClient({
  defaultOptions: {
    queries: {
      retry:                1,
      staleTime:            30_000,
      gcTime:               5 * 60_000,
      refetchOnWindowFocus: true,
    },
  },
});

const Spinner = () => (
  <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14 }}>
    <div style={{ width: 36, height: 36, background: 'var(--accent)', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'DM Mono', fontWeight: 900, fontSize: 16, color: '#fff' }}>V</div>
    <div style={{ width: 20, height: 20, border: '2px solid var(--border2)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
    <span style={{ fontSize: 11, fontFamily: 'DM Mono', color: 'var(--muted)' }}>Restoring session…</span>
  </div>
);

export default function App() {
  const { isAuthenticated } = useAuth();
  const { activeTeamId, setActive } = useTeam();
  const [booted, setBooted] = useState(false);

  useEffect(() => {
    (async () => {
      if (isAuthenticated) {
        // Step 1: restore access token from cookie
        const ok = await rehydrateToken();

        if (ok) {
          // Step 2: fetch user's teams and set their role in the active team
          // This ensures viewer/member/admin restrictions apply on every page load
          try {
            const { data } = await api.get('/teams');
            const teams = data.teams || [];

            if (teams.length > 0) {
              // Use the previously active team if it still exists,
              // otherwise default to the first team
              const activeTeam = teams.find(t => t.id === activeTeamId) || teams[0];
              setActive(activeTeam.id, activeTeam.role);
            }
          } catch {
            // If teams fetch fails, keep existing role — don't crash the app
          }
        }
      }
      setBooted(true);
    })();
  }, []); // runs once on mount — every page load/refresh

  if (!booted) return <Spinner />;

  const Guard = ({ children }) => {
    const ok = useAuth(s => s.isAuthenticated);
    return ok ? children : <Navigate to="/login" replace />;
  };

  const Public = ({ children }) => {
    const ok = useAuth(s => s.isAuthenticated);
    return ok ? <Navigate to="/watch" replace /> : children;
  };

  return (
    <QueryClientProvider client={qc}>
      <BrowserRouter>
        <Routes>
          {/* ── Public ─────────────────────────────────────────── */}
          <Route path="/"                element={<Landing />} />
          <Route path="/verify-email"    element={<Verify />} />
          <Route path="/forgot-password" element={<Forgot />} />
          <Route path="/reset-password"  element={<Reset />} />
          <Route path="/status/:slug"    element={<StatusPage />} />

          {/* ── Auth only ──────────────────────────────────────── */}
          <Route path="/login"  element={<Public><Login /></Public>} />
          <Route path="/signup" element={<Public><Signup /></Public>} />

          {/* ── Protected ──────────────────────────────────────── */}
          <Route path="/onboarding" element={<Guard><Onboarding /></Guard>} />
          <Route element={<Guard><Layout /></Guard>}>
            <Route path="/watch"    element={<Watch />} />
            <Route path="/stream"   element={<Stream />} />
            <Route path="/relay"    element={<Relay />} />
            <Route path="/keys"     element={<Keys />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/team"     element={<Team />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}