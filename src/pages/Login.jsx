import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../store/auth';
import { useTeam } from '../store/team';

export default function Login() {
  const [f, setF] = useState({ email: '', password: '' });
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);
  const { setAuth } = useAuth();
  const { activeTeamId, setActive } = useTeam();
  const nav = useNavigate();

  const submit = async (e) => {
    e.preventDefault(); setErr(''); setLoading(true);
    try {
      const { data } = await api.post('/auth/login', f);

      // Step 1: store user + token (token now persisted in localStorage)
      setAuth(data.user, data.accessToken);

      // Step 2: immediately fetch teams to get real role
      // Token is now in memory so this call will succeed
      try {
        const teamsRes = await api.get('/teams');
        const teams = teamsRes.data.teams || [];
        if (teams.length > 0) {
          const active = teams.find(t => t.id === activeTeamId) || teams[0];
          setActive(active.id, active.role);
        }
      } catch {
        // Teams fetch failed — not fatal, role stays null (viewer-safe default)
      }

      nav('/watch');
    } catch (e) { setErr(e.response?.data?.error || 'Login failed'); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', padding:20, background:'var(--bg)' }}>
      <div style={{ width:'100%', maxWidth:400 }}>
        <div style={{ textAlign:'center', marginBottom:32 }}>
          <div style={{ width:40, height:40, background:'var(--accent)', borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'DM Mono', fontWeight:900, fontSize:18, color:'#fff', margin:'0 auto 16px' }}>V</div>
          <h1 style={{ fontSize:26, fontWeight:800, letterSpacing:'-0.5px', marginBottom:6 }}>Welcome back</h1>
          <p style={{ color:'var(--muted)', fontSize:13, fontFamily:'DM Mono' }}>Sign in to your VIGIL dashboard</p>
        </div>

        <div className="card" style={{ padding:28 }}>
          {err && <div className="err-box">{err}</div>}
          <form onSubmit={submit}>
            <div className="field"><label className="label">Email</label><input className="input" type="email" placeholder="you@company.com" value={f.email} onChange={e => setF(p=>({...p,email:e.target.value}))} required /></div>
            <div className="field"><label className="label">Password</label><input className="input" type="password" placeholder="••••••••" value={f.password} onChange={e => setF(p=>({...p,password:e.target.value}))} required /></div>
            <div style={{ textAlign:'right', marginBottom:18 }}>
              <Link to="/forgot-password" style={{ fontSize:12, color:'var(--accent)', fontFamily:'DM Mono' }}>Forgot password?</Link>
            </div>
            <button type="submit" className="btn btn-primary" style={{ width:'100%', padding:11 }} disabled={loading}>
              {loading ? 'Signing in…' : 'Sign in →'}
            </button>
          </form>
        </div>
        <p style={{ textAlign:'center', marginTop:20, fontSize:13, color:'var(--muted)' }}>
          No account? <Link to="/signup" style={{ color:'var(--accent)', fontWeight:700 }}>Create one free</Link>
        </p>
      </div>
    </div>
  );
}