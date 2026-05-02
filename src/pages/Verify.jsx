// Verify.jsx
import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../api/client';

export default function Verify() {
  const [p] = useSearchParams();
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    const token = p.get('token');
    if (!token) { setStatus('error'); return; }
    api.get(`/auth/verify-email?token=${token}`)
      .then(() => setStatus('ok'))
      .catch(() => setStatus('error'));
  }, []);

  const icon = { loading:'⏳', ok:'✅', error:'❌' }[status];
  const msg  = { loading:'Verifying your email…', ok:'Email verified! Your account is active.', error:'This link is invalid or has expired.' }[status];

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--bg)' }}>
      <div style={{ textAlign:'center', maxWidth:400, padding:20 }}>
        <div style={{ fontSize:52, marginBottom:16 }}>{icon}</div>
        <h1 style={{ fontSize:24, fontWeight:800, marginBottom:12 }}>{status === 'ok' ? 'You\'re verified!' : status === 'error' ? 'Invalid link' : 'Please wait…'}</h1>
        <p style={{ color:'var(--muted)', fontFamily:'DM Mono', fontSize:13, marginBottom:24, lineHeight:1.6 }}>{msg}</p>
        {status !== 'loading' && <Link to="/login" className="btn btn-primary">Go to login →</Link>}
      </div>
    </div>
  );
}
