import axios from 'axios';
import { useAuth } from '../store/auth';

const BASE = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: BASE,
  withCredentials: true,
  timeout: 15_000,
});

// ── Attach access token to every request ──────────────────────────
api.interceptors.request.use((cfg) => {
  const token = useAuth.getState().accessToken;
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

// ── Silent refresh on 401 TOKEN_EXPIRED ──────────────────────────
let refreshing = false;
let queue = [];

const flush = (err, token) => {
  queue.forEach(p => err ? p.reject(err) : p.resolve(token));
  queue = [];
};

api.interceptors.response.use(
  r => r,
  async err => {
    const orig = err.config;
    const code = err.response?.data?.code;
    const status = err.response?.status;

    if ((status === 401 && code === 'TOKEN_EXPIRED') && !orig._retry) {
      if (refreshing) {
        return new Promise((resolve, reject) => queue.push({ resolve, reject }))
          .then(token => { orig.headers.Authorization = `Bearer ${token}`; return api(orig); });
      }

      orig._retry = true;
      refreshing = true;

      try {
        const { data } = await axios.post(`${BASE}/auth/refresh`, {}, { withCredentials: true });
        useAuth.getState().setToken(data.accessToken);
        flush(null, data.accessToken);
        orig.headers.Authorization = `Bearer ${data.accessToken}`;
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

// ── Silent token rehydration (called once on app boot) ────────────
export const rehydrateToken = async () => {
  try {
    const { data } = await axios.post(`${BASE}/auth/refresh`, {}, { withCredentials: true });
    useAuth.getState().setToken(data.accessToken);
    return true;
  } catch {
    useAuth.getState().logout();
    return false;
  }
};

export default api;