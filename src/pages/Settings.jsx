import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '../store/auth';
import api from '../api/client';

const UPGRADE_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSfv6UQHAxGNlZWP65rqhWyRdMWQkZnvQuOVd68b8RIrye8xag/viewform';

const PLANS = {
  free: { monitors: 3, relay_channels: 1, log_retention_days: 7,  price: '$0',  label: 'Free' },
  pro:  { monitors: 50, relay_channels: 20, log_retention_days: 30, price: '$9',  label: 'Pro'  },
  team: { monitors: 200, relay_channels: 100, log_retention_days: 90, price: '$29', label: 'Team' },
};

const Toggle = ({ on, onChange }) => (
  <div onClick={() => onChange(!on)} style={{ width: 38, height: 22, borderRadius: 11, background: on ? 'var(--accent)' : 'var(--border2)', position: 'relative', cursor: 'pointer', flexShrink: 0, transition: 'background .2s', boxShadow: on ? '0 0 8px rgba(249,115,22,.3)' : 'none' }}>
    <div style={{ width: 16, height: 16, background: '#fff', borderRadius: '50%', position: 'absolute', top: 3, left: on ? 19 : 3, transition: 'left .18s', boxShadow: '0 1px 3px rgba(0,0,0,.4)' }} />
  </div>
);

// Usage bar component
const UsageBar = ({ label, current, limit, unit = '' }) => {
  const pct = Math.min((current / limit) * 100, 100);
  const color = pct >= 90 ? 'var(--red)' : pct >= 70 ? 'var(--amber)' : 'var(--green)';
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, fontSize: 12 }}>
        <span style={{ color: 'var(--text2)' }}>{label}</span>
        <span style={{ fontFamily: 'DM Mono', fontSize: 11, color: pct >= 90 ? 'var(--red)' : 'var(--muted)' }}>
          {current}/{limit}{unit}
          {pct >= 90 && <span style={{ marginLeft: 6, color: 'var(--red)' }}>⚠ Near limit</span>}
        </span>
      </div>
      <div style={{ height: 5, background: 'var(--bg4)', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 3, transition: 'width .4s' }} />
      </div>
    </div>
  );
};

export default function Settings() {
  const { user, setUser } = useAuth();
  const [name, setName]           = useState(user?.name || '');
  const [saved, setSaved]         = useState(false);
  const [slug, setSlug]           = useState('');
  const [slugSaved, setSlugSaved] = useState(false);
  const [slugErr, setSlugErr]     = useState('');
  const [copied, setCopied]       = useState(false);
  const [notifs, setNotifs]       = useState({ monitor_alerts: true, log_alert_rules: true, relay_failures: false, weekly_summary: true, slack_webhook_url: '', discord_webhook_url: '' });

  const { data: ns }       = useQuery({ queryKey: ['notif-settings'], queryFn: () => api.get('/settings/notifications').then(r => r.data.settings) });
  const { data: slugData } = useQuery({ queryKey: ['status-slug'],    queryFn: () => api.get('/settings/status-slug').then(r => r.data) });

  // Usage data for plan limits
  const { data: monitorStats } = useQuery({ queryKey: ['watch-stats'],  queryFn: () => api.get('/monitors/stats').then(r => r.data) });
  const { data: relayStats }   = useQuery({ queryKey: ['relay-stats'],  queryFn: () => api.get('/relay/stats').then(r => r.data.stats) });

  useEffect(() => { if (ns) setNotifs({ monitor_alerts: ns.monitor_alerts ?? true, log_alert_rules: ns.log_alert_rules ?? true, relay_failures: ns.relay_failures ?? false, weekly_summary: ns.weekly_summary ?? true, slack_webhook_url: ns.slack_webhook_url || '', discord_webhook_url: ns.discord_webhook_url || '' }); }, [ns]);
  useEffect(() => { if (slugData?.slug) setSlug(slugData.slug); }, [slugData]);

  const saveProfile = useMutation({ mutationFn: () => api.patch('/auth/profile', { name }), onSuccess: r => { setUser(r.data.user); setSaved(true); setTimeout(() => setSaved(false), 2500); } });
  const saveNotifs  = useMutation({ mutationFn: d => api.patch('/settings/notifications', d) });
  const saveSlug    = useMutation({ mutationFn: () => api.patch('/settings/status-slug', { slug }), onSuccess: () => { setSlugSaved(true); setSlugErr(''); setTimeout(() => setSlugSaved(false), 2500); }, onError: e => setSlugErr(e.response?.data?.error || 'Failed') });

  const toggleNotif = (key, val) => { const u = { ...notifs, [key]: val }; setNotifs(u); saveNotifs.mutate(u); };
  const statusUrl = slug ? `${window.location.origin}/status/${slug}` : null;

  const plan    = user?.plan || 'free';
  const limits  = PLANS[plan] || PLANS.free;
  const isPro   = plan !== 'free';

  const monitorCount = monitorStats?.monitors?.total || 0;
  const relayCount   = Number(relayStats?.channels   || 0);

  const Section = ({ title, children, action }) => (
    <div className="card" style={{ marginBottom: 14 }}>
      <div className="card-head">
        <span className="card-title">{title}</span>
        {action}
      </div>
      <div style={{ padding: '14px 18px' }}>{children}</div>
    </div>
  );

  const Row = ({ label, desc, value, onChange }) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 0', borderBottom: '1px solid var(--border)' }}>
      <div style={{ flex: 1, marginRight: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2, color: 'var(--text)' }}>{label}</div>
        <div style={{ fontSize: 11, fontFamily: 'DM Mono', color: 'var(--muted)', lineHeight: 1.6 }}>{desc}</div>
      </div>
      <Toggle on={value} onChange={onChange} />
    </div>
  );

  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'V';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="topbar">
        <div>
          <div className="topbar-title">Settings</div>
          <div className="topbar-sub">Profile · plan · notifications · status page · alert channels</div>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => saveProfile.mutate()} disabled={saveProfile.isPending}>
          {saved ? '✓ Saved' : saveProfile.isPending ? 'Saving…' : 'Save changes'}
        </button>
      </div>

      <div className="page-scroll">
        <div style={{ maxWidth: 720 }}>

          {/* Profile */}
          <Section title="Profile">
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, paddingBottom: 16, borderBottom: '1px solid var(--border)', marginBottom: 16 }}>
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'linear-gradient(135deg,var(--purple),var(--accent))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, color: '#fff', flexShrink: 0 }}>{initials}</div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700 }}>{user?.name}</div>
                <div style={{ fontSize: 11, fontFamily: 'DM Mono', color: 'var(--muted)', marginTop: 2 }}>
                  {user?.email} · <span style={{ color: 'var(--accent)' }}>{plan} plan</span>
                </div>
              </div>
            </div>
            <div className="field"><label className="label">Display name</label><input className="input" value={name} onChange={e => setName(e.target.value)} /></div>
            <div className="field" style={{ marginBottom: 0 }}>
              <label className="label">Email</label>
              <input className="input" value={user?.email || ''} disabled style={{ opacity: .5 }} />
            </div>
          </Section>

          {/* ── Plan + Usage ─────────────────────────────────────── */}
          <div className="card" style={{ marginBottom: 14, overflow: 'hidden' }}>
            <div className="card-head">
              <span className="card-title">Plan &amp; usage</span>
              <span style={{ fontSize: 11, fontFamily: 'DM Mono', padding: '2px 8px', borderRadius: 4, background: isPro ? 'rgba(249,115,22,.1)' : 'var(--bg4)', color: isPro ? 'var(--accent)' : 'var(--muted)', fontWeight: 600 }}>
                {limits.label} — {limits.price}{isPro ? '/mo' : ' forever'}
              </span>
            </div>

            <div style={{ padding: '16px 18px' }}>
              {/* Usage bars */}
              <UsageBar label="Monitors"      current={monitorCount} limit={limits.monitors}      />
              <UsageBar label="Relay channels" current={relayCount}   limit={limits.relay_channels} />
              {/* Log retention is a feature, not a usage counter */}
              <div style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, fontSize: 12 }}>
                  <span style={{ color: 'var(--text2)' }}>Log retention</span>
                  <span style={{ fontFamily: 'DM Mono', fontSize: 11, color: 'var(--muted)' }}>
                    {limits.log_retention_days} days
                    {plan === 'free' && <span style={{ marginLeft: 8, color: 'var(--blue2)' }}>↑ 30 days on Pro</span>}
                  </span>
                </div>
                <div style={{ height: 5, background: 'var(--bg4)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ width: `${(limits.log_retention_days / 90) * 100}%`, height: '100%', background: 'var(--blue2)', borderRadius: 3 }} />
                </div>
              </div>
            </div>

            {/* Plan comparison */}
            {!isPro && (
              <div style={{ borderTop: '1px solid var(--border)', padding: '14px 18px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 16 }}>
                  {Object.entries(PLANS).map(([key, p]) => (
                    <div key={key} style={{ background: key === plan ? 'rgba(249,115,22,.06)' : 'var(--bg3)', border: `1px solid ${key === plan ? 'rgba(249,115,22,.3)' : 'var(--border2)'}`, borderRadius: 8, padding: '12px 14px' }}>
                      <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4, display: 'flex', justifyContent: 'space-between' }}>
                        <span>{p.label}</span>
                        {key === plan && <span style={{ fontSize: 9, fontFamily: 'DM Mono', color: 'var(--accent)', fontWeight: 700 }}>CURRENT</span>}
                      </div>
                      <div style={{ fontSize: 18, fontWeight: 800, color: key === 'free' ? 'var(--text)' : 'var(--accent)', marginBottom: 8 }}>
                        {p.price}<span style={{ fontSize: 10, fontWeight: 400, color: 'var(--muted)' }}>{key !== 'free' ? '/mo' : ''}</span>
                      </div>
                      {[
                        `${p.monitors} monitors`,
                        `${p.relay_channels} relay channel${p.relay_channels > 1 ? 's' : ''}`,
                        `${p.log_retention_days}d log retention`,
                      ].map(f => (
                        <div key={f} style={{ fontSize: 11, fontFamily: 'DM Mono', color: 'var(--muted)', lineHeight: 2 }}>
                          <span style={{ color: 'var(--green)', marginRight: 5 }}>✓</span>{f}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>

                {/* Upgrade button */}
                <a href={UPGRADE_URL} target="_blank" rel="noreferrer"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', padding: '11px', borderRadius: 8, background: 'var(--accent)', color: '#fff', fontWeight: 700, fontSize: 14, textDecoration: 'none', boxShadow: '0 4px 12px rgba(249,115,22,.3)', transition: 'opacity .15s' }}
                  onMouseOver={e => e.currentTarget.style.opacity = '.9'}
                  onMouseOut={e => e.currentTarget.style.opacity = '1'}>
                  ⚡ Upgrade to Pro — $9/month
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </a>
                <div style={{ textAlign: 'center', fontSize: 11, fontFamily: 'DM Mono', color: 'var(--muted)', marginTop: 8 }}>
                  Join the waitlist — we'll email you when payments go live
                </div>
              </div>
            )}

            {isPro && (
              <div style={{ padding: '12px 18px', borderTop: '1px solid var(--border)', background: 'rgba(249,115,22,.03)', fontSize: 12, fontFamily: 'DM Mono', color: 'var(--muted)' }}>
                ✓ Pro plan active · <a href={UPGRADE_URL} target="_blank" rel="noreferrer" style={{ color: 'var(--accent)', textDecoration: 'none' }}>Manage subscription</a>
              </div>
            )}
          </div>

          {/* Public status page */}
          <Section title="Public status page" action={<span className="card-meta">no login required</span>}>
            <p style={{ fontSize: 12, fontFamily: 'DM Mono', color: 'var(--muted)', marginBottom: 14, lineHeight: 1.8 }}>
              A public URL showing your monitor statuses in real-time — like statuspage.io, built into VIGIL. Share it with your users so they can check uptime without contacting you.
            </p>
            <div className="field">
              <label className="label">Your status page URL</label>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{ fontFamily: 'DM Mono', fontSize: 12, color: 'var(--muted)', flexShrink: 0 }}>{window.location.origin}/status/</span>
                <input className="input" placeholder="your-company" value={slug} onChange={e => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))} style={{ flex: 1 }} />
                <button className="btn btn-primary btn-sm" onClick={() => saveSlug.mutate()} disabled={!slug || saveSlug.isPending}>{slugSaved ? '✓' : 'Save'}</button>
              </div>
              {slugErr && <div style={{ fontSize: 11, color: 'var(--red)', fontFamily: 'DM Mono', marginTop: 5 }}>{slugErr}</div>}
              {statusUrl && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: 6, padding: '8px 12px' }}>
                  <span style={{ fontFamily: 'DM Mono', fontSize: 11, color: 'var(--teal)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{statusUrl}</span>
                  <button className="btn btn-ghost btn-sm" onClick={() => { navigator.clipboard.writeText(statusUrl); setCopied(true); setTimeout(() => setCopied(false), 2000); }}>{copied ? '✓ Copied' : '📋 Copy'}</button>
                  <a href={statusUrl} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm">↗ View</a>
                </div>
              )}
            </div>
          </Section>

          {/* Notifications */}
          <Section title="Notifications">
            <Row label="Monitor down alerts"    desc="Email when any monitor goes down or recovers"              value={notifs.monitor_alerts}  onChange={v => toggleNotif('monitor_alerts', v)} />
            <Row label="Log alert rules"         desc="Email when a Stream alert rule fires"                      value={notifs.log_alert_rules} onChange={v => toggleNotif('log_alert_rules', v)} />
            <Row label="Relay delivery failures" desc="Email when webhook delivery fails all 3 retry attempts"   value={notifs.relay_failures}  onChange={v => toggleNotif('relay_failures', v)} />
            <Row label="Weekly summary"          desc="Every Monday 9am — uptime %, errors, incidents, delivery" value={notifs.weekly_summary}  onChange={v => toggleNotif('weekly_summary', v)} />
          </Section>

          {/* Alert channels */}
          <Section title="Alert channels" action={<span className="card-meta">in addition to email</span>}>
            <div className="field">
              <label className="label">Slack incoming webhook <span style={{ textTransform: 'none', fontWeight: 400, color: 'var(--muted)', fontSize: 10, marginLeft: 6 }}>Slack → Apps → Incoming Webhooks</span></label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input className="input" placeholder="https://hooks.slack.com/services/T.../B.../..." value={notifs.slack_webhook_url} onChange={e => setNotifs(p => ({ ...p, slack_webhook_url: e.target.value }))} />
                <button className="btn btn-primary btn-sm" onClick={() => saveNotifs.mutate(notifs)}>Save</button>
              </div>
            </div>
            <div className="field" style={{ marginBottom: 0 }}>
              <label className="label">Discord webhook <span style={{ textTransform: 'none', fontWeight: 400, color: 'var(--muted)', fontSize: 10, marginLeft: 6 }}>Discord channel → Edit → Integrations → Webhooks</span></label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input className="input" placeholder="https://discord.com/api/webhooks/..." value={notifs.discord_webhook_url} onChange={e => setNotifs(p => ({ ...p, discord_webhook_url: e.target.value }))} />
                <button className="btn btn-primary btn-sm" onClick={() => saveNotifs.mutate(notifs)}>Save</button>
              </div>
            </div>
          </Section>

          {/* Danger */}
          <div className="card" style={{ borderColor: 'rgba(244,63,94,.15)' }}>
            <div className="card-head" style={{ borderColor: 'rgba(244,63,94,.15)', background: 'rgba(244,63,94,.03)' }}>
              <span className="card-title" style={{ color: 'var(--red)' }}>Danger zone</span>
            </div>
            <div style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 3 }}>Delete account</div>
                <div style={{ fontSize: 11, fontFamily: 'DM Mono', color: 'var(--muted)' }}>Permanently delete your account and all data. This cannot be undone.</div>
              </div>
              <button className="btn btn-danger" onClick={() => alert('Email support@vigil.dev to delete your account.')}>Delete account</button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}