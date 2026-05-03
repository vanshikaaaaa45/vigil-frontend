import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuth } from './store/auth';
import { rehydrateToken } from './api/client';
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
import Team       from './pages/Team.jsx';

const qc = new QueryClient({
  defaultOptions: {
    queries: {
      retry:                1,
      staleTime:            30_000,
      gcTime:               5 * 60_000,  // keep cache 5 min (fixes tab-switch data loss)
      refetchOnWindowFocus: true,
    },
  },
});

// ── Spinner shown while restoring session ─────────────────────────
const Spinner = () => (
  <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14 }}>
    <div style={{ width: 36, height: 36, background: 'var(--accent)', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'DM Mono', fontWeight: 900, fontSize: 16, color: '#fff', boxShadow: '0 4px 16px rgba(249,115,22,.4)' }}>V</div>
    <div style={{ width: 20, height: 20, border: '2px solid var(--border2)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
    <span style={{ fontSize: 11, fontFamily: 'DM Mono', color: 'var(--muted)' }}>Restoring session…</span>
  </div>
);

export default function App() {
  const { isAuthenticated } = useAuth();

  // booted = true once we've attempted the token refresh
  const [booted, setBooted] = useState(false);

  useEffect(() => {
    // On every page load, try to restore the access token from the
    // httpOnly cookie. This is what keeps users logged in across refreshes.
    // The cookie survives browser restarts; the in-memory token does not.
    (async () => {
      await rehydrateToken();
      setBooted(true);
    })();
  }, []); // runs exactly once on mount

  if (!booted) return <Spinner />;

  // Guards defined inside so they read live zustand state after boot
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
