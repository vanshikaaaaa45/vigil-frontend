import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { io } from 'socket.io-client';
import { useAuth } from '../store/auth';
import api from '../api/client';

const LEVEL_COLOR = { error: 'var(--red)', warn: 'var(--amber)', info: 'var(--blue2)', debug: 'var(--muted)' };
const LEVEL_BG    = { error: 'rgba(244,63,94,.1)', warn: 'rgba(245,158,11,.1)', info: 'rgba(99,102,241,.1)', debug: 'rgba(96,96,128,.08)' };

// ── Log detail modal ──────────────────────────────────────────────
function LogDetail({ log, onClose }) {
  const meta = typeof log.meta === 'string' ? JSON.parse(log.meta || '{}') : (log.meta || {});
  return (
    <div className="overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 560 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 3 }}>Log entry</div>
            <div style={{ fontSize: 11, fontFamily: 'DM Mono', color: 'var(--muted)' }}>
              {new Date(log.timestamp).toLocaleString()} · {log.service}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ padding: '3px 9px', borderRadius: 4, fontSize: 10, fontWeight: 600, fontFamily: 'DM Mono', background: LEVEL_BG[log.level], color: LEVEL_COLOR[log.level] }}>
              {log.level?.toUpperCase()}
            </span>
            <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
          </div>
        </div>
        <div style={{ background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: 7, padding: '12px 14px', marginBottom: 12 }}>
          <div className="label" style={{ marginBottom: 6 }}>Message</div>
          <div style={{ fontSize: 13, lineHeight: 1.8, color: 'var(--text)', wordBreak: 'break-word' }}>{log.message}</div>
        </div>
        <div style={{ background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: 7, padding: '12px 14px', marginBottom: 12 }}>
          <div className="label" style={{ marginBottom: 8 }}>Metadata</div>
          {Object.keys(meta).length === 0 ? (
            <div style={{ fontSize: 12, color: 'var(--muted)', fontFamily: 'DM Mono' }}>No metadata</div>
          ) : Object.entries(meta).map(([k, v]) => (
            <div key={k} style={{ display: 'flex', gap: 12, fontFamily: 'DM Mono', fontSize: 12, padding: '5px 0', borderBottom: '1px solid var(--border)' }}>
              <span style={{ color: 'var(--purple)', minWidth: 120, flexShrink: 0 }}>{k}</span>
              <span style={{ color: 'var(--teal)', wordBreak: 'break-all' }}>
                {typeof v === 'object' ? JSON.stringify(v, null, 2) : String(v)}
              </span>
            </div>
          ))}
        </div>
        <button className="btn btn-ghost btn-sm" onClick={() => navigator.clipboard.writeText(JSON.stringify(log, null, 2))}>
          📋 Copy as JSON
        </button>
      </div>
    </div>
  );
}

// ── Add rule modal (Phase 3 — Slack, Discord, cooldown added) ─────
function AddRuleModal({ onClose, onCreate }) {
  const [f, setF] = useState({
    name: '', service: '', level: 'error',
    threshold: 5, window_seconds: 300,
    notify_slack: '',     // Phase 3
    notify_discord: '',   // Phase 3
    cooldown_minutes: 15, // Phase 3
  });
  const [loading, setLoading] = useState(false);
  const submit = async () => {
    if (!f.name) return;
    setLoading(true);
    try { await onCreate(f); onClose(); }
    finally { setLoading(false); }
  };
  return (
    <div className="overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-title">New alert rule</div>
        <div className="field">
          <label className="label">Rule name</label>
          <input className="input" placeholder="High error rate" value={f.name} onChange={e => setF(p => ({ ...p, name: e.target.value }))} />
        </div>
        <div className="row2">
          <div className="field">
            <label className="label">Service (optional)</label>
            <input className="input" placeholder="api-server" value={f.service} onChange={e => setF(p => ({ ...p, service: e.target.value }))} />
          </div>
          <div className="field">
            <label className="label">Level</label>
            <select className="input" value={f.level} onChange={e => setF(p => ({ ...p, level: e.target.value }))}>
              <option value="error">ERROR</option>
              <option value="warn">WARN</option>
              <option value="info">INFO</option>
            </select>
          </div>
        </div>
        <div className="row2">
          <div className="field">
            <label className="label">Threshold (events)</label>
            <input className="input" type="number" min="1" value={f.threshold} onChange={e => setF(p => ({ ...p, threshold: +e.target.value }))} />
          </div>
          <div className="field">
            <label className="label">Time window</label>
            <select className="input" value={f.window_seconds} onChange={e => setF(p => ({ ...p, window_seconds: +e.target.value }))}>
              <option value={60}>1 minute</option>
              <option value={300}>5 minutes</option>
              <option value={600}>10 minutes</option>
              <option value={3600}>1 hour</option>
            </select>
          </div>
        </div>

        {/* Phase 3 — Slack */}
        <div className="field">
          <label className="label">
            Slack webhook
            <span style={{ textTransform: 'none', fontWeight: 400, color: 'var(--muted)', fontSize: 10, marginLeft: 6 }}>optional</span>
          </label>
          <input className="input" placeholder="https://hooks.slack.com/services/..." value={f.notify_slack} onChange={e => setF(p => ({ ...p, notify_slack: e.target.value }))} />
        </div>

        {/* Phase 3 — Discord */}
        <div className="field">
          <label className="label">
            Discord webhook
            <span style={{ textTransform: 'none', fontWeight: 400, color: 'var(--muted)', fontSize: 10, marginLeft: 6 }}>optional</span>
          </label>
          <input className="input" placeholder="https://discord.com/api/webhooks/..." value={f.notify_discord} onChange={e => setF(p => ({ ...p, notify_discord: e.target.value }))} />
        </div>

        {/* Phase 3 — Cooldown */}
        <div className="field">
          <label className="label">
            Cooldown (minutes)
            <span style={{ textTransform: 'none', fontWeight: 400, color: 'var(--muted)', fontSize: 10, marginLeft: 6 }}>won't fire again until this expires</span>
          </label>
          <input className="input" type="number" min="1" max="1440" value={f.cooldown_minutes} onChange={e => setF(p => ({ ...p, cooldown_minutes: +e.target.value }))} />
        </div>

        <div style={{ background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: 6, padding: '9px 12px', marginBottom: 16, fontFamily: 'DM Mono', fontSize: 11, color: 'var(--muted)' }}>
          Fires when <strong style={{ color: 'var(--text)' }}>{f.level.toUpperCase()}</strong> &gt; <strong style={{ color: 'var(--text)' }}>{f.threshold}</strong> in <strong style={{ color: 'var(--text)' }}>{f.window_seconds / 60}min</strong>
          {f.service && <> from <strong style={{ color: 'var(--teal)' }}>{f.service}</strong></>}
          {' · '}cooldown: <strong style={{ color: 'var(--text)' }}>{f.cooldown_minutes}min</strong>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-ghost" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" style={{ flex: 1 }} onClick={submit} disabled={!f.name || loading}>
            {loading ? 'Creating…' : 'Create rule'}
          </button>
        </div>
      </div>
    </div>
  );
}

const PAGE = 50;

export default function Stream() {
  const { accessToken } = useAuth();
  const qc = useQueryClient();

  const [liveLogs, setLiveLogs] = useState([]);
  const [paused, setPaused]     = useState(false);
  const [filter, setFilter]     = useState({ service: '', level: '', search: '' });
  const [page, setPage]         = useState(0);
  const [showRule, setShowRule] = useState(false);
  const [detail, setDetail]     = useState(null);
  const streamRef = useRef(null);

  // ── Queries ───────────────────────────────────────────────────
  const { data: stats }         = useQuery({ queryKey: ['log-stats'], queryFn: () => api.get('/logs/stats').then(r => r.data.stats), refetchInterval: 30_000 });
  const { data: services = [] } = useQuery({ queryKey: ['log-svc'],   queryFn: () => api.get('/logs/services').then(r => r.data.services) });
  const { data: rules = [] }    = useQuery({ queryKey: ['log-rules'], queryFn: () => api.get('/logs/rules').then(r => r.data.rules) });

  const { data: alertHistory = [] } = useQuery({
    queryKey: ['alert-history'],
    queryFn:  () => api.get('/logs/alert-history').then(r => r.data.history),
    refetchInterval: 30_000,
  });

  const { data: historicLogs = [], isFetching } = useQuery({
    queryKey: ['logs', filter, page],
    queryFn: () => api.get('/logs', {
      params: {
        service: filter.service || undefined,
        level:   filter.level   || undefined,
        search:  filter.search  || undefined,
        limit:   PAGE,
        offset:  page * PAGE,
      },
    }).then(r => r.data.logs),
    placeholderData: prev => prev,
  });

  useEffect(() => { setPage(0); setLiveLogs([]); }, [filter]);

  // ── WebSocket ─────────────────────────────────────────────────
  useEffect(() => {
    const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5001';
    const isProd = !socketUrl.includes('localhost');
    const socket = io(socketUrl, {
      transports:           isProd ? ['polling'] : ['polling', 'websocket'],
      upgrade:              !isProd,
      withCredentials:      true,
      reconnectionDelay:    2000,
      reconnectionAttempts: 10,
      timeout:              20_000,
    });

    socket.on('connect',       () => socket.emit('auth', accessToken));
    socket.on('connect_error', (err) => console.debug('[vigil] socket reconnecting...', err.message));
    socket.on('log:new', (log) => {
      if (paused) return;
      if (filter.service && log.service !== filter.service) return;
      if (filter.level   && log.level   !== filter.level)   return;
      if (filter.search  && !log.message.toLowerCase().includes(filter.search.toLowerCase())) return;
      setLiveLogs(prev => [log, ...prev].slice(0, 200));
    });

    return () => socket.disconnect();
  }, [accessToken, paused, filter]);

  const showLive  = liveLogs.length > 0 && !paused && page === 0 && !filter.search;
  const displayed = showLive
    ? [...liveLogs, ...historicLogs.filter(h => !liveLogs.find(l => l.id === h.id))]
    : historicLogs;

  // ── Mutations ─────────────────────────────────────────────────
  const createRule = useMutation({
    mutationFn: (data) => api.post('/logs/rules', data),
    onSuccess:  ()     => qc.invalidateQueries({ queryKey: ['log-rules'] }),
  });
  const deleteRule = useMutation({
    mutationFn: (id)   => api.delete(`/logs/rules/${id}`),
    onSuccess:  ()     => qc.invalidateQueries({ queryKey: ['log-rules'] }),
  });

  useEffect(() => {
    if (showLive && !paused && streamRef.current) streamRef.current.scrollTop = 0;
  }, [liveLogs.length]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="topbar">
        <div>
          <div className="topbar-title">Stream</div>
          <div className="topbar-sub">Live log aggregation · click any row for details</div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontFamily: 'DM Mono', color: paused ? 'var(--amber)' : 'var(--green)' }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor', animation: paused ? 'none' : 'pulse 2s infinite' }} />
            {paused ? 'PAUSED' : 'LIVE'}
          </div>
          <button className={`btn btn-sm ${paused ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setPaused(p => !p)}>
            {paused ? '▶ Resume' : '⏸ Pause'}
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => setShowRule(true)}>+ Alert Rule</button>
        </div>
      </div>

      <div className="page-scroll">
        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 18 }}>
          {[
            ['Logs (24h)',   Number(stats?.last_24h || 0).toLocaleString(), 'total ingested',        'var(--text)'],
            ['Errors (1h)',  stats?.errors_1h || 0, `${stats?.errors_24h || 0} in 24h`,              +stats?.errors_1h > 0 ? 'var(--red)' : 'var(--green)'],
            ['Alert rules',  rules.length,           `${alertHistory.length} fires recorded`,        'var(--text)'],
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
          <input className="input" placeholder="Search log messages…" value={filter.search} onChange={e => setFilter(p => ({ ...p, search: e.target.value }))} />
          {(filter.service || filter.level || filter.search) && (
            <button className="btn btn-ghost btn-sm" onClick={() => setFilter({ service: '', level: '', search: '' })}>✕ Clear</button>
          )}
        </div>

        {/* Log stream */}
        <div className="card" style={{ marginBottom: 16 }}>
          <div style={{ padding: '9px 18px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 11, fontFamily: 'DM Mono', color: 'var(--muted)' }}>{displayed.length} entries</span>
              {isFetching && <span style={{ fontSize: 10, fontFamily: 'DM Mono', color: 'var(--muted)' }}>loading…</span>}
            </div>
            <span style={{ fontSize: 10, fontFamily: 'DM Mono', color: 'var(--muted)' }}>click any row for details</span>
          </div>

          <div ref={streamRef} style={{ maxHeight: 400, overflowY: 'auto' }}>
            {displayed.length === 0 && !isFetching ? (
              <div style={{ padding: 52, textAlign: 'center' }}>
                <div style={{ fontSize: 28, marginBottom: 12 }}>📭</div>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>No logs yet</div>
                <div style={{ fontSize: 12, fontFamily: 'DM Mono', color: 'var(--muted)', lineHeight: 1.8, marginBottom: 16 }}>
                  Send your first log from your backend:
                </div>
                <div style={{ background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: 8, padding: '14px 18px', textAlign: 'left', display: 'inline-block', fontFamily: 'DM Mono', fontSize: 12, lineHeight: 2.2 }}>
                  <div style={{ color: 'var(--muted)' }}># Terminal</div>
                  <div>curl -X POST <span style={{ color: 'var(--teal)' }}>/api/logs/ingest</span> \</div>
                  <div>&nbsp;&nbsp;-H <span style={{ color: 'var(--amber)' }}>"X-API-Key: vgl_live_..."</span> \</div>
                  <div>&nbsp;&nbsp;-d <span style={{ color: 'var(--amber)' }}>'{"{"}"service":"api","level":"info","message":"hello"{"}"}'</span></div>
                </div>
              </div>
            ) : displayed.map((log, i) => (
              <div
                key={log.id || i}
                onClick={() => setDetail(log)}
                style={{ display: 'flex', gap: 10, padding: '7px 18px', borderBottom: '1px solid rgba(30,30,46,.8)', fontSize: 12, alignItems: 'flex-start', cursor: 'pointer', fontFamily: 'DM Mono', transition: 'background .08s' }}
                onMouseOver={e => e.currentTarget.style.background = 'var(--bg3)'}
                onMouseOut={e  => e.currentTarget.style.background = ''}
              >
                <span style={{ color: 'var(--muted)', flexShrink: 0, width: 62, fontSize: 11 }}>
                  {new Date(log.timestamp).toLocaleTimeString()}
                </span>
                <span style={{ flexShrink: 0, width: 44, textAlign: 'center', padding: '1px 4px', borderRadius: 3, fontSize: 9, fontWeight: 600, background: LEVEL_BG[log.level], color: LEVEL_COLOR[log.level] }}>
                  {log.level?.toUpperCase()}
                </span>
                <span style={{ color: 'var(--purple)', flexShrink: 0, width: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {log.service}
                </span>
                <span style={{ flex: 1, color: 'var(--text2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {log.message}
                </span>
                {log.meta && Object.keys(typeof log.meta === 'string' ? JSON.parse(log.meta || '{}') : log.meta).length > 0 && (
                  <span style={{ fontSize: 9, color: 'var(--muted)', border: '1px solid var(--border2)', borderRadius: 3, padding: '1px 5px', flexShrink: 0 }}>
                    meta
                  </span>
                )}
              </div>
            ))}
          </div>

          <div style={{ padding: '9px 18px', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg3)' }}>
            <span style={{ fontSize: 11, fontFamily: 'DM Mono', color: 'var(--muted)' }}>
              Page {page + 1} · {historicLogs.length} loaded
            </span>
            <div style={{ display: 'flex', gap: 8 }}>
              {page > 0 && <button className="btn btn-ghost btn-sm" onClick={() => setPage(p => p - 1)}>← Newer</button>}
              {historicLogs.length === PAGE && (
                <button className="btn btn-ghost btn-sm" onClick={() => setPage(p => p + 1)} disabled={isFetching}>
                  {isFetching ? 'Loading…' : 'Older →'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Alert rules */}
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-head">
            <span className="card-title">Alert rules</span>
            <button className="btn btn-ghost btn-sm" onClick={() => setShowRule(true)}>+ Add rule</button>
          </div>
          {rules.length === 0 ? (
            <div className="empty">
              <div className="empty-icon">⚡</div>
              <div className="empty-h">No alert rules</div>
              <div className="empty-p">
                Create rules that fire when error counts spike.<br />
                Get emailed and Slacked the moment something breaks.
              </div>
              <button className="btn btn-primary" onClick={() => setShowRule(true)}>+ Create first rule</button>
            </div>
          ) : (
            <>
              <div className="thead" style={{ gridTemplateColumns: '2fr 90px 100px 110px 60px' }}>
                <span>Rule</span><span>Status</span><span>Threshold</span><span>Last fired</span><span></span>
              </div>
              {rules.map(r => {
                const recentlyFired = r.last_triggered && new Date(r.last_triggered) > new Date(Date.now() - 3_600_000);
                return (
                  <div key={r.id} className="trow" style={{ gridTemplateColumns: '2fr 90px 100px 110px 60px' }}>
                    <div>
                      <div className="tname">{r.name}</div>
                      <div className="tsub">
                        {r.level?.toUpperCase() || 'ANY'} · {r.service || 'all services'} · {r.window_seconds / 60}min
                        {r.notify_slack   && ' · 📢 Slack'}
                        {r.notify_discord && ' · 🎮 Discord'}
                      </div>
                    </div>
                    <span className={`pill ${recentlyFired ? 'pill-red' : 'pill-green'}`}>
                      <span className="dot" />{recentlyFired ? 'FIRING' : 'OK'}
                    </span>
                    <div style={{ fontFamily: 'DM Mono', fontSize: 12, color: 'var(--muted)' }}>≥ {r.threshold}</div>
                    <div style={{ fontFamily: 'DM Mono', fontSize: 11, color: 'var(--muted)' }}>
                      {r.last_triggered ? new Date(r.last_triggered).toLocaleTimeString() : 'Never'}
                    </div>
                    <button className="btn btn-danger btn-sm" onClick={() => { if (confirm(`Delete rule "${r.name}"?`)) deleteRule.mutate(r.id); }}>Del</button>
                  </div>
                );
              })}
            </>
          )}
        </div>

        {/* Alert history */}
        <div className="card">
          <div className="card-head">
            <span className="card-title">Alert history</span>
            <span className="card-meta">{alertHistory.length} fires recorded</span>
          </div>
          {alertHistory.length === 0 ? (
            <div style={{ padding: '24px 18px', textAlign: 'center', color: 'var(--muted)', fontFamily: 'DM Mono', fontSize: 12 }}>
              No alerts fired yet — create a rule above and trigger it by sending errors.
            </div>
          ) : (
            <>
              <div className="thead" style={{ gridTemplateColumns: '2fr 80px 80px 80px 140px' }}>
                <span>Rule</span><span>Level</span><span>Count</span><span>Notified</span><span>When</span>
              </div>
              {alertHistory.map(h => (
                <div key={h.id} className="trow" style={{ gridTemplateColumns: '2fr 80px 80px 80px 140px' }}>
                  <div>
                    <div className="tname">{h.rule_name}</div>
                    <div className="tsub">threshold: {h.threshold} · window: {h.window_seconds / 60}min</div>
                  </div>
                  <span style={{ fontFamily: 'DM Mono', fontSize: 11, color: LEVEL_COLOR[h.level] || 'var(--muted)', fontWeight: 600 }}>
                    {h.level?.toUpperCase() || 'ANY'}
                  </span>
                  <div style={{ fontFamily: 'DM Mono', fontSize: 13, fontWeight: 700, color: 'var(--red)' }}>
                    {h.count}
                  </div>
                  <div style={{ fontFamily: 'DM Mono', fontSize: 11 }}>
                    {h.notified
                      ? <span style={{ color: 'var(--green)' }}>📧 sent</span>
                      : <span style={{ color: 'var(--muted)' }}>—</span>}
                  </div>
                  <div style={{ fontFamily: 'DM Mono', fontSize: 11, color: 'var(--muted)' }}>
                    {new Date(h.fired_at).toLocaleString()}
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>

      {showRule && <AddRuleModal onClose={() => setShowRule(false)} onCreate={data => createRule.mutateAsync(data)} />}
      {detail   && <LogDetail log={detail} onClose={() => setDetail(null)} />}
    </div>
  );
}