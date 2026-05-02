import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../store/auth';
import api from '../api/client';

export default function Onboarding() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [step, setStep]   = useState(0);
  const [mon, setMon]     = useState({ name:'My API', url:'https://' });
  const [apiKey, setKey]  = useState(null);
  const [loading, setLoading] = useState(false);

  const setup = async () => {
    setLoading(true);
    try {
      await api.post('/monitors', { ...mon, interval_seconds:60 });
      const { data } = await api.post('/keys', { name:'Default Key' });
      setKey(data.rawKey);
      setStep(2);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const Step = ({ n, label }) => (
    <div style={{ display:'flex', alignItems:'center', gap:6 }}>
      <div style={{ width:26, height:26, borderRadius:'50%', background: n <= step ? 'var(--accent)' : 'var(--border2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, color: n <= step ? '#fff' : 'var(--muted)', transition:'all .3s', flexShrink:0 }}>
        {n < step ? '✓' : n+1}
      </div>
      <span style={{ fontSize:11, fontFamily:'DM Mono', color: n === step ? 'var(--text)' : 'var(--muted)' }}>{label}</span>
    </div>
  );

  return (
    <div style={{ minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'40px 20px', background:'var(--bg)' }}>
      {/* Progress */}
      <div style={{ display:'flex', gap:16, marginBottom:48, flexWrap:'wrap', justifyContent:'center' }}>
        {['Welcome','Add monitor','Get your key','Done'].map((l,i) => (
          <div key={i} style={{ display:'flex', alignItems:'center', gap:8 }}>
            <Step n={i} label={l} />
            {i < 3 && <div style={{ width:32, height:2, background: i < step ? 'var(--accent)' : 'var(--border2)', transition:'background .3s' }} />}
          </div>
        ))}
      </div>

      <div style={{ width:'100%', maxWidth:500 }}>
        {/* Step 0: Welcome */}
        {step === 0 && (
          <div style={{ textAlign:'center' }}>
            <div style={{ fontSize:48, marginBottom:16 }}>👋</div>
            <h1 style={{ fontSize:30, fontWeight:800, letterSpacing:'-1px', marginBottom:12 }}>
              Welcome, {user?.name?.split(' ')[0]}!
            </h1>
            <p style={{ color:'var(--muted)', fontFamily:'DM Mono', fontSize:13, lineHeight:1.8, marginBottom:32, maxWidth:400, margin:'0 auto 32px' }}>
              Let's get VIGIL set up in 2 minutes. First monitor, first API key, then you're live.
            </p>
            <button className="btn btn-primary btn-lg" onClick={() => setStep(1)}>Let's go →</button>
          </div>
        )}

        {/* Step 1: Add monitor */}
        {step === 1 && (
          <div>
            <h2 style={{ fontSize:24, fontWeight:800, letterSpacing:'-0.5px', marginBottom:8, textAlign:'center' }}>Monitor your first API</h2>
            <p style={{ color:'var(--muted)', fontFamily:'DM Mono', fontSize:12, marginBottom:24, textAlign:'center', lineHeight:1.7 }}>
              VIGIL checks this URL every minute and emails you if it goes down.
            </p>
            <div className="card" style={{ padding:24 }}>
              <div className="field"><label className="label">API name</label><input className="input" value={mon.name} onChange={e=>setMon(m=>({...m,name:e.target.value}))} placeholder="Payment API" /></div>
              <div className="field"><label className="label">URL to monitor</label><input className="input" value={mon.url} onChange={e=>setMon(m=>({...m,url:e.target.value}))} placeholder="https://api.myapp.com/health" /></div>
              <div style={{ display:'flex', gap:10, marginTop:4 }}>
                <button className="btn btn-ghost" style={{ flex:1 }} onClick={() => nav('/watch')}>Skip</button>
                <button className="btn btn-primary" style={{ flex:1 }} disabled={loading || !mon.url.startsWith('http')} onClick={setup}>
                  {loading ? 'Setting up…' : 'Create & continue →'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: API Key */}
        {step === 2 && apiKey && (
          <div>
            <h2 style={{ fontSize:24, fontWeight:800, letterSpacing:'-0.5px', marginBottom:8, textAlign:'center' }}>Your API key</h2>
            <p style={{ color:'var(--muted)', fontFamily:'DM Mono', fontSize:12, marginBottom:24, textAlign:'center', lineHeight:1.7 }}>
              Save this now — you won't see it again. Install the SDK and paste it in.
            </p>
            <div style={{ background:'rgba(74,222,128,.07)', border:'1px solid rgba(74,222,128,.25)', borderRadius:'var(--rl)', padding:'16px 18px', marginBottom:16 }}>
              <div style={{ fontSize:10, color:'var(--green)', fontFamily:'DM Mono', fontWeight:700, marginBottom:8 }}>YOUR API KEY — COPY NOW</div>
              <code style={{ display:'block', fontFamily:'DM Mono', fontSize:12, color:'var(--teal)', wordBreak:'break-all', lineHeight:1.6 }}>{apiKey}</code>
              <button className="btn btn-ghost btn-sm" style={{ marginTop:10 }} onClick={() => navigator.clipboard.writeText(apiKey)}>📋 Copy</button>
            </div>
            <div className="card" style={{ padding:'14px 18px', marginBottom:16 }}>
              <div style={{ fontFamily:'DM Mono', fontSize:12, lineHeight:2.2 }}>
                <span style={{ color:'var(--muted2)' }}># Install</span><br/>
                <span>npm install <span style={{ color:'var(--teal)' }}>vigil-sdk</span></span><br/>
                <br/>
                <span style={{ color:'var(--muted2)' }}># Use it</span><br/>
                <span><span style={{ color:'var(--purple)' }}>import</span> Vigil <span style={{ color:'var(--purple)' }}>from</span> <span style={{ color:'var(--amber)' }}>'vigil-sdk'</span></span><br/>
                <span><span style={{ color:'var(--purple)' }}>const</span> v = <span style={{ color:'var(--purple)' }}>new</span> Vigil(<span style={{ color:'var(--amber)' }}>'{apiKey.slice(0,20)}…'</span>)</span><br/>
                <span>v.<span style={{ color:'var(--teal)' }}>log</span>(<span style={{ color:'var(--amber)' }}>'info'</span>, <span style={{ color:'var(--amber)' }}>'Server started'</span>)</span>
              </div>
            </div>
            <button className="btn btn-primary btn-lg" style={{ width:'100%' }} onClick={() => setStep(3)}>I've saved it →</button>
          </div>
        )}

        {/* Step 3: Done */}
        {step === 3 && (
          <div style={{ textAlign:'center' }}>
            <div style={{ fontSize:52, marginBottom:16 }}>🎉</div>
            <h1 style={{ fontSize:28, fontWeight:800, letterSpacing:'-1px', marginBottom:12 }}>You're all set!</h1>
            <p style={{ color:'var(--muted)', fontFamily:'DM Mono', fontSize:13, lineHeight:1.8, marginBottom:32, maxWidth:420, margin:'0 auto 32px' }}>
              Your monitor is running. Add the SDK to your backend and start streaming logs. VIGIL will alert you the second anything breaks.
            </p>
            <button className="btn btn-primary btn-lg" onClick={() => nav('/watch')}>Go to dashboard →</button>
          </div>
        )}
      </div>
    </div>
  );
}
