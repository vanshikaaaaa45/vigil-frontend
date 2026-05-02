import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { io } from 'socket.io-client';
import { useAuth } from '../store/auth';
import api from '../api/client';

const LEVEL_COLOR = { error:'var(--red)',   warn:'var(--amber)',  info:'var(--blue2)',  debug:'var(--muted)' };
const LEVEL_BG    = { error:'rgba(244,63,94,.1)', warn:'rgba(245,158,11,.1)', info:'rgba(99,102,241,.1)', debug:'rgba(96,96,128,.08)' };

function LogDrawer({ log, onClose }) {
  const meta = log?.meta || {};
  return (
    <div className="overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 560 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <div className="modal-title" style={{ marginBottom: 3 }}>Log detail</div>
            <div style={{ fontSize: 11, fontFamily: 'DM Mono', color: 'var(--muted)' }}>
              {new Date(log.timestamp).toLocaleString()} · {log.service}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ padding: '3px 8px', borderRadius: 4, fontSize: 10, fontWeight: 600, background: LEVEL_BG[log.level], color: LEVEL_COLOR[log.level], fontFamily: 'DM Mono' }}>
              {log.level?.toUpperCase()}
            </span>
            <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
          </div>
        </div>
        <div style={{ background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: 7, padding: '12px 14px', marginBottom: 12 }}>
          <div className="label" style={{ marginBottom: 6 }}>Message</div>
          <div style={{ fontSize: 13, lineHeight: 1.7, wordBreak: 'break-word', color: 'var(--text)' }}>{log.message}</div>
        </div>
        <div style={{ background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: 7, padding: '12px 14px' }}>
          <div className="label" style={{ marginBottom: 8 }}>Metadata</div>
          {Object.keys(meta).length === 0 ? (
            <div style={{ fontSize: 12, color: 'var(--muted)', fontFamily: 'DM Mono' }}>No metadata attached</div>
          ) : Object.entries(meta).map(([k, v]) => (
            <div key={k} style={{ display: 'flex', gap: 12, fontFamily: 'DM Mono', fontSize: 12, padding: '4px 0', borderBottom: '1px solid var(--border)' }}>
              <span style={{ color: 'var(--purple)', minWidth: 120, flexShrink: 0 }}>{k}</span>
              <span style={{ color: 'var(--teal)', wordBreak: 'break-all' }}>{typeof v === 'object' ? JSON.stringify(v) : String(v)}</span>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => navigator.clipboard.writeText(JSON.stringify(log, null, 2))}>📋 Copy JSON</button>
        </div>
      </div>
    </div>
  );
}

const PAGE = 50;

export default function Stream() {
  const { accessToken } = useAuth();
  const qc = useQueryClient();
  const [live, setLive]         = useState([]);
  const [paused, setPaused]     = useState(false);
  const [filter, setFilter]     = useState({ service: '', level: '', search: '' });
  const [page, setPage]         = useState(0);
  const [allHist, setAllHist]   = useState([]);
  const [drawer, setDrawer]     = useState(null);
  const [showRule, setShowRule] = useState(false);
  const [ruleF, setRuleF]       = useState({ name: '', service: '', level: 'error', threshold: 5, window_seconds: 300 });
  const endRef = useRef(null);

  const { data: stats }         = useQuery({ queryKey: ['log-stats'],   queryFn: () => api.get('/logs/stats').then(r => r.data.stats), refetchInterval: 30_000 });
  const { data: services = [] } = useQuery({ queryKey: ['log-svc'],    queryFn: () => api.get('/logs/services').then(r => r.data.services) });
  const { data: rules = [] }    = useQuery({ queryKey: ['log-rules'],  queryFn: () => api.get('/logs/rules').then(r => r.data.rules) });
  const { data: hist = [], isFetching } = useQuery({
    queryKey: ['logs', filter, page],
    queryFn: () => api.get('/logs', { params: { service: filter.service || undefined, level: filter.level || undefined, search: filter.search || undefined, limit: PAGE, offset: page * PAGE } }).then(r => r.data.logs),
  });

  useEffect(() => { if (page === 0) setAllHist(hist); else setAllHist(p => [...p, ...hist]); }, [hist]);
  useEffect(() => { setPage(0); setAllHist([]); }, [filter]);

  useEffect(() => {
    const s = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5001');
    s.emit('auth', accessToken);
    s.on('log:new', log => { if (!paused) setLive(p => [log, ...p].slice(0, 300)); });
    return () => s.disconnect();
  }, [accessToken, paused]);

  useEffect(() => { if (!paused) endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [live, paused]);

  const shown = live.length > 0 ? live : allHist;

  const createRule = useMutation({ mutationFn: () => api.post('/logs/rules', ruleF), onSuccess: () => { qc.invalidateQueries({ queryKey: ['log-rules'] }); setShowRule(false); } });
  const delRule    = useMutation({ mutationFn: id => api.delete(`/logs/rules/${id}`), onSuccess: () => qc.invalidateQueries({ queryKey: ['log-rules'] }) });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="topbar">
        <div>
          <div className="topbar-title">Stream</div>
          <div className="topbar-sub">Live log aggregation · real-time via WebSocket</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className={`btn btn-sm ${paused ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setPaused(p => !p)}>
            {paused ? '▶ Resume' : '⏸ Pause'}
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => setShowRule(true)}>+ Alert Rule</button>
        </div>
      </div>

      <div className="page-scroll">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 18 }}>
          {[
            ['Logs (24h)', Number(stats?.last_24h || 0).toLocaleString(), 'all services', 'var(--text)'],
            ['Errors (1h)', stats?.errors_1h || 0, `${stats?.errors_24h || 0} in 24h`, +stats?.errors_1h > 0 ? 'var(--red)' : 'var(--green)'],
            ['Alert rules', rules.length, `${rules.filter(r => r.last_triggered).length} triggered`, 'var(--text)'],
          ].map(([label, val, sub, color]) => (
            <div key={label} className="stat">
              <div className="stat-label">{label}</div>
              <div className="stat-value" style={{ color }}>{val}</div>
              <div className="stat-sub">{sub}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <select className="input" style={{ width: 170, flex: 'none' }} value={filter.service} onChange={e => setFilter(p => ({ ...p, service: e.target.value }))}>
            <option value="">All services</option>
            {services.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select className="input" style={{ width: 150, flex: 'none' }} value={filter.level} onChange={e => setFilter(p => ({ ...p, level: e.target.value }))}>
            <option value="">All levels</option>
            {['error', 'warn', 'info', 'debug'].map(l => <option key={l} value={l}>{l.toUpperCase()}</option>)}
          </select>
          <input className="input" placeholder="Full-text search…" value={filter.search} onChange={e => setFilter(p => ({ ...p, search: e.target.value }))} />
          {(filter.service || filter.level || filter.search) && (
            <button className="btn btn-ghost btn-sm" onClick={() => setFilter({ service: '', level: '', search: '' })}>Clear</button>
          )}
        </div>

        {/* Log stream */}
        <div className="card" style={{ marginBottom: 16 }}>
          <div style={{ padding: '9px 18px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg3)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 11, fontFamily: 'DM Mono', color: paused ? 'var(--amber)' : 'var(--green)', fontWeight: 500 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor', display: 'inline-block', animation: paused ? 'none' : 'pulse 2s infinite' }} />
              {paused ? 'PAUSED' : 'LIVE'} · {shown.length} entries
            </span>
            <span style={{ fontSize: 10, fontFamily: 'DM Mono', color: 'var(--muted)' }}>click any row for details</span>
          </div>
          <div style={{ maxHeight: 380, overflowY: 'auto' }}>
            {shown.length === 0 ? (
              <div style={{ padding: 48, textAlign: 'center', color: 'var(--muted)', fontFamily: 'DM Mono', fontSize: 12, lineHeight: 1.8 }}>
                No logs yet. Send your first one:<br />
                <code style={{ color: 'var(--teal)' }}>vigil.log('info', 'Server started', {'{ port: 3000 }'})</code>
              </div>
            ) : shown.map((log, i) => (
              <div key={log.id || i} onClick={() => setDrawer(log)}
                style={{ display: 'flex', gap: 10, padding: '7px 18px', borderBottom: '1px solid rgba(30,30,46,.7)', fontSize: 12, alignItems: 'flex-start', cursor: 'pointer', fontFamily: 'DM Mono', transition: 'background .08s' }}
                onMouseOver={e => e.currentTarget.style.background = 'var(--bg3)'}
                onMouseOut={e => e.currentTarget.style.background = ''}>
                <span style={{ color: 'var(--muted)', flexShrink: 0, width: 60 }}>{new Date(log.timestamp).toLocaleTimeString()}</span>
                <span style={{ flexShrink: 0, width: 42, textAlign: 'center', padding: '1px 3px', borderRadius: 3, fontSize: 9, fontWeight: 600, background: LEVEL_BG[log.level], color: LEVEL_COLOR[log.level] }}>
                  {log.level?.toUpperCase()}
                </span>
                <span style={{ color: 'var(--purple)', flexShrink: 0, width: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{log.service}</span>
                <span style={{ flex: 1, color: 'var(--text2)', lineHeight: 1.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{log.message}</span>
                {log.meta && Object.keys(log.meta).length > 0 && (
                  <span style={{ fontSize: 9, color: 'var(--muted)', border: '1px solid var(--border2)', borderRadius: 3, padding: '1px 4px', flexShrink: 0 }}>{Object.keys(log.meta).length} meta</span>
                )}
              </div>
            ))}
            <div ref={endRef} />
          </div>
          {live.length === 0 && (
            <div style={{ padding: '9px 18px', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg3)' }}>
              <span style={{ fontSize: 11, fontFamily: 'DM Mono', color: 'var(--muted)' }}>Showing {allHist.length} logs</span>
              <div style={{ display: 'flex', gap: 8 }}>
                {page > 0 && <button className="btn btn-ghost btn-sm" onClick={() => setPage(p => p - 1)}>← Newer</button>}
                {hist.length === PAGE && <button className="btn btn-ghost btn-sm" onClick={() => setPage(p => p + 1)} disabled={isFetching}>{isFetching ? '…' : 'Older →'}</button>}
              </div>
            </div>
          )}
        </div>

        {/* Alert rules */}
        <div className="card">
          <div className="card-head">
            <span className="card-title">Alert rules</span>
            <button className="btn btn-ghost btn-sm" onClick={() => setShowRule(true)}>+ Add rule</button>
          </div>
          {rules.length === 0 ? (
            <div className="empty">
              <div className="empty-icon">⚡</div>
              <div className="empty-h">No alert rules</div>
              <div className="empty-p">Fire when error counts spike above a threshold.<br />Get emailed (and Slacked) the moment something breaks.</div>
              <button className="btn btn-primary" onClick={() => setShowRule(true)}>+ Create first rule</button>
            </div>
          ) : (
            <>
              <div className="thead" style={{ gridTemplateColumns: '2fr 90px 100px 100px 60px' }}>
                <span>Rule</span><span>Status</span><span>Threshold</span><span>Last fired</span><span></span>
              </div>
              {rules.map(r => {
                const fired = r.last_triggered && new Date(r.last_triggered) > new Date(Date.now() - 3600000);
                return (
                  <div key={r.id} className="trow" style={{ gridTemplateColumns: '2fr 90px 100px 100px 60px' }}>
                    <div><div className="tname">{r.name}</div><div className="tsub">{r.level?.toUpperCase() || 'ANY'} · {r.service || 'all services'} · {r.window_seconds / 60}min window</div></div>
                    <span className={`pill ${fired ? 'pill-red' : 'pill-green'}`}><span className="dot" />{fired ? 'FIRING' : 'OK'}</span>
                    <div style={{ fontFamily: 'DM Mono', fontSize: 12, color: 'var(--muted)' }}>{r.threshold} events</div>
                    <div style={{ fontFamily: 'DM Mono', fontSize: 11, color: 'var(--muted)' }}>{r.last_triggered ? new Date(r.last_triggered).toLocaleTimeString() : 'Never'}</div>
                    <button className="btn btn-danger btn-sm" onClick={() => delRule.mutate(r.id)}>Del</button>
                  </div>
                );
              })}
            </>
          )}
        </div>
      </div>

      {showRule && (
        <div className="overlay" onClick={e => e.target === e.currentTarget && setShowRule(false)}>
          <div className="modal">
            <div className="modal-title">New alert rule</div>
            <div className="field"><label className="label">Rule name</label><input className="input" placeholder="High error rate" value={ruleF.name} onChange={e => setRuleF(p => ({ ...p, name: e.target.value }))} /></div>
            <div className="row2">
              <div className="field"><label className="label">Service (optional)</label><input className="input" placeholder="api-server" value={ruleF.service} onChange={e => setRuleF(p => ({ ...p, service: e.target.value }))} /></div>
              <div className="field"><label className="label">Level</label>
                <select className="input" value={ruleF.level} onChange={e => setRuleF(p => ({ ...p, level: e.target.value }))}>
                  <option value="error">ERROR</option><option value="warn">WARN</option><option value="info">INFO</option>
                </select>
              </div>
            </div>
            <div className="row2">
              <div className="field"><label className="label">Threshold (events)</label><input className="input" type="number" min="1" value={ruleF.threshold} onChange={e => setRuleF(p => ({ ...p, threshold: +e.target.value }))} /></div>
              <div className="field"><label className="label">Time window</label>
                <select className="input" value={ruleF.window_seconds} onChange={e => setRuleF(p => ({ ...p, window_seconds: +e.target.value }))}>
                  <option value={60}>1 min</option><option value={300}>5 min</option><option value={600}>10 min</option><option value={3600}>1 hour</option>
                </select>
              </div>
            </div>
            <div style={{ fontSize: 11, fontFamily: 'DM Mono', color: 'var(--muted)', marginBottom: 16, background: 'var(--bg3)', padding: '8px 12px', borderRadius: 6 }}>
              Fires when {ruleF.level.toUpperCase()} count &gt; {ruleF.threshold} in {ruleF.window_seconds / 60} min
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setShowRule(false)}>Cancel</button>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => createRule.mutate()} disabled={!ruleF.name}>Create rule</button>
            </div>
          </div>
        </div>
      )}
      {drawer && <LogDrawer log={drawer} onClose={() => setDrawer(null)} />}
    </div>
  );
}