import { useState, useRef } from 'react'

const W = 320, H = 150, PL = 36, PR = 12, PT = 8, PB = 24

export default function CumulativeChart({ allData }) {
  const { sessions, allMatches, getMatchesForSession, getWarScoreAtSessionStart } = allData
  const completedSessions = sessions.filter(s => s.status === 'completed')

  const [view, setView] = useState('overall')
  const [pillOn, setPillOn] = useState(true)
  const [tooltip, setTooltip] = useState(null)
  const areaRef = useRef()

  const isOverall = view === 'overall'

  function onViewChange(e) {
    setView(e.target.value)
    setPillOn(e.target.value === 'overall' ? true : false)
    setTooltip(null)
  }

  function toggleLabel() {
    if (isOverall) return pillOn ? 'By match' : 'By session'
    return pillOn ? 'Zero origin' : 'War origin'
  }

  function getData() {
    if (isOverall) {
      if (pillOn) {
        let andreAcc = 0, camiAcc = 0
        const andre = [0], cami = [0]
        for (const m of allMatches) {
          andreAcc += m.andre_final; camiAcc += m.cami_final
          andre.push(andreAcc); cami.push(camiAcc)
        }
        return { andre, cami, labels: null }
      } else {
        let andreAcc = 0, camiAcc = 0
        const andre = [0], cami = [0]
        const labels = ['Start']
        for (const s of completedSessions) {
          const sm = getMatchesForSession(s.id)
          andreAcc += sm.reduce((a, m) => a + m.andre_final, 0)
          camiAcc  += sm.reduce((a, m) => a + m.cami_final, 0)
          andre.push(andreAcc); cami.push(camiAcc)
          labels.push(new Date(s.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }))
        }
        return { andre, cami, labels }
      }
    } else {
      const sessionIdx = completedSessions.findIndex(s => s.id === view)
      if (sessionIdx < 0) return { andre: [0], cami: [0], labels: ['Start'] }
      const s = completedSessions[sessionIdx]
      const sm = getMatchesForSession(s.id)
      const warStart = getWarScoreAtSessionStart(s.id)
      const offset = pillOn ? { andre: 0, cami: 0 } : warStart
      let aAcc = offset.andre, cAcc = offset.cami
      const andre = [aAcc], cami = [cAcc]
      const labels = ['Start']
      for (const m of sm) {
        aAcc += m.andre_final; cAcc += m.cami_final
        andre.push(aAcc); cami.push(cAcc)
        labels.push(`#${m.match_number}`)
      }
      return { andre, cami, labels }
    }
  }

  const d = getData()
  const n = d.andre.length
  const allVals = [...d.andre, ...d.cami]
  const minV = Math.min(...allVals), maxV = Math.max(...allVals)
  const range = maxV - minV || 1

  const cx = i => PL + (i / (n - 1 || 1)) * (W - PL - PR)
  const cy = v => PT + (1 - (v - minV) / range) * (H - PT - PB)

  function buildPath(arr) {
    return arr.map((v, i) => `${cx(i)},${cy(v)}`).join(' ')
  }

  function getIndexFromMouseX(clientX) {
    const rect = areaRef.current.getBoundingClientRect()
    const xRel = clientX - rect.left
    const scale = rect.width / W
    const chartLeft = PL * scale
    const chartRight = (W - PR) * scale
    if (xRel < chartLeft || xRel > chartRight) return null
    const frac = (xRel - chartLeft) / (chartRight - chartLeft)
    return Math.min(n - 1, Math.max(0, Math.round(frac * (n - 1))))
  }

  function handleMouseMove(e) {
    const i = getIndexFromMouseX(e.clientX)
    if (i === null) { setTooltip(null); return }
    const rect = areaRef.current.getBoundingClientRect()
    setTooltip({
      i,
      andreVal: d.andre[i],
      camiVal: d.cami[i],
      label: d.labels ? d.labels[i] : null,
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    })
  }

  const gridSteps = 4
  const gridLines = Array.from({ length: gridSteps + 1 }, (_, i) => {
    const v = minV + (range * i / gridSteps)
    return { v: Math.round(v), y: cy(v) }
  })

  const xLabelIdxs = n <= 6
    ? Array.from({ length: n }, (_, i) => i)
    : [0, Math.floor(n / 4), Math.floor(n / 2), Math.floor(3 * n / 4), n - 1]

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <select
          value={view}
          onChange={onViewChange}
          style={{
            flex: 1, fontSize: 12, background: 'var(--surface2)', border: '0.5px solid var(--border2)',
            borderRadius: 6, color: 'var(--text)', fontFamily: 'Archivo, sans-serif',
            padding: '6px 28px 6px 10px', appearance: 'none', cursor: 'pointer',
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%23888780' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center',
          }}
        >
          <option value="overall">Overall</option>
          {completedSessions.map(s => (
            <option key={s.id} value={s.id}>
              {new Date(s.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} — {getMatchesForSession(s.id).length} matches
            </option>
          ))}
        </select>
      </div>

      <div
        style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', userSelect: 'none' }}
        onClick={() => { setPillOn(p => !p); setTooltip(null) }}
      >
        <div className={`pill-track${pillOn ? ' on' : ''}`}>
          <div className="pill-thumb" />
        </div>
        <span style={{ fontSize: 13, color: 'var(--text)' }}>{toggleLabel()}</span>
      </div>

      <div
        ref={areaRef}
        style={{ position: 'relative', height: H }}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setTooltip(null)}
      >
        <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: '100%', overflow: 'visible' }}>
          {gridLines.map(({ v, y }) => (
            <g key={v}>
              <line x1={PL} y1={y} x2={W - PR} y2={y} stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />
              <text x={PL - 4} y={y + 3} textAnchor="end" fontSize={10} fill="#5F5E5A">{v}</text>
            </g>
          ))}

          {xLabelIdxs.map(i => d.labels && (
            <text key={i} x={cx(i)} y={H - 4} textAnchor="middle" fontSize={10} fill="#5F5E5A">
              {d.labels[i]}
            </text>
          ))}

          <polyline points={buildPath(d.andre)} fill="none" stroke="#378ADD" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
          <polyline points={buildPath(d.cami)}  fill="none" stroke="#EF9F27" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />

          <circle cx={cx(n - 1)} cy={cy(d.andre[n - 1])} r="3.5" fill="#378ADD" />
          <circle cx={cx(n - 1)} cy={cy(d.cami[n - 1])}  r="3.5" fill="#EF9F27" />

          {tooltip && (
            <line x1={cx(tooltip.i)} y1={PT} x2={cx(tooltip.i)} y2={H - PB}
              stroke="rgba(255,255,255,0.1)" strokeWidth="1" strokeDasharray="3,3" />
          )}
        </svg>

        {tooltip && (
          <div style={{
            position: 'absolute',
            left: tooltip.x + 120 > (areaRef.current?.offsetWidth || 300) ? tooltip.x - 118 : tooltip.x + 12,
            top: Math.max(0, tooltip.y - 30),
            background: 'var(--surface2)', border: '0.5px solid var(--border2)',
            borderRadius: 6, padding: '7px 10px', fontSize: 11, pointerEvents: 'none', whiteSpace: 'nowrap',
          }}>
            {tooltip.label && <div style={{ fontSize: 10, color: 'var(--text-dim)', marginBottom: 3 }}>{tooltip.label}</div>}
            <div style={{ color: '#378ADD', fontWeight: 500 }}>Andre: {tooltip.andreVal}</div>
            <div style={{ color: '#EF9F27', fontWeight: 500 }}>Cami: {tooltip.camiVal}</div>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-muted)' }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#378ADD', flexShrink: 0 }} />Andre
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-muted)' }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#EF9F27', flexShrink: 0 }} />Cami
        </div>
      </div>
    </div>
  )
}
