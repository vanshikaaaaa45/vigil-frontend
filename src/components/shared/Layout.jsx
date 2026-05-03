import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../store/auth';
import { useQuery } from '@tanstack/react-query';
import api from '../../api/client';
import { useState } from 'react';

const PLATFORM_NAV = [
  {
    to: '/watch', label: 'Watch', icon: (
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5"/>
        <circle cx="8" cy="8" r="2" fill="currentColor"/>
        <path d="M8 2v2M8 12v2M2 8h2M12 8h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ), sub: 'API Monitor',
  },
  {
    to: '/stream', label: 'Stream', icon: (
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
        <path d="M2 4h12M2 8h8M2 12h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ), sub: 'Log Aggregator',
  },
  {
    to: '/relay', label: 'Relay', icon: (
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
        <circle cx="3" cy="8" r="2" stroke="currentColor" strokeWidth="1.5"/>
        <circle cx="13" cy="4" r="2" stroke="currentColor" strokeWidth="1.5"/>
        <circle cx="13" cy="12" r="2" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M5 8l6-4M5 8l6 4" stroke="currentColor" strokeWidth="1.5"/>
      </svg>
    ), sub: 'Webhook Router',
  },
];

const ACCOUNT_NAV = [
  {
    to: '/team', label: 'Team', icon: (
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
        <circle cx="5" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.5"/>
        <circle cx="11" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M1 13c0-2 1.8-3.5 4-3.5s4 1.5 4 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M11 9.5c2.2 0 4 1.5 4 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    to: '/keys', label: 'API Keys', icon: (
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
        <circle cx="6" cy="7" r="3.5" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M9 9l5 5M12 12l-2-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    to: '/settings', label: 'Settings', icon: (
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.05 3.05l1.41 1.41M11.54 11.54l1.41 1.41M3.05 12.95l1.41-1.41M11.54 4.46l1.41-1.41" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  },
];

function LiveDot({ status }) {
  const colors = { up: '#22d3a5', down: '#f43f5e', pending: '#f59e0b' };
  return (
    <div style={{ width: 7, height: 7, borderRadius: '50%', background: colors[status] || colors.pending, boxShadow: `0 0 6px ${colors[status] || colors.pending}80`, animation: 'pulse 2.5s infinite', flexShrink: 0 }} />
  );
}

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const { data: stats } = useQuery({
    queryKey: ['global-stats'],
    queryFn: () => api.get('/monitors/stats').then(r => r.data),
    refetchInterval: 30_000,
  });

  const handleLogout = async () => {
    try { await api.post('/auth/logout'); } catch {}
    logout();
    navigate('/');
  };

  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'VS';
  const overallDown = stats?.monitors?.down > 0;
  const overallStatus = overallDown ? 'down' : (stats?.monitors?.up > 0 ? 'up' : 'pending');

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--bg)' }}>

      {/* ── Sidebar ─────────────────────────────────────────────── */}
      <aside style={{
        width: collapsed ? 56 : 220, flexShrink: 0,
        background: 'var(--bg2)', borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column', transition: 'width .2s',
        overflow: 'hidden',
      }}>
        {/* Logo */}
        <div style={{ height: 52, padding: '0 14px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
          <div style={{ width: 28, height: 28, background: 'var(--accent)', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'DM Mono', fontWeight: 900, fontSize: 14, color: '#fff', flexShrink: 0, boxShadow: '0 2px 8px rgba(249,115,22,.4)' }}>V</div>
          {!collapsed && (
            <>
              <span style={{ fontSize: 16, fontWeight: 800, letterSpacing: '-0.5px', whiteSpace: 'nowrap' }}>VIGIL</span>
              <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 5 }}>
                <LiveDot status={overallStatus} />
              </div>
            </>
          )}
        </div>

        {/* Nav content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '10px 8px 0' }}>
          {!collapsed && (
            <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--muted)', letterSpacing: '0.12em', textTransform: 'uppercase', padding: '10px 8px 5px' }}>Platform</div>
          )}

          {PLATFORM_NAV.map(({ to, label, icon, sub }) => {
            const isActive = location.pathname === to || location.pathname.startsWith(to + '/');
            return (
              <NavLink key={to} to={to} title={collapsed ? label : undefined} style={{
                display: 'flex', alignItems: 'center', gap: 9,
                padding: collapsed ? '9px 0' : '8px 10px',
                justifyContent: collapsed ? 'center' : 'flex-start',
                borderRadius: 7, margin: '1px 0', fontSize: 13, fontWeight: 600,
                color: isActive ? 'var(--text)' : 'var(--muted)',
                background: isActive ? 'var(--bg4)' : 'transparent',
                textDecoration: 'none', transition: 'all .12s',
                borderLeft: isActive && !collapsed ? '2px solid var(--accent)' : '2px solid transparent',
                position: 'relative',
              }}>
                <span style={{ flexShrink: 0, display: 'flex', alignItems: 'center', color: isActive ? 'var(--accent)' : 'currentColor' }}>{icon}</span>
                {!collapsed && <span>{label}</span>}
                {isActive && !collapsed && (
                  <span style={{ marginLeft: 'auto', fontSize: 9, fontFamily: 'DM Mono', color: 'var(--muted)', background: 'var(--bg5)', padding: '1px 5px', borderRadius: 4 }}>{sub}</span>
                )}
              </NavLink>
            );
          })}

          {!collapsed && (
            <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--muted)', letterSpacing: '0.12em', textTransform: 'uppercase', padding: '16px 8px 5px' }}>Account</div>
          )}
          {!collapsed && <div style={{ height: 1, background: 'var(--border)', margin: '0 0 8px' }} />}

          {ACCOUNT_NAV.map(({ to, label, icon }) => {
            const isActive = location.pathname === to;
            return (
              <NavLink key={to} to={to} title={collapsed ? label : undefined} style={{
                display: 'flex', alignItems: 'center', gap: 9,
                padding: collapsed ? '9px 0' : '8px 10px',
                justifyContent: collapsed ? 'center' : 'flex-start',
                borderRadius: 7, margin: '1px 0', fontSize: 13, fontWeight: 600,
                color: isActive ? 'var(--text)' : 'var(--muted)',
                background: isActive ? 'var(--bg4)' : 'transparent',
                textDecoration: 'none', transition: 'all .12s',
                borderLeft: isActive && !collapsed ? '2px solid var(--accent)' : '2px solid transparent',
              }}>
                <span style={{ flexShrink: 0, display: 'flex', alignItems: 'center', color: isActive ? 'var(--accent)' : 'currentColor' }}>{icon}</span>
                {!collapsed && <span>{label}</span>}
              </NavLink>
            );
          })}
        </div>

        {/* System status summary */}
        {!collapsed && stats && (
          <div style={{ padding: '10px 14px', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', background: 'var(--bg3)' }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>System health</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
              {[['UP', stats.monitors?.up || 0, 'var(--green)'], ['DOWN', stats.monitors?.down || 0, 'var(--red)'], ['INC', stats.incidents?.open || 0, stats.incidents?.open > 0 ? 'var(--amber)' : 'var(--muted)']].map(([label, val, color]) => (
                <div key={label} style={{ background: 'var(--bg4)', borderRadius: 5, padding: '5px 7px', textAlign: 'center' }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color, lineHeight: 1, marginBottom: 2 }}>{val}</div>
                  <div style={{ fontSize: 9, fontFamily: 'DM Mono', color: 'var(--muted)' }}>{label}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Collapse toggle + User footer */}
        <div style={{ padding: '10px 10px', display: 'flex', alignItems: 'center', gap: 8, borderTop: '1px solid var(--border)', flexShrink: 0 }}>
          {!collapsed && (
            <>
              <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'linear-gradient(135deg,var(--purple),var(--accent))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0, color: '#fff' }}>{initials}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text)' }}>{user?.name}</div>
                <div style={{ fontSize: 10, color: 'var(--muted)', fontFamily: 'DM Mono', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email}</div>
              </div>
            </>
          )}
          <button onClick={handleLogout} title="Sign out" style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 14, padding: 4, flexShrink: 0, borderRadius: 5, transition: 'color .12s, background .12s' }}
            onMouseOver={e => { e.target.style.color = 'var(--red)'; e.target.style.background = 'rgba(244,63,94,.08)'; }}
            onMouseOut={e => { e.target.style.color = 'var(--muted)'; e.target.style.background = ''; }}>⏻</button>
          {!collapsed && (
            <button onClick={() => setCollapsed(true)} title="Collapse sidebar" style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 12, padding: 4, borderRadius: 5, transition: 'color .12s' }}
              onMouseOver={e => e.target.style.color = 'var(--text)'}
              onMouseOut={e => e.target.style.color = 'var(--muted)'}>‹‹</button>
          )}
          {collapsed && (
            <button onClick={() => setCollapsed(false)} title="Expand sidebar" style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 12, padding: 4, borderRadius: 5 }}
              onMouseOver={e => e.target.style.color = 'var(--text)'}
              onMouseOut={e => e.target.style.color = 'var(--muted)'}>››</button>
          )}
        </div>
      </aside>

      {/* ── Main ────────────────────────────────────────────────── */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        <Outlet />
      </main>
    </div>
  );
}