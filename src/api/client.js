import axios from 'axios';
import { useAuth } from '../store/auth';
import { useTeam } from '../store/team';

export const BASE = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL:         BASE,
  withCredentials: true,
  timeout:         20_000,
});

// Attach token AND team ID to every request
api.interceptors.request.use((cfg) => {
  const token  = useAuth.getState().accessToken;
  const teamId = useTeam.getState().activeTeamId;
  if (token)  cfg.headers.Authorization = `Bearer ${token}`;
  if (teamId) cfg.headers['X-Team-Id']  = teamId;
  return cfg;
});

// Silent refresh on 401 TOKEN_EXPIRED
let refreshing = false;
let queue = [];
const flush = (err, token) => { queue.forEach(p => err ? p.reject(err) : p.resolve(token)); queue = []; };

api.interceptors.response.use(
  r => r,
  async (err) => {
    const orig   = err.config;
    const status = err.response?.status;
    const code   = err.response?.data?.code;

    if (status === 401 && code === 'TOKEN_EXPIRED' && !orig._retry) {
      if (refreshing) {
        return new Promise((resolve, reject) => queue.push({ resolve, reject }))
          .then(token => { orig.headers.Authorization = `Bearer ${token}`; return api(orig); });
      }
      orig._retry = true;
      refreshing  = true;
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

// Restore token — tries cookie first, falls back to stored token
export const rehydrateToken = async () => {
  try {
    const { data } = await axios.post(`${BASE}/auth/refresh`, {}, { withCredentials: true });
    useAuth.getState().setToken(data.accessToken);
    return true;
  } catch {
    const stored = useAuth.getState().accessToken;
    if (stored) {
      try {
        await axios.get(`${BASE}/auth/me`, {
          headers: { Authorization: `Bearer ${stored}` },
          withCredentials: true,
        });
        return true;
      } catch {
        useAuth.getState().logout();
        return false;
      }
    }
    useAuth.getState().logout();
    return false;
  }
};

export default api;