export default function HthBar({ label, andreVal, camiVal }) {
  const total = andreVal + camiVal || 1
  const andrePct = Math.round((andreVal / total) * 100)
  const camiPct = 100 - andrePct

  return (
    <div className="card-sm" style={{ background: 'var(--surface2)', border: 'none' }}>
      {label && <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>{label}</div>}
      <div className="hth-track">
        <div className="hth-fill-andre" style={{ width: `${andrePct}%` }} />
        <div className="hth-fill-cami"  style={{ width: `${camiPct}%` }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 500 }}>
        <span style={{ color: 'var(--andre)' }}>Andre {andreVal}</span>
        <span style={{ color: 'var(--cami)' }}>{camiVal} Cami</span>
      </div>
    </div>
  )
}
