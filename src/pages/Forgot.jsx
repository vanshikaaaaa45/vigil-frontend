import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';

export default function Forgot() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault(); setLoading(true);
    await api.post('/auth/forgot-password', { email }).catch(() => {});
    setSent(true); setLoading(false);
  };

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', padding:20, background:'var(--bg)' }}>
      <div style={{ width:'100%', maxWidth:400 }}>
        <div style={{ textAlign:'center', marginBottom:32 }}>
          <div style={{ fontSize:36, marginBottom:12 }}>🔑</div>
          <h1 style={{ fontSize:24, fontWeight:800, marginBottom:8 }}>Forgot password?</h1>
          <p style={{ color:'var(--muted)', fontSize:13, fontFamily:'DM Mono' }}>We'll email you a reset link</p>
        </div>
        <div className="card" style={{ padding:28 }}>
          {sent ? (
            <div style={{ textAlign:'center' }}>
              <div style={{ fontSize:32, marginBottom:12 }}>📬</div>
              <p style={{ color:'var(--muted)', fontFamily:'DM Mono', fontSize:13, lineHeight:1.7 }}>
                If that email exists, a reset link has been sent. Check your inbox (and spam folder).
              </p>
            </div>
          ) : (
            <form onSubmit={submit}>
              <div className="field"><label className="label">Email address</label><input className="input" type="email" placeholder="you@company.com" value={email} onChange={e=>setEmail(e.target.value)} required /></div>
              <button type="submit" className="btn btn-primary" style={{ width:'100%', padding:11 }} disabled={loading}>
                {loading ? 'Sending…' : 'Send reset link →'}
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
