import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuth } from './store/auth';
import { rehydrateToken } from './api/client';
import './styles/globals.css';

import Layout      from './components/shared/Layout';
import Landing     from './pages/Landing';
import Login       from './pages/Login';
import Signup      from './pages/Signup';
import Onboarding  from './pages/Onboarding';
import Verify      from './pages/Verify';
import Forgot      from './pages/Forgot';
import Reset       from './pages/Reset';
import StatusPage  from './pages/StatusPage';
import Watch       from './pages/Watch';
import Stream      from './pages/Stream';
import Relay       from './pages/Relay';
import Keys        from './pages/Keys';
import Settings    from './pages/Settings';

const qc = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000, refetchOnWindowFocus: true },
  },
});

// ── Route guards ──────────────────────────────────────────────────
const Guard = ({ children }) => {
  const { isAuthenticated, isRehydrating } = useAuth();
  if (isRehydrating) return <Spinner />;
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

const Public = ({ children }) => {
  const { isAuthenticated, isRehydrating } = useAuth();
  if (isRehydrating) return <Spinner />;
  return isAuthenticated ? <Navigate to="/watch" replace /> : children;
};

const Spinner = () => (
  <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
    <div style={{ width: 36, height: 36, background: 'var(--accent)', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'DM Mono', fontWeight: 900, fontSize: 16, color: '#fff' }}>V</div>
    <div style={{ width: 24, height: 24, border: '2px solid var(--border2)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
  </div>
);

export default function App() {
  const { isAuthenticated, setRehydrating } = useAuth();
  const [booted, setBooted] = useState(false);

  // ── Fix: on every page refresh, silently get a new access token ──
  // The refresh token is in an httpOnly cookie — we just call /auth/refresh
  // and if it works, we're logged in. If not, we redirect to /login.
  useEffect(() => {
    const boot = async () => {
      if (isAuthenticated) {
        // User appears logged in from localStorage — verify by refreshing token
        await rehydrateToken();
      } else {
        setRehydrating(false);
      }
      setBooted(true);
    };
    boot();
  }, []); // runs once on mount

  if (!booted) return <Spinner />;

  return (
    <QueryClientProvider client={qc}>
      <BrowserRouter>
        <Routes>
          {/* Public — no auth needed */}
          <Route path="/"                element={<Landing />} />
          <Route path="/verify-email"    element={<Verify />} />
          <Route path="/forgot-password" element={<Forgot />} />
          <Route path="/reset-password"  element={<Reset />} />
          <Route path="/status/:slug"    element={<StatusPage />} />

          {/* Auth — redirect if already logged in */}
          <Route path="/login"  element={<Public><Login /></Public>} />
          <Route path="/signup" element={<Public><Signup /></Public>} />

          {/* Protected */}
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