import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/client';

export default function Relay() {
  const qc = useQueryClient();
  const [sel, setSel]         = useState(null);
  const [showCh, setShowCh]   = useState(false);
  const [showLn, setShowLn]   = useState(false);
  const [chF, setChF]         = useState({ name: '', description: '' });
  const [lnF, setLnF]         = useState({ name: 'service', url: '' });
  const [copiedSlug, setCopied] = useState(null);

  const { data: channels = [] } = useQuery({ queryKey: ['relay-channels'], queryFn: () => api.get('/relay/channels').then(r => r.data.channels) });
  const { data: stats }         = useQuery({ queryKey: ['relay-stats'], queryFn: () => api.get('/relay/stats').then(r => r.data.stats), refetchInterval: 30_000 });
  const active = sel || channels[0] || null;

  const { data: events = [] }    = useQuery({ queryKey: ['relay-events', active?.id],    queryFn: () => api.get(`/relay/channels/${active.id}/events`).then(r => r.data.events),    enabled: !!active, refetchInterval: 15_000 });
  const { data: listeners = [] } = useQuery({ queryKey: ['relay-listeners', active?.id], queryFn: () => api.get(`/relay/channels/${active.id}/listeners`).then(r => r.data.listeners), enabled: !!active });

  const createCh = useMutation({ mutationFn: () => api.post('/relay/channels', chF), onSuccess: (r) => { qc.invalidateQueries({ queryKey: ['relay-channels'] }); setSel(r.data.channel); setShowCh(false); setChF({ name: '', description: '' }); } });
  const deleteCh = useMutation({ mutationFn: id => api.delete(`/relay/channels/${id}`), onSuccess: () => { qc.invalidateQueries({ queryKey: ['relay-channels'] }); setSel(null); } });
  const addLn    = useMutation({ mutationFn: () => api.post(`/relay/channels/${active.id}/listeners`, lnF), onSuccess: () => { qc.invalidateQueries({ queryKey: ['relay-listeners', active.id] }); setShowLn(false); setLnF({ name: 'service', url: '' }); } });
  const delLn    = useMutation({ mutationFn: id => api.delete(`/relay/channels/${active.id}/listeners/${id}`), onSuccess: () => qc.invalidateQueries({ queryKey: ['relay-listeners', active.id] }) });
  const replay   = useMutation({ mutationFn: id => api.post(`/relay/events/${id}/replay`), onSuccess: () => qc.invalidateQueries({ queryKey: ['relay-events', active.id] }) });

  const copyUrl = (slug) => {
    const port = import.meta.env.VITE_API_URL?.includes('5001') ? '5001' : '5001';
    navigator.clipboard.writeText(`http://localhost:${port}/api/relay/in/${slug}`);
    setCopied(slug); setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="topbar">
        <div>
          <div className="topbar-title">Relay</div>
          <div className="topbar-sub">Webhook router · fan-out · HMAC signing · auto-retries</div>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setShowCh(true)}>+ New channel</button>
      </div>

      <div className="page-scroll">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 20 }}>
          {[
            ['Channels', stats?.channels || 0, `${stats?.listeners || 0} active listeners`, 'var(--text)'],
            ['Events (24h)', stats?.events_24h || 0, 'received & routed', 'var(--text)'],
            ['Failed deliveries', stats?.failed_deliveries || 0, 'after 3 retry attempts', +stats?.failed_deliveries > 0 ? 'var(--red)' : 'var(--green)'],
          ].map(([l, v, s, c]) => (
            <div key={l} className="stat">
              <div className="stat-label">{l}</div>
              <div className="stat-value" style={{ color: c }}>{v}</div>
              <div className="stat-sub">{s}</div>
            </div>
          ))}
        </div>

        {channels.length === 0 ? (
          <div className="card"><div className="empty">
            <div className="empty-icon">⟳</div>
            <div className="empty-h">No channels yet</div>
            <div className="empty-p">Create a channel to start routing webhooks.<br />POST events → fan-out to all listeners with HMAC signatures.</div>
            <button className="btn btn-primary" onClick={() => setShowCh(true)}>+ Create first channel</button>
          </div></div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 16 }}>
            {/* Channel list */}
            <div className="card" style={{ overflow: 'hidden', alignSelf: 'start' }}>
              <div className="card-head"><span className="card-title">Channels</span></div>
              {channels.map(ch => (
                <div key={ch.id} onClick={() => setSel(ch)} style={{
                  padding: '12px 14px', borderBottom: '1px solid var(--border)', cursor: 'pointer',
                  background: active?.id === ch.id ? 'var(--bg4)' : '',
                  borderLeft: active?.id === ch.id ? '2px solid var(--accent)' : '2px solid transparent',
                  transition: 'all .1s',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>#{ch.name}</div>
                    <button className="btn btn-ghost btn-sm" style={{ padding: '2px 6px', fontSize: 11 }} onClick={e => { e.stopPropagation(); copyUrl(ch.slug); }} title="Copy intake URL">
                      {copiedSlug === ch.slug ? '✓' : '📋'}
                    </button>
                  </div>
                  <div style={{ fontSize: 10, fontFamily: 'DM Mono', color: 'var(--muted)', marginTop: 3 }}>
                    {ch.listener_count || 0} listeners · {ch.events_24h || 0} events today
                  </div>
                </div>
              ))}
            </div>

            {/* Channel detail */}
            {active && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {/* Header */}
                <div className="card">
                  <div style={{ padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 8 }}>#{active.name}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <code style={{ fontFamily: 'DM Mono', fontSize: 11, color: 'var(--teal)', background: 'var(--bg3)', padding: '5px 10px', borderRadius: 5, border: '1px solid var(--border2)' }}>
                          POST /api/relay/in/{active.slug}
                        </code>
                        <button className="btn btn-ghost btn-sm" onClick={() => copyUrl(active.slug)}>
                          {copiedSlug === active.slug ? '✓ Copied' : '📋 Copy URL'}
                        </button>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => setShowLn(true)}>+ Listener</button>
                      <button className="btn btn-danger btn-sm" onClick={() => { if (confirm(`Delete channel #${active.name}?`)) deleteCh.mutate(active.id); }}>Delete channel</button>
                    </div>
                  </div>
                </div>

                {/* Listeners */}
                <div className="card">
                  <div className="card-head"><span className="card-title">Listeners ({listeners.length})</span></div>
                  <div style={{ padding: 14 }}>
                    {listeners.length === 0 ? (
                      <div style={{ fontSize: 12, color: 'var(--muted)', fontFamily: 'DM Mono', padding: '8px 4px' }}>No listeners. Add a URL to start receiving events.</div>
                    ) : listeners.map(l => (
                      <div key={l.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: 7, marginBottom: 8 }}>
                        <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--green)', flexShrink: 0 }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 1 }}>{l.name}</div>
                          <div style={{ fontSize: 11, fontFamily: 'DM Mono', color: 'var(--blue2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.url}</div>
                        </div>
                        <span className="pill pill-green" style={{ fontSize: 9 }}>ACTIVE</span>
                        <button className="btn btn-danger btn-sm" style={{ padding: '3px 8px' }} onClick={() => delLn.mutate(l.id)}>×</button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Events */}
                <div className="card">
                  <div className="card-head"><span className="card-title">Recent events</span><span className="card-meta">last 50</span></div>
                  <div style={{ padding: events.length ? 0 : 14 }}>
                    {events.length === 0 ? (
                      <div style={{ fontSize: 12, fontFamily: 'DM Mono', color: 'var(--muted)', lineHeight: 1.9, padding: '12px 4px' }}>
                        No events yet. Send your first:<br />
                        <code style={{ color: 'var(--teal)', fontSize: 11 }}>
                          curl -X POST /api/relay/in/{active.slug}<br />
                          &nbsp;-H "X-API-Key: vgl_live_..." \<br />
                          &nbsp;-d '{'{"eventType":"test","payload":{"hello":"world"}}'}'
                        </code>
                      </div>
                    ) : events.map(ev => {
                      const allDone = ev.deliveries?.every(d => d?.status === 'delivered');
                      const anyFail = ev.deliveries?.some(d => d?.status === 'failed');
                      return (
                        <div key={ev.id} className="trow" style={{ gridTemplateColumns: '1fr auto auto', display: 'grid' }}>
                          <div>
                            <div className="tname" style={{ fontFamily: 'DM Mono' }}>{ev.event_type}</div>
                            <div className="tsub">{new Date(ev.received_at).toLocaleString()} · {ev.deliveries?.length || 0} deliveries</div>
                          </div>
                          <span className={`pill ${allDone ? 'pill-green' : anyFail ? 'pill-red' : 'pill-amber'}`} style={{ alignSelf: 'center' }}>
                            <span className="dot" />{allDone ? 'DELIVERED' : anyFail ? 'FAILED' : 'PENDING'}
                          </span>
                          <button className="btn btn-ghost btn-sm" style={{ alignSelf: 'center', marginLeft: 8 }} onClick={() => replay.mutate(ev.id)} disabled={replay.isPending}>↺ Replay</button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {showCh && (
        <div className="overlay" onClick={e => e.target === e.currentTarget && setShowCh(false)}>
          <div className="modal">
            <div className="modal-title">New channel</div>
            <div className="field"><label className="label">Channel name</label>
              <input className="input" placeholder="payments" value={chF.name} onChange={e => setChF(p => ({ ...p, name: e.target.value }))} />
              <div style={{ fontSize: 10, fontFamily: 'DM Mono', color: 'var(--muted)', marginTop: 5 }}>
                Intake URL: /api/relay/in/{chF.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'channel-name'}
              </div>
            </div>
            <div className="field"><label className="label">Description (optional)</label><input className="input" placeholder="Payment events from Stripe" value={chF.description} onChange={e => setChF(p => ({ ...p, description: e.target.value }))} /></div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setShowCh(false)}>Cancel</button>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => createCh.mutate()} disabled={!chF.name || createCh.isPending}>Create channel</button>
            </div>
          </div>
        </div>
      )}
      {showLn && (
        <div className="overlay" onClick={e => e.target === e.currentTarget && setShowLn(false)}>
          <div className="modal">
            <div className="modal-title">Add listener</div>
            <div className="field"><label className="label">Name</label><input className="input" placeholder="slack-alerts" value={lnF.name} onChange={e => setLnF(p => ({ ...p, name: e.target.value }))} /></div>
            <div className="field"><label className="label">Endpoint URL</label><input className="input" placeholder="https://hooks.slack.com/services/..." value={lnF.url} onChange={e => setLnF(p => ({ ...p, url: e.target.value }))} /></div>
            <div style={{ fontSize: 11, fontFamily: 'DM Mono', color: 'var(--muted)', marginBottom: 16, background: 'var(--bg3)', padding: '8px 12px', borderRadius: 6, lineHeight: 1.7 }}>
              VIGIL POSTs every event with <code style={{ color: 'var(--teal)' }}>X-Vigil-Signature</code> for HMAC verification and <code style={{ color: 'var(--teal)' }}>X-Vigil-Event-Id</code> for deduplication.
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setShowLn(false)}>Cancel</button>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => addLn.mutate()} disabled={!lnF.url || addLn.isPending}>Add listener</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}