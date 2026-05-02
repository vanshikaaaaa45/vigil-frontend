import { Link } from 'react-router-dom';

const F = ({ icon, title, desc, color, badge }) => (
  <div style={{ background: '#0f0f17', border: '1px solid #1e1e2e', borderRadius: 12, padding: '20px 22px', position: 'relative', overflow: 'hidden', transition: 'border-color .2s' }}
    onMouseOver={e => e.currentTarget.style.borderColor = color + '40'}
    onMouseOut={e => e.currentTarget.style.borderColor = '#1e1e2e'}>
    {badge && <div style={{ position: 'absolute', top: 12, right: 12, fontSize: 9, fontWeight: 700, background: 'rgba(249,115,22,.15)', color: '#f97316', border: '1px solid rgba(249,115,22,.25)', borderRadius: 4, padding: '2px 7px', fontFamily: 'DM Mono, monospace' }}>{badge}</div>}
    <div style={{ width: 36, height: 36, borderRadius: 9, background: color + '15', border: `1px solid ${color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, marginBottom: 14 }}>{icon}</div>
    <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 8, letterSpacing: '-0.3px' }}>{title}</div>
    <div style={{ fontSize: 12, color: '#606080', fontFamily: 'DM Mono, monospace', lineHeight: 1.8 }}>{desc}</div>
  </div>
);

const CodeLine = ({ comment, children }) => (
  <div style={{ lineHeight: 2.1, fontFamily: 'DM Mono, monospace', fontSize: 12 }}>
    {comment && <span style={{ color: '#404060' }}># {comment}<br /></span>}
    {children}
  </div>
);

export default function Landing() {
  return (
    <div style={{ background: '#0a0a0f', color: '#e8e8f0', minHeight: '100vh', fontFamily: 'Inter, -apple-system, sans-serif' }}>

      {/* Nav */}
      <nav style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px', height: 58, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #1e1e2e' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 30, height: 30, background: '#f97316', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'DM Mono', fontWeight: 900, fontSize: 14, color: '#fff', boxShadow: '0 2px 8px rgba(249,115,22,.4)' }}>V</div>
          <span style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.5px' }}>VIGIL</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <a href="#features" style={{ fontSize: 13, color: '#606080', textDecoration: 'none', fontWeight: 500, transition: 'color .15s' }} onMouseOver={e => e.target.style.color = '#e8e8f0'} onMouseOut={e => e.target.style.color = '#606080'}>Features</a>
          <a href="#how" style={{ fontSize: 13, color: '#606080', textDecoration: 'none', fontWeight: 500 }} onMouseOver={e => e.target.style.color = '#e8e8f0'} onMouseOut={e => e.target.style.color = '#606080'}>How it works</a>
          <a href="#pricing" style={{ fontSize: 13, color: '#606080', textDecoration: 'none', fontWeight: 500 }} onMouseOver={e => e.target.style.color = '#e8e8f0'} onMouseOut={e => e.target.style.color = '#606080'}>Pricing</a>
          <Link to="/login" style={{ fontSize: 13, color: '#a0a0b8', fontWeight: 500, textDecoration: 'none' }}>Sign in</Link>
          <Link to="/signup" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: '#f97316', color: '#fff', padding: '8px 18px', borderRadius: 8, fontWeight: 700, fontSize: 13, textDecoration: 'none', boxShadow: '0 2px 8px rgba(249,115,22,.3)', transition: 'all .15s' }}
            onMouseOver={e => e.currentTarget.style.background = '#fb923c'}
            onMouseOut={e => e.currentTarget.style.background = '#f97316'}>
            Get started free →
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ maxWidth: 900, margin: '0 auto', padding: '90px 24px 70px', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: 'rgba(249,115,22,.08)', border: '1px solid rgba(249,115,22,.2)', borderRadius: 20, padding: '5px 14px', fontSize: 11, fontFamily: 'DM Mono, monospace', color: '#f97316', marginBottom: 28 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#f97316', animation: 'pulse 2s infinite' }} />
          Open beta · free forever for solo devs
        </div>
        <h1 style={{ fontSize: 'clamp(38px, 6vw, 68px)', fontWeight: 900, letterSpacing: '-3px', lineHeight: 1.08, marginBottom: 22 }}>
          The observability stack<br />
          <span style={{ color: '#f97316' }}>you actually ship with</span>
        </h1>
        <p style={{ fontSize: 16, color: '#606080', fontFamily: 'DM Mono, monospace', lineHeight: 1.8, maxWidth: 560, margin: '0 auto 36px' }}>
          Monitor APIs. Stream logs. Route webhooks.<br />One npm package. Zero infrastructure to manage.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/signup" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#f97316', color: '#fff', padding: '12px 26px', borderRadius: 10, fontWeight: 700, fontSize: 14, textDecoration: 'none', boxShadow: '0 4px 16px rgba(249,115,22,.35)' }}>Get started free →</Link>
          <Link to="/login" style={{ display: 'inline-flex', alignItems: 'center', background: '#0f0f17', color: '#a0a0b8', padding: '12px 26px', borderRadius: 10, fontWeight: 600, fontSize: 14, border: '1px solid #1e1e2e', textDecoration: 'none' }}>Sign in</Link>
        </div>

        {/* Code block */}
        <div style={{ background: '#0f0f17', border: '1px solid #1e1e2e', borderRadius: 14, padding: '20px 24px', marginTop: 52, textAlign: 'left', maxWidth: 560, margin: '52px auto 0', boxShadow: '0 24px 64px rgba(0,0,0,.5)' }}>
          <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
            {['#f43f5e', '#f59e0b', '#22d3a5'].map(c => <div key={c} style={{ width: 11, height: 11, borderRadius: '50%', background: c }} />)}
          </div>
          <CodeLine comment="Install">
            <span style={{ color: '#606080' }}>$ </span>npm install <span style={{ color: '#2dd4bf' }}>vigil-sdk</span>
          </CodeLine>
          <br />
          <CodeLine comment="Initialize">
            <span style={{ color: '#a78bfa' }}>import</span> Vigil <span style={{ color: '#a78bfa' }}>from</span> <span style={{ color: '#f59e0b' }}>'vigil-sdk'</span><br />
            <span style={{ color: '#a78bfa' }}>const</span> vigil = <span style={{ color: '#a78bfa' }}>new</span> Vigil(<span style={{ color: '#f59e0b' }}>'vgl_live_...'</span>)
          </CodeLine>
          <br />
          <CodeLine comment="That's it. Now use it everywhere.">
            vigil.<span style={{ color: '#2dd4bf' }}>error</span>(<span style={{ color: '#f59e0b' }}>'Payment failed'</span>, {'{ orderId, amount }'})<br />
            vigil.<span style={{ color: '#2dd4bf' }}>event</span>(<span style={{ color: '#f59e0b' }}>'payments'</span>, <span style={{ color: '#f59e0b' }}>'charge.failed'</span>, data)
          </CodeLine>
        </div>
      </section>

      {/* Stats bar */}
      <div style={{ borderTop: '1px solid #1e1e2e', borderBottom: '1px solid #1e1e2e', background: '#0f0f17', padding: '28px 24px' }}>
        <div style={{ maxWidth: 700, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 24, textAlign: 'center' }}>
          {[['< 1min', 'setup time'], ['99.9%', 'platform uptime'], ['3-in-1', 'Watch · Stream · Relay']].map(([v, l]) => (
            <div key={l}>
              <div style={{ fontSize: 30, fontWeight: 900, letterSpacing: '-1.5px', color: '#f97316', marginBottom: 4 }}>{v}</div>
              <div style={{ fontSize: 11, fontFamily: 'DM Mono, monospace', color: '#606080' }}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Features */}
      <section id="features" style={{ maxWidth: 1060, margin: '0 auto', padding: '72px 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <h2 style={{ fontSize: 34, fontWeight: 800, letterSpacing: '-1.5px', marginBottom: 10 }}>Everything you need to know your backend is alive</h2>
          <p style={{ color: '#606080', fontFamily: 'DM Mono, monospace', fontSize: 12, lineHeight: 1.8 }}>Three products. One SDK. Built for developers who ship fast.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
          <F icon="◉" color="#22d3a5" title="Watch — API Monitor" badge="Watch" desc="Check any HTTP endpoint every 60 seconds. Get emailed + Slacked when it goes down. Uptime sparkbars, response time charts, auto-resolving incidents." />
          <F icon="⚡" color="#6366f1" title="Stream — Log Aggregator" badge="Stream" desc="Real-time log stream over WebSocket. Full-text search. Service + level filters. Sliding-window alert rules fire when error counts spike. Click any log for full metadata." />
          <F icon="⟳" color="#a78bfa" title="Relay — Webhook Router" badge="Relay" desc="Fan-out a single webhook to multiple services. HMAC-SHA256 signed delivery. 3 automatic retries (5s → 30s → 2min). One-click event replay." />
          <F icon="🌐" color="#2dd4bf" title="Public Status Page" desc="A public /status/your-company URL showing live monitor statuses. No login needed. Share with customers so they can self-serve during incidents." />
          <F icon="📧" color="#f59e0b" title="Smart Alerts" desc="Email + Slack + Discord alerts. Monitor down/up, log alert rules, weekly digest. Per-monitor Slack overrides or global account-level webhook." />
          <F icon="📦" color="#f43f5e" title="vigil-sdk" badge="npm" desc="npm install vigil-sdk. Five methods: vigil.log() vigil.error() vigil.warn() vigil.info() vigil.event(). Never crashes your app — all errors are silent." />
        </div>
      </section>

      {/* How it works */}
      <section id="how" style={{ background: '#0f0f17', borderTop: '1px solid #1e1e2e', borderBottom: '1px solid #1e1e2e', padding: '72px 24px' }}>
        <div style={{ maxWidth: 820, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: 30, fontWeight: 800, letterSpacing: '-1px', marginBottom: 10 }}>Live in under 2 minutes</h2>
          <p style={{ color: '#606080', fontFamily: 'DM Mono, monospace', fontSize: 12, marginBottom: 44 }}>No YAML. No Docker. No Kubernetes. No infrastructure.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14 }}>
            {[
              ['01', 'Create account', 'Sign up — free forever for solo devs. No credit card.'],
              ['02', 'Add a monitor', 'Paste any URL. VIGIL starts checking it every 60 seconds.'],
              ['03', 'Install SDK', 'npm install vigil-sdk → one line to initialize → done.'],
              ['04', 'Sleep well', 'You get paged when something breaks. Not your users.'],
            ].map(([n, t, d]) => (
              <div key={n} style={{ background: '#0a0a0f', border: '1px solid #1e1e2e', borderRadius: 11, padding: '18px 20px', textAlign: 'left' }}>
                <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 11, color: '#f97316', fontWeight: 700, marginBottom: 10 }}>{n}</div>
                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 7 }}>{t}</div>
                <div style={{ fontSize: 11, color: '#606080', fontFamily: 'DM Mono, monospace', lineHeight: 1.7 }}>{d}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" style={{ maxWidth: 820, margin: '0 auto', padding: '72px 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: 44 }}>
          <h2 style={{ fontSize: 30, fontWeight: 800, letterSpacing: '-1px', marginBottom: 10 }}>Simple pricing</h2>
          <p style={{ color: '#606080', fontFamily: 'DM Mono, monospace', fontSize: 12 }}>Start free. Upgrade when you grow.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, maxWidth: 640, margin: '0 auto' }}>
          {[
            { name: 'Free', price: '$0', period: 'forever', features: ['3 monitors', '7 days log retention', '1 relay channel', 'Email alerts', 'Public status page'], cta: 'Get started', link: '/signup', accent: false },
            { name: 'Pro', price: '$9', period: 'per month', features: ['Unlimited monitors', '30 days log retention', 'Unlimited relay channels', 'Email + Slack + Discord', 'Priority support'], cta: 'Coming soon', link: '/signup', accent: true },
          ].map(plan => (
            <div key={plan.name} style={{ background: '#0f0f17', border: `1px solid ${plan.accent ? 'rgba(249,115,22,.4)' : '#1e1e2e'}`, borderRadius: 14, padding: '24px', position: 'relative', boxShadow: plan.accent ? '0 0 40px rgba(249,115,22,.08)' : 'none' }}>
              {plan.accent && <div style={{ position: 'absolute', top: -1, left: 24, right: 24, height: 2, background: 'linear-gradient(90deg, #f97316, #fb923c)', borderRadius: '0 0 2px 2px' }} />}
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>{plan.name}</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 20 }}>
                <span style={{ fontSize: 36, fontWeight: 900, letterSpacing: '-2px', color: plan.accent ? '#f97316' : '#e8e8f0' }}>{plan.price}</span>
                <span style={{ fontSize: 12, fontFamily: 'DM Mono, monospace', color: '#606080' }}>/{plan.period}</span>
              </div>
              <div style={{ marginBottom: 20 }}>
                {plan.features.map(f => (
                  <div key={f} style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '6px 0', fontSize: 13, color: '#a0a0b8', borderBottom: '1px solid #1e1e2e' }}>
                    <span style={{ color: '#22d3a5', fontSize: 11 }}>✓</span> {f}
                  </div>
                ))}
              </div>
              <Link to={plan.link} style={{ display: 'block', textAlign: 'center', background: plan.accent ? '#f97316' : '#141420', color: plan.accent ? '#fff' : '#a0a0b8', padding: '10px', borderRadius: 8, fontWeight: 700, fontSize: 13, textDecoration: 'none', border: `1px solid ${plan.accent ? 'transparent' : '#1e1e2e'}` }}>
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ background: '#0f0f17', borderTop: '1px solid #1e1e2e', padding: '72px 24px', textAlign: 'center' }}>
        <h2 style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-1px', marginBottom: 14 }}>Open VIGIL when something breaks</h2>
        <p style={{ color: '#606080', fontFamily: 'DM Mono, monospace', fontSize: 12, lineHeight: 1.8, marginBottom: 32 }}>
          Everything you need. One dashboard. Free forever for solo devs.
        </p>
        <Link to="/signup" style={{ display: 'inline-flex', alignItems: 'center', background: '#f97316', color: '#fff', padding: '12px 28px', borderRadius: 10, fontWeight: 700, fontSize: 14, textDecoration: 'none', boxShadow: '0 4px 16px rgba(249,115,22,.3)' }}>Start for free →</Link>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid #1e1e2e', padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 22, height: 22, background: '#f97316', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'DM Mono', fontWeight: 900, fontSize: 11, color: '#fff' }}>V</div>
          <span style={{ fontSize: 13, fontWeight: 700 }}>VIGIL</span>
          <span style={{ fontSize: 11, fontFamily: 'DM Mono, monospace', color: '#404060' }}>· Built for developers who ship fast and sleep well.</span>
        </div>
        <div style={{ display: 'flex', gap: 20 }}>
          <Link to="/signup" style={{ fontSize: 12, color: '#606080', textDecoration: 'none' }}>Sign up</Link>
          <Link to="/login" style={{ fontSize: 12, color: '#606080', textDecoration: 'none' }}>Login</Link>
        </div>
      </footer>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.3} }
        * { box-sizing: border-box; }
      `}</style>
    </div>
  );
}