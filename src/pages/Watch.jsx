import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Area, AreaChart } from 'recharts';
import api from '../api/client';
import { useCanEdit } from '../store/team';
import { useAuth } from '../store/auth';
import { SkeletonStats, SkeletonTable } from '../components/shared/Skeleton';
import { toast } from '../utils/toast';

// ── Onboarding checklist ──────────────────────────────────────────
const STORAGE_KEY = 'vigil-onboarding-dismissed';

function OnboardingChecklist({ monitors, hasLogs, hasRelay, hasTeam }) {
  const [dismissed, setDismissed] = useState(() => localStorage.getItem(STORAGE_KEY) === 'true');
  const [collapsed, setCollapsed] = useState(false);

  const tasks = [
    { id: 'monitor', label: 'Add your first monitor', sub: 'Go to Watch → + New monitor', done: monitors > 0, link: null },
    { id: 'log',     label: 'Send your first log',    sub: 'npm install vigil-sdk → vigil.log()', done: hasLogs,    link: '/keys' },
    { id: 'relay',   label: 'Create a relay channel', sub: 'Go to Relay → + New channel',        done: hasRelay,  link: '/relay' },
    { id: 'team',    label: 'Invite a teammate',       sub: 'Go to Team → + Invite member',       done: hasTeam,   link: '/team' },
  ];

  const done  = tasks.filter(t => t.done).length;
  const total = tasks.length;
  const allDone = done === total;

  if (dismissed) return null;

  return (
    <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 10, marginBottom: 16, overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', borderBottom: collapsed ? 'none' : '1px solid var(--border)' }} onClick={() => setCollapsed(c => !c)}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 700 }}>
            {allDone ? '🎉 You\'re all set!' : `Get started — ${done}/${total} done`}
          </div>
          {/* Progress bar */}
          <div style={{ width: 100, height: 5, background: 'var(--bg4)', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{ width: `${(done / total) * 100}%`, height: '100%', background: allDone ? 'var(--green)' : 'var(--accent)', borderRadius: 3, transition: 'width .4s' }} />
          </div>
          <span style={{ fontSize: 11, fontFamily: 'DM Mono', color: 'var(--muted)' }}>{Math.round((done / total) * 100)}%</span>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {allDone && (
            <button className="btn btn-ghost btn-sm" onClick={e => { e.stopPropagation(); localStorage.setItem(STORAGE_KEY, 'true'); setDismissed(true); }}>
              Dismiss
            </button>
          )}
          <span style={{ fontSize: 12, color: 'var(--muted)' }}>{collapsed ? '▾' : '▴'}</span>
        </div>
      </div>

      {/* Tasks */}
      {!collapsed && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0 }}>
          {tasks.map((t, i) => (
            <div key={t.id} style={{ padding: '12px 16px', borderRight: i < 3 ? '1px solid var(--border)' : 'none', opacity: t.done ? 0.6 : 1, transition: 'opacity .2s' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                <div style={{ width: 20, height: 20, borderRadius: '50%', background: t.done ? 'var(--green)' : 'var(--bg4)', border: t.done ? 'none' : '1.5px solid var(--border2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, flexShrink: 0, color: '#fff', transition: 'all .2s' }}>
                  {t.done ? '✓' : i + 1}
                </div>
                <div style={{ fontSize: 12, fontWeight: 600, color: t.done ? 'var(--muted)' : 'var(--text)', textDecoration: t.done ? 'line-through' : 'none' }}>{t.label}</div>
              </div>
              <div style={{ fontSize: 11, fontFamily: 'DM Mono', color: 'var(--muted)', paddingLeft: 28 }}>{t.sub}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Uptime bars ───────────────────────────────────────────────────
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

// ── Chart modal ───────────────────────────────────────────────────
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

// ── Add monitor modal ─────────────────────────────────────────────

// ── Maintenance window modal ──────────────────────────────────────
function MaintenanceModal({ monitorId, monitorName, onClose }) {
  const qc = useQueryClient();
  const now = new Date();
  const pad = n => String(n).padStart(2, '0');
  const localNow = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
  const localEnd = new Date(now.getTime() + 60*60*1000);
  const localEndS = `${localEnd.getFullYear()}-${pad(localEnd.getMonth()+1)}-${pad(localEnd.getDate())}T${pad(localEnd.getHours())}:${pad(localEnd.getMinutes())}`;

  const [f, setF] = useState({ title: 'Scheduled maintenance', starts_at: localNow, ends_at: localEndS, repeat_weekly: false });
  const [err, setErr] = useState('');

  const { data: windows = [] } = useQuery({
    queryKey: ['maintenance', monitorId],
    queryFn:  () => api.get(`/monitors/${monitorId}/maintenance`).then(r => r.data.windows),
  });

  const create = useMutation({
    mutationFn: () => api.post(`/monitors/${monitorId}/maintenance`, {
      ...f,
      starts_at: new Date(f.starts_at).toISOString(),
      ends_at:   new Date(f.ends_at).toISOString(),
    }),
    onSuccess:  () => { qc.invalidateQueries({ queryKey: ['maintenance', monitorId] }); qc.invalidateQueries({ queryKey: ['monitors'] }); setErr(''); },
    onError:    e  => setErr(e.response?.data?.error || 'Failed'),
  });

  const remove = useMutation({
    mutationFn: (wid) => api.delete(`/monitors/${monitorId}/maintenance/${wid}`),
    onSuccess:  ()    => qc.invalidateQueries({ queryKey: ['maintenance', monitorId] }),
  });

  const isActive = (w) => new Date(w.starts_at) <= new Date() && new Date(w.ends_at) >= new Date();

  return (
    <div className="overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 520 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <div>
            <div className="modal-title" style={{ marginBottom: 2 }}>Maintenance windows</div>
            <div style={{ fontSize: 11, fontFamily: 'DM Mono', color: 'var(--muted)' }}>{monitorName}</div>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>

        {windows.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 8 }}>Scheduled</div>
            {windows.map(w => (
              <div key={w.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: 7, marginBottom: 6 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 2, display: 'flex', alignItems: 'center', gap: 7 }}>
                    {w.title}
                    {isActive(w) && <span style={{ fontSize: 9, fontFamily: 'DM Mono', background: 'rgba(245,158,11,.1)', color: 'var(--amber)', border: '1px solid rgba(245,158,11,.2)', borderRadius: 3, padding: '1px 5px', fontWeight: 700 }}>ACTIVE</span>}
                  </div>
                  <div style={{ fontSize: 10, fontFamily: 'DM Mono', color: 'var(--muted)' }}>
                    {new Date(w.starts_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })} → {new Date(w.ends_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    {w.repeat_weekly && ' · repeats weekly'}
                  </div>
                </div>
                <button className="btn btn-danger btn-sm" onClick={() => remove.mutate(w.id)} style={{ padding: '3px 8px' }}>✕</button>
              </div>
            ))}
          </div>
        )}

        <div style={{ borderTop: windows.length > 0 ? '1px solid var(--border)' : 'none', paddingTop: windows.length > 0 ? 16 : 0 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 12 }}>Schedule new window</div>
          {err && <div className="err-box">⚠ {err}</div>}
          <div className="field">
            <label className="label">Title</label>
            <input className="input" placeholder="Scheduled maintenance" value={f.title} onChange={e => setF(p => ({ ...p, title: e.target.value }))} />
          </div>
          <div className="row2">
            <div className="field">
              <label className="label">Starts at</label>
              <input className="input" type="datetime-local" value={f.starts_at} onChange={e => setF(p => ({ ...p, starts_at: e.target.value }))} />
            </div>
            <div className="field">
              <label className="label">Ends at</label>
              <input className="input" type="datetime-local" value={f.ends_at} onChange={e => setF(p => ({ ...p, ends_at: e.target.value }))} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, padding: '10px 12px', background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: 7 }}>
            <input type="checkbox" id="repeat" checked={f.repeat_weekly} onChange={e => setF(p => ({ ...p, repeat_weekly: e.target.checked }))} />
            <label htmlFor="repeat" style={{ fontSize: 12, color: 'var(--text2)', cursor: 'pointer' }}>Repeat every week at this time</label>
          </div>
          <div style={{ background: 'rgba(245,158,11,.06)', border: '1px solid rgba(245,158,11,.15)', borderRadius: 6, padding: '9px 12px', marginBottom: 14, fontSize: 11, fontFamily: 'DM Mono', color: 'var(--amber)', lineHeight: 1.7 }}>
            ⚠ During maintenance: checks pause, no alerts fired, status shows MAINTENANCE on status page.
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-ghost" style={{ flex: 1 }} onClick={onClose}>Close</button>
            <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => create.mutate()} disabled={create.isPending}>
              {create.isPending ? 'Scheduling…' : 'Schedule window'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function AddMonitorModal({ onClose, onSave }) {
  const [f, setF] = useState({ name: '', url: 'https://', method: 'GET', interval_seconds: 60, notify_slack: '', sla_ms: '', assert_text: '' });
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
          <div className="field">
            <label className="label">
              Response body must contain
              <span style={{ textTransform: 'none', fontWeight: 400, color: 'var(--muted)', fontSize: 10, marginLeft: 6 }}>optional — marks DOWN if text missing</span>
            </label>
            <input className="input" placeholder='e.g. "status":"ok" or "healthy"' value={f.assert_text} onChange={e => setF(p => ({ ...p, assert_text: e.target.value }))} />
            {f.assert_text && <div style={{ fontSize: 10, fontFamily: 'DM Mono', color: 'var(--blue2)', marginTop: 4 }}>Monitor marks DOWN if response doesn't contain: <strong>{f.assert_text}</strong></div>}
          </div>
          <div className="field">
            <label className="label">
              SLA threshold
              <span style={{ textTransform: 'none', fontWeight: 400, color: 'var(--muted)', fontSize: 10, marginLeft: 6 }}>alert if response exceeds this (optional)</span>
            </label>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input className="input" type="number" min="100" max="30000" placeholder="e.g. 2000" value={f.sla_ms} onChange={e => setF(p => ({ ...p, sla_ms: e.target.value }))} />
              <span style={{ fontFamily: 'DM Mono', fontSize: 12, color: 'var(--muted)', flexShrink: 0 }}>ms</span>
            </div>
            {f.sla_ms && <div style={{ fontSize: 10, fontFamily: 'DM Mono', color: 'var(--amber)', marginTop: 4 }}>Alert if response &gt; {f.sla_ms}ms</div>}
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

// ── Main Watch page ───────────────────────────────────────────────
export default function Watch() {
  const qc      = useQueryClient();
  const canEdit = useCanEdit();
  const [showAdd, setShowAdd]   = useState(false);
  const [chart, setChart]       = useState(null);
  const [checking, setChecking] = useState(null);
  const [badgeCopied, setBadgeCopied] = useState(null);
  const [maintenance, setMaintenance] = useState(null);

  const { data: monitors = [], isLoading } = useQuery({ queryKey: ['monitors'],    queryFn: () => api.get('/monitors').then(r => r.data.monitors), refetchInterval: 30_000 });
  const { data: stats }                    = useQuery({ queryKey: ['watch-stats'], queryFn: () => api.get('/monitors/stats').then(r => r.data), refetchInterval: 30_000 });
  const { data: incidents = [] }           = useQuery({ queryKey: ['incidents'],   queryFn: () => api.get('/monitors/incidents').then(r => r.data.incidents) });
  const { data: logStats }                 = useQuery({ queryKey: ['log-stats'],   queryFn: () => api.get('/logs/stats').then(r => r.data.stats) });
  const { data: relayStats }               = useQuery({ queryKey: ['relay-stats'], queryFn: () => api.get('/relay/stats').then(r => r.data.stats) });
  const { data: teamData }                 = useQuery({ queryKey: ['teams'],       queryFn: () => api.get('/teams').then(r => r.data.teams) });

  // Onboarding state
  const hasLogs  = Number(logStats?.last_24h || 0) > 0 || Number(logStats?.errors_1h || 0) > 0;
  const hasRelay = Number(relayStats?.channels || 0) > 0;
  const hasTeam  = (teamData?.[0]?.member_count || '1') !== '1';
  const onboardingDismissed = typeof window !== 'undefined' && localStorage.getItem('vigil-onboarding-dismissed') === 'true';

  const create = useMutation({ mutationFn: d => api.post('/monitors', d), onSuccess: () => { qc.invalidateQueries({ queryKey: ['monitors'] }); toast.success('Monitor created!'); }, onError: e => toast.error(e.response?.data?.detail || e.response?.data?.error || 'Failed to create monitor') });
  const del    = useMutation({ mutationFn: id => api.delete(`/monitors/${id}`),       onSuccess: () => { qc.invalidateQueries({ queryKey: ['monitors'] }); toast.success('Monitor deleted'); } });
  const toggle = useMutation({ mutationFn: ({ id, status }) => api.patch(`/monitors/${id}`, { status }), onSuccess: () => qc.invalidateQueries({ queryKey: ['monitors'] }) });

  const checkNow = async (id) => {
    setChecking(id);
    try { await api.post(`/monitors/${id}/check`); toast.info('Check started — results in ~5s'); setTimeout(() => { qc.invalidateQueries({ queryKey: ['monitors'] }); setChecking(null); }, 6000); }
    catch { setChecking(null); }
  };

  const STATUS_PILL = { up: 'pill-green', down: 'pill-red', slow: 'pill-amber', pending: 'pill-cyan', maintenance: 'pill-purple' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="topbar">
        <div>
          <div className="topbar-title">Watch</div>
          <div className="topbar-sub">API uptime monitoring · checks run every minute</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => qc.invalidateQueries()}>↺ Refresh</button>
          {canEdit && <button className="btn btn-primary btn-sm" onClick={() => setShowAdd(true)}>+ New monitor</button>}
        </div>
      </div>

      <div className="page-scroll">
        {/* Onboarding checklist — only shows if not dismissed */}
        {!onboardingDismissed && (
          <OnboardingChecklist
            monitors={monitors.length}
            hasLogs={hasLogs}
            hasRelay={hasRelay}
            hasTeam={hasTeam}
          />
        )}

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
          {[
            ['Monitors',      stats?.monitors?.total || 0,                        `${stats?.monitors?.up || 0} up · ${stats?.monitors?.down || 0} down`, stats?.monitors?.down > 0 ? 'var(--red)' : 'var(--green)'],
            ['Avg response',  stats?.avg_response_ms ? `${stats.avg_response_ms}ms` : '—', 'across active monitors', 'var(--text)'],
            ['Open incidents',stats?.incidents?.open || 0,                        `${stats?.incidents?.total || 0} in 30 days`, stats?.incidents?.open > 0 ? 'var(--red)' : 'var(--green)'],
            ['Plan',          'Free',                                              `${monitors.length}/3 monitors used`, 'var(--accent)'],
          ].map(([label, val, sub, color]) => (
            <div key={label} className="stat">
              <div className="stat-label">{label}</div>
              <div className="stat-value" style={{ color, fontSize: typeof val === 'string' && val.length > 4 ? 20 : 28 }}>{val}</div>
              <div className="stat-sub">{sub}</div>
            </div>
          ))}
        </div>

        {/* Monitors table */}
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-head">
            <span className="card-title">Monitors</span>
            <span className="card-meta">{monitors.length} configured</span>
          </div>
          {isLoading ? (
            <div style={{ padding: '8px 0' }}>{[1,2,3].map(i => <div key={i} style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 16, alignItems: 'center' }}><div className='skeleton skeleton-text' style={{ flex: 2 }} /><div className='skeleton skeleton-text' style={{ flex: 1 }} /><div className='skeleton skeleton-text' style={{ flex: 1 }} /><div className='skeleton skeleton-text' style={{ flex: 1 }} /></div>)}</div>
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
                    <div className="tsub">
                      {m.url}
                      {m.sla_ms && <span style={{ marginLeft: 8, fontFamily: 'DM Mono', fontSize: 10, color: 'var(--amber)', background: 'rgba(245,158,11,.08)', border: '1px solid rgba(245,158,11,.15)', borderRadius: 3, padding: '1px 5px' }}>SLA {m.sla_ms}ms</span>}
                      {m.assert_text && <span style={{ marginLeft: 4, fontFamily: 'DM Mono', fontSize: 10, color: 'var(--blue2)', background: 'rgba(99,102,241,.08)', border: '1px solid rgba(99,102,241,.15)', borderRadius: 3, padding: '1px 5px' }}>assert</span>}
                    </div>
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
                  <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                    {canEdit && (
                      <button className="btn btn-ghost btn-sm" title="Maintenance windows" onClick={() => setMaintenance({ id: m.id, name: m.name })} style={{ padding: '4px 7px', fontSize: 10 }}>
                        🔧
                      </button>
                    )}
                    <button className="btn btn-ghost btn-sm" title="Copy uptime badge for README" onClick={() => {
                      const url = `${import.meta.env.VITE_API_URL || '/api'}/badge/${m.id}`;
                      const md  = `![${m.name} uptime](${url})`;
                      navigator.clipboard.writeText(md);
                      setBadgeCopied(m.id);
                      toast.info('Badge markdown copied!');
                      setTimeout(() => setBadgeCopied(null), 2000);
                    }} style={{ padding: '4px 7px', fontSize: 10 }}>
                      {badgeCopied === m.id ? '✓' : '🏷'}
                    </button>
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
                    {!canEdit && <span style={{ fontSize: 10, fontFamily: 'DM Mono', color: 'var(--muted)' }}>view only</span>}
                  </div>
                </div>
              ))}
            </>
          )}
        </div>

        {/* Incidents */}
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
      {maintenance && canEdit && <MaintenanceModal monitorId={maintenance.id} monitorName={maintenance.name} onClose={() => setMaintenance(null)} />}
      {chart && <ChartModal monitorId={chart.id} monitorName={chart.name} onClose={() => setChart(null)} />}
    </div>
  );
}