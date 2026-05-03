import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/client';

const ROLE_COLOR = {
  admin:  { bg: 'rgba(249,115,22,.1)',  color: 'var(--accent)' },
  member: { bg: 'rgba(99,102,241,.1)',  color: 'var(--blue2)'  },
  viewer: { bg: 'rgba(113,113,122,.1)', color: 'var(--muted)'  },
};

function InviteModal({ teamId, onClose }) {
  const qc = useQueryClient();
  const [email, setEmail] = useState('');
  const [role,  setRole]  = useState('member');
  const [err,   setErr]   = useState('');

  const invite = useMutation({
    mutationFn: () => api.post(`/teams/${teamId}/invite`, { email, role }),
    onSuccess:  () => {
      qc.invalidateQueries({ queryKey: ['team-members', teamId] });
      onClose();
    },
    onError: (e) => setErr(e.response?.data?.error || 'Failed to invite'),
  });

  return (
    <div className="overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-title">Invite team member</div>
        {err && <div className="err-box">⚠ {err}</div>}
        <div className="field">
          <label className="label">Email address</label>
          <input
            className="input"
            type="email"
            placeholder="colleague@company.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            autoFocus
          />
          <div style={{ fontSize: 10, fontFamily: 'DM Mono', color: 'var(--muted)', marginTop: 5 }}>
            They must already have a VIGIL account.
          </div>
        </div>
        <div className="field">
          <label className="label">Role</label>
          <select className="input" value={role} onChange={e => setRole(e.target.value)}>
            <option value="admin">Admin — full access, can invite members</option>
            <option value="member">Member — can create monitors, logs, relay</option>
            <option value="viewer">Viewer — read only, can't create anything</option>
          </select>
        </div>
        <div style={{ background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: 6, padding: '9px 12px', marginBottom: 16, fontFamily: 'DM Mono', fontSize: 11, color: 'var(--muted)' }}>
          {role === 'admin'  && '⚠ Admins can invite/remove members and delete resources.'}
          {role === 'member' && '✓ Members can use all platform features but cannot manage the team.'}
          {role === 'viewer' && '✓ Viewers can see everything but cannot create or delete anything.'}
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-ghost" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
          <button
            className="btn btn-primary"
            style={{ flex: 1 }}
            onClick={() => invite.mutate()}
            disabled={!email || invite.isPending}
          >
            {invite.isPending ? 'Inviting…' : 'Send invite'}
          </button>
        </div>
      </div>
    </div>
  );
}

function CreateTeamModal({ onClose }) {
  const qc = useQueryClient();
  const [name, setName] = useState('');
  const [err,  setErr]  = useState('');

  const create = useMutation({
    mutationFn: () => api.post('/teams', { name }),
    onSuccess:  () => { qc.invalidateQueries({ queryKey: ['teams'] }); onClose(); },
    onError:    (e) => setErr(e.response?.data?.error || 'Failed'),
  });

  return (
    <div className="overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-title">Create new team</div>
        {err && <div className="err-box">⚠ {err}</div>}
        <div className="field">
          <label className="label">Team name</label>
          <input
            className="input"
            placeholder="Acme Engineering"
            value={name}
            onChange={e => setName(e.target.value)}
            autoFocus
          />
        </div>
        <div style={{ fontSize: 11, fontFamily: 'DM Mono', color: 'var(--muted)', marginBottom: 16, lineHeight: 1.7 }}>
          You'll be the admin. Invite teammates after creation.
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-ghost" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
          <button
            className="btn btn-primary"
            style={{ flex: 1 }}
            onClick={() => create.mutate()}
            disabled={!name || create.isPending}
          >
            {create.isPending ? 'Creating…' : 'Create team'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Team() {
  const qc = useQueryClient();
  const [activeTeamId, setActiveTeamId] = useState(null);
  const [showInvite,   setShowInvite]   = useState(false);
  const [showCreate,   setShowCreate]   = useState(false);

  const { data: teams = [], isLoading } = useQuery({
    queryKey: ['teams'],
    queryFn:  () => api.get('/teams').then(r => r.data.teams),
  });

  const activeTeam = teams.find(t => t.id === activeTeamId) || teams[0] || null;

  const { data: members = [] } = useQuery({
    queryKey: ['team-members', activeTeam?.id],
    queryFn:  () => api.get(`/teams/${activeTeam.id}/members`).then(r => r.data.members),
    enabled:  !!activeTeam,
  });

  const updateRole = useMutation({
    mutationFn: ({ userId, role }) =>
      api.patch(`/teams/${activeTeam.id}/members/${userId}`, { role }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['team-members', activeTeam.id] }),
  });

  const removeMember = useMutation({
    mutationFn: (userId) =>
      api.delete(`/teams/${activeTeam.id}/members/${userId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['team-members', activeTeam.id] }),
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Topbar */}
      <div className="topbar">
        <div>
          <div className="topbar-title">Teams</div>
          <div className="topbar-sub">Manage workspaces and team member access</div>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setShowCreate(true)}>
          + New team
        </button>
      </div>

      <div className="page-scroll">
        {isLoading ? (
          <div style={{ padding: 48, textAlign: 'center', color: 'var(--muted)', fontFamily: 'DM Mono', fontSize: 12 }}>
            Loading teams…
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 16 }}>

            {/* Team list */}
            <div className="card" style={{ alignSelf: 'start' }}>
              <div className="card-head"><span className="card-title">Your teams</span></div>
              {teams.map(t => (
                <div
                  key={t.id}
                  onClick={() => setActiveTeamId(t.id)}
                  style={{
                    padding: '12px 14px',
                    borderBottom: '1px solid var(--border)',
                    cursor: 'pointer',
                    background: activeTeam?.id === t.id ? 'var(--bg4)' : '',
                    borderLeft: activeTeam?.id === t.id ? '2px solid var(--accent)' : '2px solid transparent',
                    transition: 'all .1s',
                  }}
                >
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 3 }}>{t.name}</div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={{ fontSize: 10, fontFamily: 'DM Mono', color: 'var(--muted)' }}>
                      {t.member_count} member{t.member_count !== '1' ? 's' : ''}
                    </span>
                    <span style={{ fontSize: 9, fontWeight: 600, padding: '1px 6px', borderRadius: 3, ...ROLE_COLOR[t.role] }}>
                      {t.role.toUpperCase()}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Team detail */}
            {activeTeam && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

                {/* Team info */}
                <div className="card">
                  <div style={{ padding: '16px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.5px', marginBottom: 5 }}>
                        {activeTeam.name}
                      </div>
                      <div style={{ display: 'flex', gap: 12 }}>
                        <span style={{ fontSize: 11, fontFamily: 'DM Mono', color: 'var(--muted)' }}>
                          slug: {activeTeam.slug}
                        </span>
                        <span style={{ fontSize: 11, fontFamily: 'DM Mono', color: 'var(--muted)' }}>
                          plan: <span style={{ color: 'var(--accent)' }}>{activeTeam.plan}</span>
                        </span>
                        <span style={{ fontSize: 11, fontFamily: 'DM Mono', color: 'var(--muted)' }}>
                          your role: <span style={{ ...ROLE_COLOR[activeTeam.role], fontWeight: 700 }}>{activeTeam.role}</span>
                        </span>
                      </div>
                    </div>
                    {activeTeam.role === 'admin' && (
                      <button className="btn btn-primary btn-sm" onClick={() => setShowInvite(true)}>
                        + Invite member
                      </button>
                    )}
                  </div>
                </div>

                {/* Members table */}
                <div className="card">
                  <div className="card-head">
                    <span className="card-title">Members</span>
                    <span className="card-meta">{members.length} total</span>
                  </div>
                  {members.length === 0 ? (
                    <div className="empty">
                      <div className="empty-h">No members yet</div>
                      <div className="empty-p">Invite your team with the button above.</div>
                    </div>
                  ) : (
                    <>
                      <div className="thead" style={{ gridTemplateColumns: '2fr 1fr 100px 120px 80px' }}>
                        <span>Member</span><span>Email</span><span>Role</span><span>Joined</span><span></span>
                      </div>
                      {members.map(m => (
                        <div key={m.id} className="trow" style={{ gridTemplateColumns: '2fr 1fr 100px 120px 80px' }}>
                          <div className="tname">{m.name}</div>
                          <div className="tsub" style={{ fontFamily: 'DM Mono', fontSize: 11 }}>{m.email}</div>

                          {/* Role selector — admins can change others' roles */}
                          {activeTeam.role === 'admin' ? (
                            <select
                              className="input"
                              style={{ padding: '3px 6px', fontSize: 11, height: 28 }}
                              value={m.role}
                              onChange={e => updateRole.mutate({ userId: m.id, role: e.target.value })}
                            >
                              <option value="admin">Admin</option>
                              <option value="member">Member</option>
                              <option value="viewer">Viewer</option>
                            </select>
                          ) : (
                            <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 3, ...ROLE_COLOR[m.role] }}>
                              {m.role.toUpperCase()}
                            </span>
                          )}

                          <div style={{ fontFamily: 'DM Mono', fontSize: 11, color: 'var(--muted)' }}>
                            {new Date(m.joined_at).toLocaleDateString()}
                          </div>

                          {activeTeam.role === 'admin' && m.id !== activeTeam.owner_id && (
                            <button
                              className="btn btn-danger btn-sm"
                              onClick={() => {
                                if (confirm(`Remove ${m.name} from the team?`)) {
                                  removeMember.mutate(m.id);
                                }
                              }}
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      ))}
                    </>
                  )}
                </div>

                {/* Role guide */}
                <div className="card">
                  <div className="card-head"><span className="card-title">Role permissions</span></div>
                  <div style={{ padding: '14px 18px' }}>
                    {[
                      ['Admin',  'var(--accent)', 'Full access. Can invite/remove members, delete resources, change roles.'],
                      ['Member', 'var(--blue2)',  'Can create monitors, send logs, manage relay channels. Cannot manage team.'],
                      ['Viewer', 'var(--muted)',  'Read-only. Can view all data but cannot create, edit, or delete anything.'],
                    ].map(([role, color, desc]) => (
                      <div key={role} style={{ display: 'flex', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color, width: 60, flexShrink: 0, fontFamily: 'DM Mono' }}>
                          {role.toUpperCase()}
                        </span>
                        <span style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.6 }}>{desc}</span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            )}
          </div>
        )}
      </div>

      {showInvite && <InviteModal teamId={activeTeam.id} onClose={() => setShowInvite(false)} />}
      {showCreate && <CreateTeamModal onClose={() => setShowCreate(false)} />}
    </div>
  );
}