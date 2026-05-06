import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ textAlign: 'center', maxWidth: 440 }}>
        {/* Logo */}
        <div style={{ width: 48, height: 48, background: 'var(--accent)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'DM Mono', fontWeight: 900, fontSize: 22, color: '#fff', margin: '0 auto 32px', boxShadow: '0 4px 16px rgba(249,115,22,.4)' }}>V</div>

        {/* 404 */}
        <div style={{ fontSize: 80, fontWeight: 900, letterSpacing: '-4px', lineHeight: 1, color: 'var(--border3)', marginBottom: 16, fontFamily: 'DM Mono' }}>404</div>

        <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.5px', marginBottom: 10 }}>
          Page not found
        </h1>
        <p style={{ fontSize: 13, fontFamily: 'DM Mono', color: 'var(--muted)', lineHeight: 1.8, marginBottom: 32 }}>
          The page you're looking for doesn't exist<br />or may have been moved.
        </p>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/watch" className="btn btn-primary">
            ← Go to dashboard
          </Link>
          <Link to="/" className="btn btn-ghost">
            Back to home
          </Link>
        </div>

        {/* Quick links */}
        <div style={{ marginTop: 40, padding: '16px 20px', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 10 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12, fontFamily: 'DM Mono' }}>
            Quick links
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
            {[
              { to: '/watch',    label: '◉ Watch' },
              { to: '/stream',   label: '⚡ Stream' },
              { to: '/relay',    label: '⟳ Relay' },
              { to: '/settings', label: '⚙ Settings' },
            ].map(l => (
              <Link key={l.to} to={l.to} style={{ padding: '5px 12px', background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: 6, fontSize: 12, fontFamily: 'DM Mono', color: 'var(--text2)', transition: 'all .15s' }}
                onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)'; }}
                onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--border2)'; e.currentTarget.style.color = 'var(--text2)'; }}>
                {l.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}