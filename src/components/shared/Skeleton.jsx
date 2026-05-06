// Reusable skeleton loading components
// Usage: <SkeletonTable rows={3} cols={4} />
//        <SkeletonStats count={4} />
//        <SkeletonCard />

export function SkeletonStats({ count = 4 }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${count}, 1fr)`, gap: 12, marginBottom: 20 }}>
      {Array(count).fill(0).map((_, i) => (
        <div key={i} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--rl)', padding: '16px 18px' }}>
          <div className="skeleton skeleton-text" style={{ width: '60%', marginBottom: 10 }} />
          <div className="skeleton skeleton-title" style={{ width: '40%', marginBottom: 8 }} />
          <div className="skeleton skeleton-text" style={{ width: '80%' }} />
        </div>
      ))}
    </div>
  );
}

export function SkeletonTable({ rows = 4, cols = 4 }) {
  const widths = ['40%', '15%', '15%', '20%', '10%'];
  return (
    <div className="card" style={{ marginBottom: 16 }}>
      <div style={{ padding: '11px 18px', background: 'var(--bg3)', borderBottom: '1px solid var(--border)', display: 'flex', gap: 12 }}>
        <div className="skeleton skeleton-text" style={{ width: 80 }} />
        <div className="skeleton skeleton-text" style={{ width: 50, marginLeft: 'auto' }} />
      </div>
      {Array(rows).fill(0).map((_, i) => (
        <div key={i} style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 16, alignItems: 'center' }}>
          {Array(cols).fill(0).map((_, j) => (
            <div key={j} className="skeleton skeleton-text" style={{ flex: j === 0 ? 2 : 1, height: j === 0 ? 18 : 14 }} />
          ))}
        </div>
      ))}
    </div>
  );
}

export function SkeletonCard({ lines = 3 }) {
  return (
    <div className="card" style={{ padding: '16px 18px', marginBottom: 12 }}>
      <div className="skeleton skeleton-title" style={{ width: '50%', marginBottom: 12 }} />
      {Array(lines).fill(0).map((_, i) => (
        <div key={i} className="skeleton skeleton-text" style={{ width: `${85 - i * 15}%`, marginBottom: 8 }} />
      ))}
    </div>
  );
}

export function SkeletonPage() {
  return (
    <div style={{ padding: '22px 24px' }}>
      <SkeletonStats count={4} />
      <SkeletonTable rows={3} cols={5} />
      <SkeletonTable rows={2} cols={4} />
    </div>
  );
}