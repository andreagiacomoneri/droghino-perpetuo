import { useState, useRef } from 'react'
import HthBar from '../shared/HthBar.jsx'

const DRIFT_W = 310, DRIFT_H = 130, PL = 36, PR = 12, PT = 20, PB = 20

export default function Stats({ allData }) {
  const [tab, setTab] = useState('game')
  const { stats, loading } = allData

  if (loading) return <div style={{ color: 'var(--text-dim)', textAlign: 'center', marginTop: 80 }}>Loading…</div>
  if (!stats) return (
    <div className="scrollable fade-in" style={{ height: '100%', padding: '20px 16px' }}>
      <h1 style={{ fontFamily: 'Archivo Black, sans-serif', fontSize: 22, letterSpacing: -0.5, marginBottom: 16 }}>Stats</h1>
      <div style={{ color: 'var(--text-dim)', fontSize: 14, textAlign: 'center', marginTop: 60 }}>Play some matches first.</div>
    </div>
  )

  return (
    <div className="scrollable fade-in" style={{ height: '100%', padding: '20px 16px' }}>
      <h1 style={{ fontFamily: 'Archivo Black, sans-serif', fontSize: 22, letterSpacing: -0.5, marginBottom: 16 }}>Stats</h1>

      <div style={{ display: 'flex', background: 'var(--surface)', borderRadius: 'var(--radius-sm)', border: '0.5px solid var(--border)', padding: 3, gap: 2, marginBottom: 16 }}>
        {[['game', 'Game', null], ['andre', 'Andre', 'andre'], ['cami', 'Cami', 'cami']].map(([id, label, color]) => (
          <button key={id} onClick={() => setTab(id)} style={{
            flex: 1, textAlign: 'center', padding: '8px 4px', fontSize: 12, fontWeight: 500,
            borderRadius: 6, cursor: 'pointer', border: 'none', fontFamily: 'Archivo, sans-serif',
            background: tab === id ? 'var(--surface2)' : 'none',
            color: tab === id && color ? `var(--${color})` : tab === id ? 'var(--text)' : 'var(--text-muted)',
            transition: 'all 0.15s',
          }}>{label}</button>
        ))}
      </div>

      {tab === 'game'  && <GameStats stats={stats} allData={allData} />}
      {tab === 'andre' && <PlayerStats stats={stats.players.andre} player="andre" />}
      {tab === 'cami'  && <PlayerStats stats={stats.players.cami}  player="cami"  />}
    </div>
  )
}

function GameStats({ stats, allData }) {
  const [flipped, setFlipped] = useState(false)
  const { completedSessions, getDriftData, getDriftBySession, getMatchesForSession } = allData
  const [driftView, setDriftView] = useState('overall')
  const [driftPillOn, setDriftPillOn] = useState(true)
  const [driftTooltip, setDriftTooltip] = useState(null)
  const driftAreaRef = useRef()

  const isOverall = driftView === 'overall'

  function getDrift() {
    if (isOverall) {
      if (driftPillOn) return { pts: getDriftData(null), labels: null }
      const d = getDriftBySession(); return { pts: d.pts, labels: d.labels }
    } else {
      const pts = getDriftData(driftView)
      const labels = ['Start', ...pts.slice(1).map((_, i) => `#${i + 1}`)]
      return { pts, labels }
    }
  }

  const driftData = getDrift()
  const driftPts = driftData.pts
  const driftN = driftPts.length
  const absMax = Math.max(...driftPts.map(Math.abs), 10)

  function niceStep(max) {
    const raw = max / 3
    const mag = Math.pow(10, Math.floor(Math.log10(raw || 1)))
    const norm = raw / mag
    return (norm < 2 ? 2 : norm < 5 ? 5 : 10) * mag
  }

  const step = niceStep(absMax)
  const paddedMax = Math.ceil(absMax / step) * step
  const cy = v => PT + (1 - (v + paddedMax) / (2 * paddedMax)) * (DRIFT_H - PT - PB)
  const cx = i => PL + (i / (driftN - 1 || 1)) * (DRIFT_W - PL - PR)
  const zero = cy(0)

  function buildDriftSVG() {
    let out = ''
    for (let v = -paddedMax; v <= paddedMax; v += step) {
      const y = cy(v)
      const isZ = v === 0
      out += `<line x1="${PL}" y1="${y}" x2="${DRIFT_W - PR}" y2="${y}" stroke="${isZ ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.05)'}" stroke-width="${isZ ? 1 : 0.5}"/>`
      if (v !== 0) out += `<text x="${PL - 5}" y="${y + 3.5}" text-anchor="end" font-size="9" fill="#5F5E5A">${Math.abs(v)}</text>`
    }
    out += `<text x="${PL - 5}" y="${PT - 5}" text-anchor="end" font-size="9" font-weight="500" fill="#EF9F27">Cami</text>`
    out += `<text x="${PL - 5}" y="${DRIFT_H - PB + 13}" text-anchor="end" font-size="9" font-weight="500" fill="#378ADD">Andre</text>`
    out += `<text x="${PL - 5}" y="${zero + 3.5}" text-anchor="end" font-size="9" fill="rgba(255,255,255,0.25)">0</text>`

    for (let i = 0; i < driftN - 1; i++) {
      const x1 = cx(i), y1 = cy(driftPts[i]), x2 = cx(i + 1), y2 = cy(driftPts[i + 1])
      const c1 = driftPts[i] > 0 ? '#EF9F27' : driftPts[i] < 0 ? '#378ADD' : 'rgba(255,255,255,0.3)'
      const c2 = driftPts[i + 1] > 0 ? '#EF9F27' : driftPts[i + 1] < 0 ? '#378ADD' : 'rgba(255,255,255,0.3)'
      if (c1 === c2) {
        out += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${c1}" stroke-width="2" stroke-linecap="round"/>`
      } else {
        const t = (0 - driftPts[i]) / (driftPts[i + 1] - driftPts[i])
        const mx = x1 + t * (x2 - x1)
        out += `<line x1="${x1}" y1="${y1}" x2="${mx}" y2="${zero}" stroke="${c1}" stroke-width="2" stroke-linecap="round"/>`
        out += `<line x1="${mx}" y1="${zero}" x2="${x2}" y2="${y2}" stroke="${c2}" stroke-width="2" stroke-linecap="round"/>`
      }
    }

    if (driftData.labels) {
      const labelStep = driftN <= 6 ? 1 : Math.ceil(driftN / 5)
      driftData.labels.forEach((l, i) => {
        if ((i % labelStep === 0 || i === driftN - 1) && l)
          out += `<text x="${cx(i)}" y="${DRIFT_H - 4}" text-anchor="middle" font-size="9" fill="#5F5E5A">${l}</text>`
      })
    }

    const endCol = driftPts[driftN - 1] > 0 ? '#EF9F27' : driftPts[driftN - 1] < 0 ? '#378ADD' : 'rgba(255,255,255,0.3)'
    out += `<circle cx="${cx(driftN - 1)}" cy="${cy(driftPts[driftN - 1])}" r="3" fill="${endCol}"/>`
    return out
  }

  function handleDriftMove(e) {
    const rect = driftAreaRef.current.getBoundingClientRect()
    const xRel = e.clientX - rect.left
    const scale = rect.width / DRIFT_W
    const cl = PL * scale, cr = (DRIFT_W - PR) * scale
    if (xRel < cl || xRel > cr) { setDriftTooltip(null); return }
    const frac = (xRel - cl) / (cr - cl)
    const i = Math.min(driftN - 1, Math.max(0, Math.round(frac * (driftN - 1))))
    const val = driftPts[i]
    const col = val > 0 ? '#EF9F27' : val < 0 ? '#378ADD' : 'rgba(255,255,255,0.5)'
    const who = val > 0 ? `Cami +${val}` : val < 0 ? `Andre +${Math.abs(val)}` : 'Even'
    setDriftTooltip({ text: who, col, x: e.clientX - rect.left, y: e.clientY - rect.top })
  }

  function onDriftView(e) {
    const v = e.target.value
    setDriftView(v)
    if (v !== 'overall') setDriftPillOn(true)
    setDriftTooltip(null)
  }

  // Donut math helper
  function donutArcs(vals, circum) {
    const total = vals.reduce((a, b) => a + b, 0) || 1
    return vals.map(v => Math.round((v / total) * circum))
  }
  const circum = Math.round(2 * Math.PI * 68)
  const matchArcs = donutArcs([stats.matchWins.andre, stats.matchWins.draws, stats.matchWins.cami], circum)
  const sessionArcs = donutArcs([stats.sessionWins.andre, stats.sessionWins.draws, stats.sessionWins.cami], circum)

  function donutCircle(arc, offset, color) {
    return `<circle cx="90" cy="90" r="68" fill="none" stroke="${color}" stroke-width="22" stroke-dasharray="${arc} ${circum}" stroke-dashoffset="${-offset}" stroke-linecap="butt" transform="rotate(-90 90 90)"/>`
  }

  function buildDonut(arcs) {
    return donutCircle(arcs[0], 0, '#378ADD') +
      donutCircle(arcs[1], arcs[0], '#5F5E5A') +
      donutCircle(arcs[2], arcs[0] + arcs[1], '#EF9F27')
  }

  function pct(v, total) { return total ? Math.round((v / total) * 100) : 0 }
  const mTotal = stats.matchWins.andre + stats.matchWins.cami + stats.matchWins.draws
  const sTotal = stats.sessionWins.andre + stats.sessionWins.cami + stats.sessionWins.draws

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Flippable donut */}
      <div style={{ perspective: 800, cursor: 'pointer' }} onClick={() => setFlipped(f => !f)}>
        <div style={{ position: 'relative', transformStyle: 'preserve-3d', transition: 'transform 0.5s cubic-bezier(0.4,0,0.2,1)', transform: flipped ? 'rotateY(180deg)' : 'none' }}>

          {/* Front — matches */}
          <div style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', background: 'var(--surface)', border: '0.5px solid var(--border)', borderRadius: 'var(--radius)', padding: '20px 16px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
            <div style={{ position: 'relative', width: 180, height: 180 }}>
              <svg viewBox="0 0 180 180" style={{ width: '100%', height: '100%' }} aria-label="Match wins donut">
                <circle cx="90" cy="90" r="68" fill="none" stroke="var(--surface2)" strokeWidth="22"/>
                <g dangerouslySetInnerHTML={{ __html: buildDonut(matchArcs) }} />
              </svg>
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', textAlign: 'center' }}>
                <div style={{ fontFamily: 'Archivo Black, sans-serif', fontSize: 38, lineHeight: 1, color: 'var(--text)' }}>{stats.totalMatches}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.8px' }}>matches</div>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 20, width: '100%' }}>
              {[['#378ADD', stats.matchWins.andre, pct(stats.matchWins.andre, mTotal), 'Andre'],
                ['#5F5E5A', stats.matchWins.draws, pct(stats.matchWins.draws, mTotal), 'Draws'],
                ['#EF9F27', stats.matchWins.cami, pct(stats.matchWins.cami, mTotal), 'Cami']].map(([col, val, p, name]) => (
                <div key={name} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                  <div style={{ fontFamily: 'Archivo Black, sans-serif', fontSize: 20, lineHeight: 1, color: col }}>{val}</div>
                  <div style={{ fontSize: 11, marginTop: 1, color: col }}>{p}%</div>
                  <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 2 }}>{name}</div>
                </div>
              ))}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: 4, alignSelf: 'flex-end' }}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.2"><path d="M2 6a4 4 0 1 1 4 4" strokeLinecap="round"/><path d="M2 4v2h2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              tap to see sessions
            </div>
          </div>

          {/* Back — sessions */}
          <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', transform: 'rotateY(180deg)', background: 'var(--surface)', border: '0.5px solid var(--border)', borderRadius: 'var(--radius)', padding: '20px 16px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
            <div style={{ position: 'relative', width: 180, height: 180 }}>
              <svg viewBox="0 0 180 180" style={{ width: '100%', height: '100%' }} aria-label="Session wins donut">
                <circle cx="90" cy="90" r="68" fill="none" stroke="var(--surface2)" strokeWidth="22"/>
                <g dangerouslySetInnerHTML={{ __html: buildDonut(sessionArcs) }} />
              </svg>
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', textAlign: 'center' }}>
                <div style={{ fontFamily: 'Archivo Black, sans-serif', fontSize: 38, lineHeight: 1, color: 'var(--text)' }}>{stats.totalSessions}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.8px' }}>sessions</div>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 20, width: '100%' }}>
              {[['#378ADD', stats.sessionWins.andre, pct(stats.sessionWins.andre, sTotal), 'Andre'],
                ['#5F5E5A', stats.sessionWins.draws, pct(stats.sessionWins.draws, sTotal), 'Draws'],
                ['#EF9F27', stats.sessionWins.cami, pct(stats.sessionWins.cami, sTotal), 'Cami']].map(([col, val, p, name]) => (
                <div key={name} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                  <div style={{ fontFamily: 'Archivo Black, sans-serif', fontSize: 20, lineHeight: 1, color: col }}>{val}</div>
                  <div style={{ fontSize: 11, marginTop: 1, color: col }}>{p}%</div>
                  <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 2 }}>{name}</div>
                </div>
              ))}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: 4, alignSelf: 'flex-end' }}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.2"><path d="M10 6a4 4 0 1 1-4 4" strokeLinecap="round"/><path d="M10 4v2H8" strokeLinecap="round" strokeLinejoin="round"/></svg>
              tap to see matches
            </div>
          </div>
        </div>
      </div>

      {/* The Drift */}
      <SectionTitle>The drift</SectionTitle>
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <select value={driftView} onChange={onDriftView} style={{ fontSize: 12, background: 'var(--surface2)', border: '0.5px solid var(--border2)', borderRadius: 6, color: 'var(--text)', fontFamily: 'Archivo, sans-serif', padding: '6px 28px 6px 10px', appearance: 'none', backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%23888780' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center' }}>
          <option value="overall">Overall</option>
          {completedSessions.map(s => (
            <option key={s.id} value={s.id}>
              {new Date(s.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} — {allData.getMatchesForSession(s.id).length} matches
            </option>
          ))}
        </select>

        <div
          onClick={() => { if (!isOverall) return; setDriftPillOn(p => !p); setDriftTooltip(null) }}
          style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: isOverall ? 'pointer' : 'default', userSelect: 'none', opacity: isOverall ? 1 : 0.35 }}
        >
          <div style={{ width: 40, height: 24, borderRadius: 12, background: driftPillOn ? 'var(--andre)' : 'var(--surface2)', border: `0.5px solid ${driftPillOn ? 'var(--andre)' : 'var(--border2)'}`, position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
            <div style={{ position: 'absolute', top: 4, left: driftPillOn ? 20 : 4, width: 16, height: 16, borderRadius: '50%', background: driftPillOn ? 'white' : '#888780', transition: 'left 0.2s' }} />
          </div>
          <span style={{ fontSize: 13, color: 'var(--text)' }}>{driftPillOn ? 'By match' : 'By session'}</span>
        </div>

        <div ref={driftAreaRef} style={{ position: 'relative', height: DRIFT_H }} onMouseMove={handleDriftMove} onMouseLeave={() => setDriftTooltip(null)}>
          <svg viewBox={`0 0 ${DRIFT_W} ${DRIFT_H}`} style={{ width: '100%', height: '100%', overflow: 'visible' }}
            dangerouslySetInnerHTML={{ __html: buildDriftSVG() }} />
          {driftTooltip && (
            <div style={{ position: 'absolute', left: driftTooltip.x + 80 > (driftAreaRef.current?.offsetWidth || 300) ? driftTooltip.x - 78 : driftTooltip.x + 10, top: Math.max(0, driftTooltip.y - 28), background: 'var(--surface2)', border: '0.5px solid var(--border2)', borderRadius: 6, padding: '6px 10px', fontSize: 11, pointerEvents: 'none', whiteSpace: 'nowrap' }}>
              <span style={{ color: driftTooltip.col, fontWeight: 500 }}>{driftTooltip.text}</span>
            </div>
          )}
        </div>
      </div>

      {/* Call rate */}
      <SectionTitle>Call rate</SectionTitle>
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, fontWeight: 500 }}>
          <span style={{ color: 'var(--andre)' }}>Andre</span>
          <span style={{ fontSize: 14, color: 'var(--text)' }}>{stats.callRateAndre}%</span>
          <span style={{ color: 'var(--cami)' }}>Cami</span>
        </div>
        <div style={{ height: 6, background: 'var(--surface2)', borderRadius: 3, position: 'relative', margin: '4px 0' }}>
          <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${stats.callRateAndre}%`, background: 'var(--andre)', borderRadius: '3px 0 0 3px' }} />
          <div style={{ position: 'absolute', right: 0, top: 0, height: '100%', width: `${stats.callRateCami}%`, background: 'var(--cami)', borderRadius: '0 3px 3px 0' }} />
          <div style={{ position: 'absolute', top: '50%', left: `${stats.callRateAndre}%`, transform: 'translate(-50%,-50%)', width: 14, height: 14, borderRadius: '50%', background: 'var(--text)', border: '2px solid var(--bg)' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-dim)' }}>
          <span>{stats.andreTotalCalls} calls</span>
          <span>{stats.camiTotalCalls} calls</span>
        </div>
      </div>

      {/* Records */}
      <SectionTitle>Records</SectionTitle>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>

        <div className="card-sm" style={{ aspectRatio: '1/1', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: 500, lineHeight: 1.3 }}>Best win<br/>streak</div>
          <div>
            <div style={{ fontFamily: 'Archivo Black, sans-serif', fontSize: 64, lineHeight: 1, letterSpacing: -3, color: `var(--${stats.bestStreak.player})` }}>{stats.bestStreak.value}</div>
            <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>matches in a row</div>
            {stats.bestStreak.sessionDate && <div style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 2 }}>{stats.bestStreak.sessionDate}</div>}
          </div>
        </div>

        <div className="card-sm" style={{ aspectRatio: '1/1', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: 500, lineHeight: 1.3 }}>Most brutal<br/>loss</div>
          <div>
            <div style={{ fontFamily: 'Archivo Black, sans-serif', fontSize: 64, lineHeight: 1, letterSpacing: -3, color: `var(--${stats.worstLoss.player})` }}>{stats.worstLoss.value}</div>
            <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>pts in one match</div>
            {stats.worstLoss.sessionDate && <div style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 2 }}>Match #{stats.worstLoss.matchNum} · {stats.worstLoss.sessionDate}</div>}
          </div>
        </div>

        <div className="card-sm" style={{ aspectRatio: '1/1', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: 500, lineHeight: 1.3 }}>Longest<br/>session</div>
          <div>
            <div style={{ fontFamily: 'Archivo Black, sans-serif', fontSize: 64, lineHeight: 1, letterSpacing: -3, color: 'var(--text)' }}>{stats.longestSession.value}</div>
            <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>matches played</div>
            {stats.longestSession.sessionDate && <div style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 2 }}>{stats.longestSession.sessionDate}</div>}
          </div>
        </div>

        <div className="card-sm" style={{ aspectRatio: '1/1', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: 500, lineHeight: 1.3 }}>Biggest<br/>comeback</div>
          <div>
            <div style={{ fontFamily: 'Archivo Black, sans-serif', fontSize: 64, lineHeight: 1, letterSpacing: -3, color: stats.biggestComeback.player ? `var(--${stats.biggestComeback.player})` : 'var(--text)' }}>{stats.biggestComeback.value}</div>
            <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>pts gap closed</div>
            {stats.biggestComeback.sessionDate && <div style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 2 }}>{stats.biggestComeback.sessionDate}</div>}
          </div>
        </div>

      </div>
    </div>
  )
}

function PlayerStats({ stats, player }) {
  const color = `var(--${player})`
  const name = player === 'andre' ? 'Andre' : 'Cami'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <SectionTitle>Calls</SectionTitle>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <StatCard label="Total calls" value={stats.totalCalls} valueColor={color} />
        <StatCard label="Call win rate" value={`${stats.callWinRate}%`} valueColor={stats.callWinRate >= 50 ? 'var(--green)' : 'var(--red)'} sub={`${stats.callWinCount} of ${stats.totalCalls} calls won`} tooltip={`Of all the times ${name} knocked, how often they had the lowest score at the table.`} />
        <StatCard label="Call rate" value={`${stats.callRate}%`} valueColor={color} sub="of all matches" tooltip={`Out of all matches played, how often ${name} was the one who knocked to end the match.`} />
        <StatCard label="Penalty rate" value={`${stats.penaltyRate}%`} valueColor={stats.penaltyRate > 50 ? 'var(--red)' : 'var(--text)'} sub={`${stats.penaltyCount} calls backfired`} tooltip={`Of all ${name}'s calls, how often they knocked but didn't have the lowest score — earning the +10 penalty.`} />
      </div>
      <SectionTitle>Streaks</SectionTitle>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <StatCard label="Call win streak (best)" value={stats.longestCallStreak} valueColor={color} />
        <StatCard label="Session win streak (best)" value={stats.longestSessionStreak} valueColor={color} />
      </div>
      <SectionTitle>Score</SectionTitle>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <StatCard label="Avg score / match" value={stats.avgPerMatch} />
        <StatCard label="Avg score / session" value={stats.avgPerSession} />
        <StatCard label="Best match" value={0} valueColor="var(--green)" sub="called & won" />
        <StatCard label="Worst match" value={stats.worstMatch} valueColor="var(--red)" sub="called & lost" />
      </div>
      <SectionTitle>Sessions</SectionTitle>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <StatCard label="Sessions won" value={stats.sessionWins} valueColor={color} />
        <StatCard label="Win rate" value={`${stats.sessionWinRate}%`} valueColor={stats.sessionWinRate >= 50 ? 'var(--green)' : 'var(--red)'} />
      </div>
    </div>
  )
}

function SectionTitle({ children }) {
  return <div style={{ fontSize: 11, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 500, paddingTop: 4 }}>{children}</div>
}

function StatCard({ label, value, valueColor, sub, tooltip }) {
  const [showTooltip, setShowTooltip] = useState(false)
  return (
    <div className="card-sm" style={{ position: 'relative' }}>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6, lineHeight: 1.3, paddingRight: tooltip ? 18 : 0 }}>{label}</div>
      <div style={{ fontFamily: 'Archivo Black, sans-serif', fontSize: 22, color: valueColor || 'var(--text)' }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 2 }}>{sub}</div>}
      {tooltip && (
        <>
          <button onClick={e => { e.stopPropagation(); setShowTooltip(v => !v) }} style={{ position: 'absolute', top: 10, right: 10, width: 14, height: 14, borderRadius: '50%', border: '0.5px solid var(--border2)', background: 'none', color: 'var(--text-dim)', fontSize: 9, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Archivo, sans-serif', lineHeight: 1 }}>?</button>
          {showTooltip && (
            <div onClick={e => e.stopPropagation()} style={{ position: 'absolute', bottom: 'calc(100% + 6px)', left: 0, right: 0, background: 'var(--surface2)', border: '0.5px solid var(--border2)', borderRadius: 'var(--radius-sm)', padding: '8px 10px', fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.4, zIndex: 20 }}>{tooltip}</div>
          )}
        </>
      )}
    </div>
  )
}
