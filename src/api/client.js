import axios from 'axios';
import { useAuth } from '../store/auth';

// ── Base URL ──────────────────────────────────────────────────────
// In dev: Vite proxy rewrites /api → localhost:5001
// In prod: direct Railway URL from env var
export const BASE = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL:          BASE,
  withCredentials:  true,   // MUST be true — sends the httpOnly refresh cookie
  timeout:          20_000, // Railway cold starts can be slow
});

// ── Request: attach access token ──────────────────────────────────
api.interceptors.request.use((cfg) => {
  const token = useAuth.getState().accessToken;
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

// ── Response: silent token refresh on 401 ────────────────────────
let refreshing = false;
let queue      = [];

const flush = (err, token) => {
  queue.forEach(p => err ? p.reject(err) : p.resolve(token));
  queue = [];
};

api.interceptors.response.use(
  r => r,
  async (err) => {
    const orig   = err.config;
    const status = err.response?.status;
    const code   = err.response?.data?.code;

    // Only intercept TOKEN_EXPIRED — not generic 401s (wrong API key etc)
    if (status === 401 && code === 'TOKEN_EXPIRED' && !orig._retry) {
      if (refreshing) {
        // Queue concurrent requests while refresh is in progress
        return new Promise((resolve, reject) => queue.push({ resolve, reject }))
          .then(token => {
            orig.headers.Authorization = `Bearer ${token}`;
            return api(orig);
          });
      }

      orig._retry  = true;
      refreshing   = true;

      try {
        const { data } = await axios.post(
          `${BASE}/auth/refresh`,
          {},
          { withCredentials: true }   // send the httpOnly cookie
        );
        const newToken = data.accessToken;
        useAuth.getState().setToken(newToken);
        flush(null, newToken);
        orig.headers.Authorization = `Bearer ${newToken}`;
        return api(orig);
      } catch (e) {
        flush(e, null);
        useAuth.getState().logout();
        window.location.href = '/login';
        return Promise.reject(e);
      } finally {
        refreshing = false;
      }
    }

    return Promise.reject(err);
  }
);

// ── Boot-time token rehydration ───────────────────────────────────
// Called once in App.jsx on every page load.
// Reads the httpOnly cookie (which survives refresh) → gets a fresh access token.
export const rehydrateToken = async () => {
  try {
    const { data } = await axios.post(
      `${BASE}/auth/refresh`,
      {},
      { withCredentials: true }
    );
    useAuth.getState().setToken(data.accessToken);
    return true;
  } catch {
    // Cookie expired / missing → log out cleanly
    useAuth.getState().logout();
    return false;
  }
};

export default api;