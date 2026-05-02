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

// Keep data cached for 5 minutes even when components unmount (tab switching)
const qc = new QueryClient({
  defaultOptions: {
    queries: {
      retry:               1,
      staleTime:           30_000,   // refetch after 30s
      gcTime:              5 * 60_000, // keep in cache for 5 min
      refetchOnWindowFocus: true,
    },
  },
});

// ── Full-page loading spinner ─────────────────────────────────────
const Spinner = () => (
  <div style={{
    minHeight: '100vh', background: 'var(--bg)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexDirection: 'column', gap: 16,
  }}>
    <div style={{ width: 36, height: 36, background: 'var(--accent)', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'DM Mono', fontWeight: 900, fontSize: 16, color: '#fff' }}>V</div>
    <div style={{ width: 22, height: 22, border: '2px solid var(--border2)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
    <span style={{ fontSize: 11, fontFamily: 'DM Mono', color: 'var(--muted)' }}>Restoring session…</span>
  </div>
);

export default function App() {
  const { isAuthenticated } = useAuth();
  // booted = false while we try to restore session from cookie
  const [booted, setBooted] = useState(false);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    // Every page refresh: try to get a new access token from the httpOnly cookie.
    // This is what keeps you logged in across refreshes.
    // Takes ~100-200ms. Shows spinner during this time.
    const boot = async () => {
      if (isAuthenticated) {
        // Zustand says we were logged in — verify the cookie is still valid
        const ok = await rehydrateToken();
        setAuthed(ok);
      } else {
        // Not logged in — skip the refresh attempt
        setAuthed(false);
      }
      setBooted(true);
    };
    boot();
  }, []); // runs ONCE on mount only

  // Show spinner until boot sequence completes
  if (!booted) return <Spinner />;

  // After boot: Guard uses the live zustand state (not the stale `authed` snapshot)
  const Guard = ({ children }) => {
    const ok = useAuth((s) => s.isAuthenticated);
    return ok ? children : <Navigate to="/login" replace />;
  };

  const Public = ({ children }) => {
    const ok = useAuth((s) => s.isAuthenticated);
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
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}