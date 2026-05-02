import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/client';

const SYS = {
  operational: { label: 'All systems operational', color: '#22d3a5', bg: 'rgba(34,211,165,.06)', border: 'rgba(34,211,165,.2)' },
  degraded:    { label: 'Service disruption',       color: '#f43f5e', bg: 'rgba(244,63,94,.06)',  border: 'rgba(244,63,94,.2)' },
  partial:     { label: 'Partial outage',           color: '#f59e0b', bg: 'rgba(245,158,11,.06)', border: 'rgba(245,158,11,.2)' },
};

const MON_COLOR = { up: '#22d3a5', down: '#f43f5e', slow: '#f59e0b', pending: '#606080' };

export default function StatusPage() {
  const { slug } = useParams();
  const [data, setData]   = useState(null);
  const [err, setErr]     = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/status/${slug}`)
      .then(r => { setData(r.data); setLoading(false); })
      .catch(e => { setErr(e.response?.data?.error || 'Not found'); setLoading(false); });
    const t = setInterval(() => api.get(`/status/${slug}`).then(r => setData(r.data)).catch(() => {}), 60_000);
    return () => clearInterval(t);
  }, [slug]);

  const font = { fontFamily: 'Inter, -apple-system, sans-serif' };

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f', display: 'flex', alignItems: 'center', justifyContent: 'center', ...font }}>
      <div style={{ color: '#606080', fontSize: 12, fontFamily: 'DM Mono, monospace' }}>Loading…</div>
    </div>
  );

  if (err) return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 20, ...font }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
      <h1 style={{ fontSize: 22, fontWeight: 800, color: '#e8e8f0', marginBottom: 10 }}>Status page not found</h1>
      <p style={{ color: '#606080', fontSize: 12, fontFamily: 'DM Mono, monospace', marginBottom: 24 }}>/{slug} doesn't exist</p>
      <Link to="/" style={{ display: 'inline-block', background: '#f97316', color: '#fff', padding: '9px 20px', borderRadius: 7, fontWeight: 700, fontSize: 13, textDecoration: 'none' }}>Go to VIGIL →</Link>
    </div>
  );

  const sys = SYS[data.system_status] || SYS.operational;
  const openInc = data.incidents?.filter(i => i.status === 'open') || [];
  const pastInc = data.incidents?.filter(i => i.status === 'resolved').slice(0, 5) || [];

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f', color: '#e8e8f0', ...font }}>
      {/* Header */}
      <div style={{ borderBottom: '1px solid #1e1e2e', background: '#0f0f17' }}>
        <div style={{ maxWidth: 780, margin: '0 auto', padding: '0 24px', height: 54, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 28, height: 28, background: '#f97316', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'DM Mono, monospace', fontWeight: 900, fontSize: 14, color: '#fff' }}>V</div>
            <div>
              <span style={{ fontWeight: 800, fontSize: 15 }}>{data.org}</span>
              <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 11, color: '#606080', marginLeft: 6 }}>Status</span>
            </div>
          </div>
          <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 10, color: '#606080' }}>
            Updated {new Date(data.generated_at).toLocaleTimeString()} · auto-refreshes every 60s
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 780, margin: '0 auto', padding: '36px 24px' }}>

        {/* System status banner */}
        <div style={{ background: sys.bg, border: `1px solid ${sys.border}`, borderRadius: 12, padding: '20px 24px', marginBottom: 28, display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 12, height: 12, borderRadius: '50%', background: sys.color, boxShadow: `0 0 10px ${sys.color}80`, flexShrink: 0, animation: data.system_status !== 'operational' ? 'pulse 2s infinite' : 'none' }} />
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: sys.color, marginBottom: 3, letterSpacing: '-0.3px' }}>{sys.label}</div>
            <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 11, color: '#606080' }}>{data.monitors?.length || 0} services monitored</div>
          </div>
        </div>

        {/* Active incidents */}
        {openInc.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 10, color: '#f43f5e', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>Active incidents ({openInc.length})</div>
            {openInc.map((inc, i) => (
              <div key={i} style={{ background: 'rgba(244,63,94,.04)', border: '1px solid rgba(244,63,94,.15)', borderRadius: 9, padding: '13px 16px', marginBottom: 8 }}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{inc.title}</div>
                <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 11, color: '#606080' }}>{inc.monitor_name} · Started {new Date(inc.started_at).toLocaleString()}</div>
              </div>
            ))}
          </div>
        )}

        {/* Monitors */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 10, color: '#606080', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>Services</div>
          <div style={{ background: '#0f0f17', border: '1px solid #1e1e2e', borderRadius: 12, overflow: 'hidden' }}>
            {data.monitors?.length === 0 ? (
              <div style={{ padding: 24, textAlign: 'center', color: '#606080', fontFamily: 'DM Mono, monospace', fontSize: 12 }}>No monitors configured</div>
            ) : data.monitors?.map((m, i) => (
              <div key={m.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: i < data.monitors.length - 1 ? '1px solid #1e1e2e' : 'none' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>{m.name}</div>
                  <div style={{ fontSize: 11, fontFamily: 'DM Mono, monospace', color: '#606080', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.url}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 18, flexShrink: 0 }}>
                  {m.uptime_pct !== null && (
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 13, fontWeight: 700, fontFamily: 'DM Mono, monospace', color: m.uptime_pct >= 99 ? '#22d3a5' : m.uptime_pct >= 95 ? '#f59e0b' : '#f43f5e' }}>{m.uptime_pct}%</div>
                      <div style={{ fontSize: 9, fontFamily: 'DM Mono, monospace', color: '#606080' }}>30d uptime</div>
                    </div>
                  )}
                  {m.last_response_ms && (
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 13, fontWeight: 700, fontFamily: 'DM Mono, monospace', color: '#a0a0b8' }}>{m.last_response_ms}ms</div>
                      <div style={{ fontSize: 9, fontFamily: 'DM Mono, monospace', color: '#606080' }}>response</div>
                    </div>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: `${MON_COLOR[m.last_status]}14`, border: `1px solid ${MON_COLOR[m.last_status]}30`, borderRadius: 20, padding: '5px 11px' }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: MON_COLOR[m.last_status], animation: m.last_status === 'down' ? 'pulse 2s infinite' : 'none' }} />
                    <span style={{ fontSize: 10, fontFamily: 'DM Mono, monospace', fontWeight: 600, color: MON_COLOR[m.last_status] }}>{m.last_status?.toUpperCase() || 'UNKNOWN'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Past incidents */}
        {pastInc.length > 0 && (
          <div>
            <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 10, color: '#606080', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>Past incidents (30 days)</div>
            {pastInc.map((inc, i) => (
              <div key={i} style={{ background: '#0f0f17', border: '1px solid #1e1e2e', borderRadius: 9, padding: '11px 16px', marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 3 }}>{inc.title}</div>
                  <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 11, color: '#606080' }}>
                    {inc.monitor_name} · {new Date(inc.started_at).toLocaleDateString()} · {inc.duration_seconds ? `${Math.round(inc.duration_seconds / 60)}m` : '—'}
                  </div>
                </div>
                <span style={{ fontSize: 10, fontFamily: 'DM Mono, monospace', color: '#22d3a5', background: 'rgba(34,211,165,.08)', border: '1px solid rgba(34,211,165,.15)', borderRadius: 4, padding: '2px 7px', flexShrink: 0, marginLeft: 12 }}>RESOLVED</span>
              </div>
            ))}
          </div>
        )}

        {openInc.length === 0 && pastInc.length === 0 && (
          <div style={{ textAlign: 'center', padding: '20px 0', color: '#606080', fontFamily: 'DM Mono, monospace', fontSize: 12 }}>No incidents in the last 30 days 🎉</div>
        )}

        {/* Footer */}
        <div style={{ marginTop: 44, paddingTop: 18, borderTop: '1px solid #1e1e2e', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 11, fontFamily: 'DM Mono, monospace', color: '#606080' }}>Powered by VIGIL</span>
          <Link to="/signup" style={{ fontSize: 11, fontFamily: 'DM Mono, monospace', color: '#f97316', textDecoration: 'none' }}>Get your own status page →</Link>
        </div>
      </div>

      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.3} }`}</style>
    </div>
  );
}