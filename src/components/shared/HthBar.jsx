export default function HthBar({ label, andreVal, camiVal, drawVal = 0 }) {
  const total = andreVal + camiVal + drawVal || 1
  const andrePct = Math.round((andreVal / total) * 100)
  const camiPct  = Math.round((camiVal  / total) * 100)
  const drawPct  = 100 - andrePct - camiPct

  return (
    <div className="card-sm" style={{ background: 'var(--surface2)', border: 'none' }}>
      {label && (
        <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
          {label}
        </div>
      )}
      <div className="hth-track">
        <div className="hth-fill-andre" style={{ width: `${andrePct}%` }} />
        {drawVal > 0 && (
          <div style={{ width: `${drawPct}%`, height: '100%', background: 'var(--surface)', flexShrink: 0 }} />
        )}
        <div className="hth-fill-cami" style={{ width: `${camiPct}%` }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 500 }}>
        <span style={{ color: 'var(--andre)' }}>Andre {andreVal}</span>
        {drawVal > 0 && (
          <span style={{ color: 'var(--text-dim)' }}>{drawVal} draws</span>
        )}
        <span style={{ color: 'var(--cami)' }}>{camiVal} Cami</span>
      </div>
    </div>
  )
}
