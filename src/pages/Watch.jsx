import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Area, AreaChart } from 'recharts';
import api from '../api/client';
import { useCanEdit } from '../store/team';

function UptimeBars({ monitorId }) {
  const { data } = useQuery({
    queryKey: ['mon-results', monitorId],
    queryFn: () => api.get(`/monitors/${monitorId}`).then(r => r.data.results),
    staleTime: 60_000,
  });
  const bars = [...(data?.slice(0, 30).reverse() || []), ...Array(30).fill(null)].slice(0, 30);
  return (
    <div style={{ display: 'flex', gap: 2, alignItems: 'flex-end' }}>
      {bars.map((b, i) => (
        <div key={i} title={b ? `${b.is_up ? 'UP' : 'DOWN'} · ${b.response_ms || 0}ms` : 'No data'}
          style={{ width: 5, height: 16, borderRadius: 2, flexShrink: 0, cursor: 'default', background: b == null ? 'var(--border2)' : b.is_up ? 'var(--green)' : 'var(--red)', opacity: 0.85 }}
          onMouseOver={e => e.target.style.opacity = 1} onMouseOut={e => e.target.style.opacity = 0.85} />
      ))}
    </div>
  );
}

function ChartModal({ monitorId, monitorName, onClose }) {
  const { data, isLoading } = useQuery({
    queryKey: ['mon-chart', monitorId],
    queryFn: () => api.get(`/monitors/${monitorId}/chart`).then(r => r.data.chart),
  });

  const chartData = (data || []).map(row => ({
    hour:   new Date(row.hour).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    avg:    Number(row.avg_ms) || 0,
    max:    Number(row.max_ms) || 0,
    min:    Number(row.min_ms) || 0,
    uptime: Math.round((Number(row.up_count) / (Number(row.total) || 1)) * 100),
  }));

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div style={{ background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: 8, padding: '10px 14px', fontFamily: 'DM Mono', fontSize: 11 }}>
        <div style={{ color: 'var(--text2)', marginBottom: 6 }}>{label}</div>
        {payload.map(p => <div key={p.name} style={{ color: p.color, marginBottom: 2 }}>{p.name}: {p.value}ms</div>)}
      </div>
    );
  };

  return (
    <div className="overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 680 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            <div className="modal-title" style={{ marginBottom: 3 }}>Response time · 24h</div>
            <div style={{ fontSize: 11, fontFamily: 'DM Mono', color: 'var(--muted)' }}>{monitorName}</div>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>
        {isLoading ? (
          <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)', fontFamily: 'DM Mono', fontSize: 12 }}>Loading…</div>
        ) : chartData.length === 0 ? (
          <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)', fontFamily: 'DM Mono', fontSize: 12 }}>No data yet</div>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
                <defs>
                  <linearGradient id="avgGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="var(--accent)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="hour" tick={{ fill: 'var(--muted)', fontSize: 10, fontFamily: 'DM Mono' }} />
                <YAxis tick={{ fill: 'var(--muted)', fontSize: 10, fontFamily: 'DM Mono' }} unit="ms" />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="avg" stroke="var(--accent)" strokeWidth={2} fill="url(#avgGrad)" dot={false} name="Avg" />
                <Line type="monotone" dataKey="max" stroke="var(--red)" strokeWidth={1} dot={false} name="Max" strokeDasharray="4 2" />
                <Line type="monotone" dataKey="min" stroke="var(--green)" strokeWidth={1} dot={false} name="Min" strokeDasharray="4 2" />
              </AreaChart>
            </ResponsiveContainer>
            {chartData.length > 0 && (
              <div style={{ display: 'flex', gap: 24, marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--border)' }}>
                {[
                  ['Average', `${chartData.at(-1)?.avg ?? '—'}ms`, 'var(--accent)'],
                  ['Peak',    `${chartData.at(-1)?.max ?? '—'}ms`, 'var(--red)'],
                  ['Floor',   `${chartData.at(-1)?.min ?? '—'}ms`, 'var(--green)'],
                  ['Uptime',  `${chartData.at(-1)?.uptime ?? '—'}%`, chartData.at(-1)?.uptime >= 99 ? 'var(--green)' : 'var(--red)'],
                ].map(([label, val, color]) => (
                  <div key={label}>
                    <div style={{ fontSize: 10, fontFamily: 'DM Mono', color: 'var(--muted)', marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</div>
                    <div style={{ fontSize: 16, fontWeight: 800, color }}>{val}</div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function AddMonitorModal({ onClose, onSave }) {
  const [f, setF] = useState({ name: '', url: 'https://', method: 'GET', interval_seconds: 60, notify_slack: '' });
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);
  const submit = async (e) => {
    e.preventDefault(); setErr(''); setLoading(true);
    try { await onSave(f); onClose(); }
    catch (e) { setErr(e.response?.data?.error || 'Failed'); }
    finally { setLoading(false); }
  };
  return (
    <div className="overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-title">New monitor</div>
        {err && <div className="err-box">⚠ {err}</div>}
        <form onSubmit={submit}>
          <div className="field"><label className="label">Monitor name</label><input className="input" placeholder="Payment API" value={f.name} onChange={e => setF(p => ({ ...p, name: e.target.value }))} required /></div>
          <div className="field"><label className="label">URL to check</label><input className="input" placeholder="https://api.myapp.com/health" value={f.url} onChange={e => setF(p => ({ ...p, url: e.target.value }))} required /></div>
          <div className="row2">
            <div className="field"><label className="label">Method</label>
              <select className="input" value={f.method} onChange={e => setF(p => ({ ...p, method: e.target.value }))}>
                <option>GET</option><option>POST</option><option>HEAD</option>
              </select>
            </div>
            <div className="field"><label className="label">Check every</label>
              <select className="input" value={f.interval_seconds} onChange={e => setF(p => ({ ...p, interval_seconds: +e.target.value }))}>
                <option value={60}>1 minute</option>
                <option value={300}>5 minutes</option>
                <option value={900}>15 minutes</option>
                <option value={3600}>1 hour</option>
              </select>
            </div>
          </div>
          <div className="field">
            <label className="label">Slack webhook <span style={{ textTransform: 'none', fontWeight: 400, color: 'var(--muted)' }}>(optional)</span></label>
            <input className="input" placeholder="https://hooks.slack.com/services/..." value={f.notify_slack} onChange={e => setF(p => ({ ...p, notify_slack: e.target.value }))} />
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={loading}>{loading ? 'Creating…' : 'Create monitor'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Watch() {
  const qc      = useQueryClient();
  const canEdit = useCanEdit();
  const [showAdd, setShowAdd]   = useState(false);
  const [chart, setChart]       = useState(null);
  const [checking, setChecking] = useState(null);

  const { data: monitors = [], isLoading } = useQuery({ queryKey: ['monitors'],    queryFn: () => api.get('/monitors').then(r => r.data.monitors), refetchInterval: 30_000 });
  const { data: stats }                    = useQuery({ queryKey: ['watch-stats'], queryFn: () => api.get('/monitors/stats').then(r => r.data), refetchInterval: 30_000 });
  const { data: incidents = [] }           = useQuery({ queryKey: ['incidents'],   queryFn: () => api.get('/monitors/incidents').then(r => r.data.incidents) });

  const create = useMutation({ mutationFn: d => api.post('/monitors', d),            onSuccess: () => qc.invalidateQueries({ queryKey: ['monitors'] }) });
  const del    = useMutation({ mutationFn: id => api.delete(`/monitors/${id}`),       onSuccess: () => qc.invalidateQueries({ queryKey: ['monitors'] }) });
  const toggle = useMutation({ mutationFn: ({ id, status }) => api.patch(`/monitors/${id}`, { status }), onSuccess: () => qc.invalidateQueries({ queryKey: ['monitors'] }) });

  const checkNow = async (id) => {
    setChecking(id);
    try { await api.post(`/monitors/${id}/check`); setTimeout(() => { qc.invalidateQueries({ queryKey: ['monitors'] }); setChecking(null); }, 6000); }
    catch { setChecking(null); }
  };

  const STATUS_PILL = { up: 'pill-green', down: 'pill-red', slow: 'pill-amber', pending: 'pill-cyan' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="topbar">
        <div>
          <div className="topbar-title">Watch</div>
          <div className="topbar-sub">API uptime monitoring · checks run every minute</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => qc.invalidateQueries()}>↺ Refresh</button>
          {canEdit && (
            <button className="btn btn-primary btn-sm" onClick={() => setShowAdd(true)}>+ New monitor</button>
          )}
        </div>
      </div>

      <div className="page-scroll">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
          {[
            ['Monitors',      stats?.monitors?.total || 0,                        `${stats?.monitors?.up || 0} up · ${stats?.monitors?.down || 0} down`, stats?.monitors?.down > 0 ? 'var(--red)' : 'var(--green)'],
            ['Avg response',  stats?.avg_response_ms ? `${stats.avg_response_ms}ms` : '—', 'across active monitors', 'var(--text)'],
            ['Open incidents',stats?.incidents?.open || 0,                        `${stats?.incidents?.total || 0} in 30 days`, stats?.incidents?.open > 0 ? 'var(--red)' : 'var(--green)'],
            ['Plan',          'Free',                                              `${monitors.length}/3 monitors`, 'var(--accent)'],
          ].map(([label, val, sub, color]) => (
            <div key={label} className="stat">
              <div className="stat-label">{label}</div>
              <div className="stat-value" style={{ color, fontSize: typeof val === 'string' && val.length > 4 ? 20 : 28 }}>{val}</div>
              <div className="stat-sub">{sub}</div>
            </div>
          ))}
        </div>

        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-head">
            <span className="card-title">Monitors</span>
            <span className="card-meta">{monitors.length} configured</span>
          </div>
          {isLoading ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)', fontFamily: 'DM Mono', fontSize: 12 }}>Loading monitors…</div>
          ) : monitors.length === 0 ? (
            <div className="empty">
              <div className="empty-icon">◉</div>
              <div className="empty-h">No monitors yet</div>
              <div className="empty-p">Add your first endpoint. VIGIL checks it every minute.</div>
              {canEdit && <button className="btn btn-primary" onClick={() => setShowAdd(true)}>+ Add first monitor</button>}
            </div>
          ) : (
            <>
              <div className="thead" style={{ gridTemplateColumns: '2fr 100px 90px 160px 80px 180px' }}>
                <span>Endpoint</span><span>Status</span><span>Response</span><span>Uptime (30 checks)</span><span>Checked</span><span>Actions</span>
              </div>
              {monitors.map(m => (
                <div key={m.id} className="trow" style={{ gridTemplateColumns: '2fr 100px 90px 160px 80px 180px', opacity: m.status === 'paused' ? 0.5 : 1 }}>
                  <div>
                    <div className="tname" style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                      {m.name}
                      {m.status === 'paused' && <span style={{ fontSize: 9, fontFamily: 'DM Mono', background: 'var(--bg4)', color: 'var(--amber)', border: '1px solid rgba(245,158,11,.2)', padding: '1px 5px', borderRadius: 3 }}>PAUSED</span>}
                    </div>
                    <div className="tsub">{m.url}</div>
                  </div>
                  <div>
                    <span className={`pill ${STATUS_PILL[m.last_status] || 'pill-cyan'}`}>
                      <span className="dot" />{m.last_status?.toUpperCase() || 'PENDING'}
                    </span>
                  </div>
                  <div style={{ fontFamily: 'DM Mono', fontSize: 12, fontWeight: 600, color: !m.last_response_ms ? 'var(--muted)' : m.last_response_ms < 500 ? 'var(--green)' : m.last_response_ms < 2000 ? 'var(--amber)' : 'var(--red)' }}>
                    {m.last_response_ms ? `${m.last_response_ms}ms` : '—'}
                  </div>
                  <UptimeBars monitorId={m.id} />
                  <div style={{ fontFamily: 'DM Mono', fontSize: 10, color: 'var(--muted)' }}>
                    {m.last_checked_at ? new Date(m.last_checked_at).toLocaleTimeString() : 'Never'}
                  </div>

                  {/* Actions — chart always visible, edit actions only for canEdit */}
                  <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                    <button className="btn btn-ghost btn-sm" title="Response time chart" onClick={() => setChart({ id: m.id, name: m.name })} style={{ padding: '4px 7px' }}>
                      <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M2 12l3-4 3 2 3-5 3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </button>
                    {canEdit && (
                      <>
                        <button className="btn btn-ghost btn-sm" title="Check now" onClick={() => checkNow(m.id)} disabled={checking === m.id} style={{ padding: '4px 7px', minWidth: 30 }}>
                          {checking === m.id ? <span style={{ fontSize: 10 }}>…</span> : <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M13 8A5 5 0 1 1 8 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><path d="M13 3v5h-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                        </button>
                        <button className="btn btn-ghost btn-sm" title={m.status === 'paused' ? 'Resume' : 'Pause'} onClick={() => toggle.mutate({ id: m.id, status: m.status === 'paused' ? 'active' : 'paused' })} style={{ padding: '4px 7px' }}>
                          {m.status === 'paused' ? '▶' : '⏸'}
                        </button>
                        <button className="btn btn-danger btn-sm" onClick={() => { if (confirm(`Delete "${m.name}"?`)) del.mutate(m.id); }}>Del</button>
                      </>
                    )}
                    {!canEdit && (
                      <span style={{ fontSize: 10, fontFamily: 'DM Mono', color: 'var(--muted)' }}>view only</span>
                    )}
                  </div>
                </div>
              ))}
            </>
          )}
        </div>

        <div className="card">
          <div className="card-head">
            <span className="card-title">Incidents</span>
            <span className="card-meta" style={{ color: incidents.filter(i => i.status === 'open').length > 0 ? 'var(--red)' : 'var(--muted)' }}>
              {incidents.filter(i => i.status === 'open').length} open
            </span>
          </div>
          {incidents.length === 0 ? (
            <div style={{ padding: 28, textAlign: 'center', color: 'var(--muted)', fontFamily: 'DM Mono', fontSize: 12 }}>No incidents in the last 30 days 🎉</div>
          ) : (
            <>
              <div className="thead" style={{ gridTemplateColumns: '3fr 100px 90px 1fr' }}>
                <span>Description</span><span>Status</span><span>Duration</span><span>When</span>
              </div>
              {incidents.map(i => (
                <div key={i.id} className="trow" style={{ gridTemplateColumns: '3fr 100px 90px 1fr' }}>
                  <div><div className="tname">{i.title}</div><div className="tsub">{i.monitor_url}</div></div>
                  <span className={`pill ${i.status === 'open' ? 'pill-red' : 'pill-green'}`}><span className="dot" />{i.status.toUpperCase()}</span>
                  <div style={{ fontFamily: 'DM Mono', fontSize: 12, color: 'var(--muted)' }}>{i.duration_seconds ? `${Math.round(i.duration_seconds / 60)}m` : 'Ongoing'}</div>
                  <div style={{ fontFamily: 'DM Mono', fontSize: 11, color: 'var(--muted)' }}>{new Date(i.started_at).toLocaleString()}</div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>

      {showAdd && canEdit && <AddMonitorModal onClose={() => setShowAdd(false)} onSave={create.mutateAsync} />}
      {chart && <ChartModal monitorId={chart.id} monitorName={chart.name} onClose={() => setChart(null)} />}
    </div>
  );
}