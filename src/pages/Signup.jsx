import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../store/auth';

export default function Signup() {
  const [f, setF] = useState({ name:'', email:'', password:'' });
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);
  const { setAuth } = useAuth();
  const nav = useNavigate();

  const submit = async (e) => {
    e.preventDefault(); setErr(''); setLoading(true);
    try {
      const { data } = await api.post('/auth/register', f);
      setAuth(data.user, data.accessToken);
      nav('/onboarding');
    } catch (e) { setErr(e.response?.data?.error || 'Signup failed'); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', padding:20, background:'var(--bg)' }}>
      <div style={{ width:'100%', maxWidth:420 }}>
        <div style={{ textAlign:'center', marginBottom:32 }}>
          <div style={{ width:40, height:40, background:'var(--accent)', borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'DM Mono', fontWeight:900, fontSize:18, color:'#fff', margin:'0 auto 16px' }}>V</div>
          <h1 style={{ fontSize:26, fontWeight:800, letterSpacing:'-0.5px', marginBottom:6 }}>Start for free</h1>
          <p style={{ color:'var(--muted)', fontSize:13, fontFamily:'DM Mono' }}>Full observability in 2 minutes</p>
        </div>

        <div className="card" style={{ padding:28 }}>
          {err && <div className="err-box">{err}</div>}
          <form onSubmit={submit}>
            <div className="field"><label className="label">Full name</label><input className="input" placeholder="Your Name" value={f.name} onChange={e=>setF(p=>({...p,name:e.target.value}))} required /></div>
            <div className="field"><label className="label">Work email</label><input className="input" type="email" placeholder="you@company.com" value={f.email} onChange={e=>setF(p=>({...p,email:e.target.value}))} required /></div>
            <div className="field"><label className="label">Password</label><input className="input" type="password" placeholder="Min. 8 characters" value={f.password} onChange={e=>setF(p=>({...p,password:e.target.value}))} required minLength={8} /></div>
            <button type="submit" className="btn btn-primary" style={{ width:'100%', padding:11, marginTop:4 }} disabled={loading}>
              {loading ? 'Creating…' : 'Create free account →'}
            </button>
          </form>
          <p style={{ fontSize:11, color:'var(--muted2)', textAlign:'center', marginTop:14, fontFamily:'DM Mono' }}>By signing up you agree to our Terms of Service</p>
        </div>
        <p style={{ textAlign:'center', marginTop:20, fontSize:13, color:'var(--muted)' }}>
          Already have an account? <Link to="/login" style={{ color:'var(--accent)', fontWeight:700 }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}
