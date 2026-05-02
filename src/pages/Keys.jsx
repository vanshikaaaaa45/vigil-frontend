import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/client';

export default function Keys() {
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [keyName, setKeyName]       = useState('');
  const [revealed, setRevealed]     = useState(null);
  const [copied, setCopied]         = useState(false);

  const { data: keys = [] } = useQuery({ queryKey: ['api-keys'], queryFn: () => api.get('/keys').then(r => r.data.keys) });

  const create = useMutation({
    mutationFn: () => api.post('/keys', { name: keyName || 'Default Key' }),
    onSuccess: (r) => { setRevealed(r.data.rawKey); setShowCreate(false); setKeyName(''); qc.invalidateQueries({ queryKey: ['api-keys'] }); },
  });
  const del = useMutation({
    mutationFn: id => api.delete(`/keys/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['api-keys'] }),
  });

  const copy = (text) => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="topbar">
        <div>
          <div className="topbar-title">API Keys</div>
          <div className="topbar-sub">Use X-API-Key header · raw key shown only once at creation</div>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setShowCreate(true)}>+ Create key</button>
      </div>

      <div className="page-scroll">
        {/* New key reveal */}
        {revealed && (
          <div style={{ background: 'rgba(34,211,165,.06)', border: '1px solid rgba(34,211,165,.2)', borderRadius: 10, padding: '16px 18px', marginBottom: 16 }} className="anim-up">
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--green)', marginBottom: 10 }}>✓ API key created — copy it now, you will never see it again</div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <code style={{ flex: 1, fontFamily: 'DM Mono', fontSize: 12, background: 'var(--bg3)', padding: '9px 13px', borderRadius: 6, border: '1px solid var(--border2)', color: 'var(--teal)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{revealed}</code>
              <button className="btn btn-ghost btn-sm" onClick={() => copy(revealed)}>{copied ? '✓ Copied' : '📋 Copy'}</button>
              <button className="btn btn-ghost btn-sm" onClick={() => setRevealed(null)}>Dismiss</button>
            </div>
          </div>
        )}

        {/* Keys table */}
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-head"><span className="card-title">Active keys</span><span className="card-meta">{keys.length} total</span></div>
          {keys.length === 0 ? (
            <div className="empty">
              <div className="empty-icon">⚿</div>
              <div className="empty-h">No API keys yet</div>
              <div className="empty-p">Create a key to authenticate the SDK and send logs, events, and relay traffic to VIGIL from your backend.</div>
              <button className="btn btn-primary" onClick={() => setShowCreate(true)}>+ Create first key</button>
            </div>
          ) : (
            <>
              <div className="thead" style={{ gridTemplateColumns: '2fr 1fr 1fr 130px 90px' }}>
                <span>Key</span><span>Created</span><span>Last used</span><span>Permissions</span><span></span>
              </div>
              {keys.map(k => (
                <div key={k.id} className="trow" style={{ gridTemplateColumns: '2fr 1fr 1fr 130px 90px' }}>
                  <div><div className="tname">{k.name}</div><div className="tsub" style={{ fontFamily: 'DM Mono' }}>{k.key_prefix}</div></div>
                  <div style={{ fontFamily: 'DM Mono', fontSize: 12, color: 'var(--muted)' }}>{new Date(k.created_at).toLocaleDateString()}</div>
                  <div style={{ fontFamily: 'DM Mono', fontSize: 12, color: 'var(--muted)' }}>{k.last_used ? new Date(k.last_used).toLocaleDateString() : 'Never'}</div>
                  <span className={`pill ${k.permissions === 'full' ? 'pill-purple' : 'pill-amber'}`}>{k.permissions === 'full' ? 'Full access' : 'Read only'}</span>
                  <button className="btn btn-danger btn-sm" onClick={() => { if (confirm('Delete this key? Any SDK using it stops working immediately.')) del.mutate(k.id); }}>Delete</button>
                </div>
              ))}
            </>
          )}
        </div>

        {/* SDK reference */}
        <div className="card">
          <div className="card-head"><span className="card-title">SDK quick start</span></div>
          <div style={{ padding: '16px 18px' }}>
            <p style={{ fontSize: 12, fontFamily: 'DM Mono', color: 'var(--muted)', marginBottom: 14, lineHeight: 1.8 }}>
              Install the SDK, initialize with your key, then call <code style={{ color: 'var(--teal)' }}>vigil.log()</code> and <code style={{ color: 'var(--teal)' }}>vigil.event()</code> anywhere in your backend.
            </p>
            <div className="code-block">
              <div style={{ color: 'var(--muted)' }}># 1. Install</div>
              <div>npm install <span style={{ color: 'var(--teal)' }}>vigil-sdk</span></div>
              <br/>
              <div style={{ color: 'var(--muted)' }}># 2. Initialize once at startup</div>
              <div><span style={{ color: 'var(--purple)' }}>import</span> Vigil <span style={{ color: 'var(--purple)' }}>from</span> <span style={{ color: 'var(--amber)' }}>'vigil-sdk'</span></div>
              <div><span style={{ color: 'var(--purple)' }}>const</span> vigil = <span style={{ color: 'var(--purple)' }}>new</span> Vigil(<span style={{ color: 'var(--amber)' }}>'{keys[0]?.key_prefix?.replace('…','') || 'vgl_live_...'}'</span>, {'{ service: "my-api" }'})</div>
              <br/>
              <div style={{ color: 'var(--muted)' }}># 3. Log from anywhere</div>
              <div>vigil.<span style={{ color: 'var(--teal)' }}>error</span>(<span style={{ color: 'var(--amber)' }}>'Payment failed'</span>, {'{ orderId, amount, error: e.message }'})</div>
              <div>vigil.<span style={{ color: 'var(--teal)' }}>info</span>(<span style={{ color: 'var(--amber)' }}>'User signed up'</span>, {'{ userId, plan }'})</div>
              <br/>
              <div style={{ color: 'var(--muted)' }}># 4. Route webhook events</div>
              <div>vigil.<span style={{ color: 'var(--teal)' }}>event</span>(<span style={{ color: 'var(--amber)' }}>'payments'</span>, <span style={{ color: 'var(--amber)' }}>'charge.created'</span>, stripePayload)</div>
            </div>
          </div>
        </div>
      </div>

      {showCreate && (
        <div className="overlay" onClick={e => e.target === e.currentTarget && setShowCreate(false)}>
          <div className="modal">
            <div className="modal-title">Create API key</div>
            <div className="field"><label className="label">Key name</label><input className="input" placeholder="Production" value={keyName} onChange={e => setKeyName(e.target.value)} autoFocus /></div>
            <div style={{ fontSize: 11, fontFamily: 'DM Mono', color: 'var(--muted)', background: 'var(--bg3)', padding: '10px 12px', borderRadius: 6, marginBottom: 16, lineHeight: 1.7 }}>
              The raw key is shown <strong style={{ color: 'var(--text)' }}>once</strong> after creation. Store it in your environment variables immediately — it cannot be recovered.
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setShowCreate(false)}>Cancel</button>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => create.mutate()} disabled={create.isPending}>{create.isPending ? 'Creating…' : 'Create key'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}