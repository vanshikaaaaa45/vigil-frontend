import { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import api from '../api/client';

export default function Reset() {
  const [p]  = useSearchParams();
  const nav  = useNavigate();
  const [pw, setPw]   = useState('');
  const [err, setErr] = useState('');
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault(); setErr(''); setLoading(true);
    try {
      await api.post('/auth/reset-password', { token: p.get('token'), password: pw });
      setDone(true);
      setTimeout(() => nav('/login'), 2500);
    } catch (e) { setErr(e.response?.data?.error || 'Reset failed'); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', padding:20, background:'var(--bg)' }}>
      <div style={{ width:'100%', maxWidth:400 }}>
        <div style={{ textAlign:'center', marginBottom:32 }}>
          <div style={{ fontSize:36, marginBottom:12 }}>🔒</div>
          <h1 style={{ fontSize:24, fontWeight:800, marginBottom:8 }}>Reset password</h1>
        </div>
        <div className="card" style={{ padding:28 }}>
          {done ? (
            <div style={{ textAlign:'center' }}>
              <div style={{ fontSize:32, marginBottom:12 }}>✅</div>
              <p style={{ color:'var(--muted)', fontFamily:'DM Mono', fontSize:13 }}>Password reset! Redirecting to login…</p>
            </div>
          ) : (
            <form onSubmit={submit}>
              {err && <div className="err-box">{err}</div>}
              <div className="field"><label className="label">New password</label><input className="input" type="password" placeholder="Min. 8 characters" value={pw} onChange={e=>setPw(e.target.value)} required minLength={8} /></div>
              <button type="submit" className="btn btn-primary" style={{ width:'100%', padding:11 }} disabled={loading}>
                {loading ? 'Resetting…' : 'Reset password →'}
              </button>
            </form>
          )}
        </div>
        <p style={{ textAlign:'center', marginTop:20, fontSize:13, color:'var(--muted)' }}>
          <Link to="/login" style={{ color:'var(--accent)' }}>← Back to login</Link>
        </p>
      </div>
    </div>
  );
}
