import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../store/auth';
import { useTeam } from '../store/team';

export default function Demo() {
  const [status, setStatus] = useState('Launching demo…');
  const { setAuth }         = useAuth();
  const { setActive }       = useTeam();
  const nav                 = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        setStatus('Signing into demo account…');
        const { data } = await api.post('/auth/login', {
          email:    'demo@vigil.dev',
          password: 'Demo@12345',
        });
        setAuth(data.user, data.accessToken);

        setStatus('Loading your workspace…');
        try {
          const { data: td } = await api.get('/teams');
          const teams = td.teams || [];
          if (teams.length > 0) setActive(teams[0].id, teams[0].role);
        } catch {}

        // Clear onboarding so demo users always see the checklist
        localStorage.removeItem('vigil-onboarding-dismissed');

        setStatus('Ready!');
        nav('/watch');
      } catch {
        setStatus('Demo unavailable — try signing up instead');
        setTimeout(() => nav('/signup'), 2000);
      }
    })();
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
      <div style={{ width: 44, height: 44, background: '#f97316', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'DM Mono', fontWeight: 900, fontSize: 20, color: '#fff', boxShadow: '0 4px 16px rgba(249,115,22,.4)' }}>V</div>
      <div style={{ width: 24, height: 24, border: '2px solid #1e1e2e', borderTopColor: '#f97316', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
      <div style={{ fontSize: 14, fontFamily: 'DM Mono', color: '#606080' }}>{status}</div>
      <div style={{ fontSize: 11, fontFamily: 'DM Mono', color: '#404060', marginTop: -10 }}>demo@vigil.dev — explore freely</div>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  );
}