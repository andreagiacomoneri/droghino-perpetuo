import { useState } from 'react'
import HthBar from '../shared/HthBar.jsx'

export default function History({ allData }) {
  const { completedSessions, getMatchesForSession, getWarScoreAtSessionStart } = allData
  const [expanded, setExpanded] = useState(null)

  const sorted = [...completedSessions].reverse()

  return (
    <div className="scrollable fade-in" style={{ height: '100%', padding: '20px 16px' }}>
      <h1 style={{ fontFamily: 'Archivo Black, sans-serif', fontSize: 22, letterSpacing: -0.5, marginBottom: 16 }}>History</h1>

      {sorted.length === 0 && (
        <div style={{ color: 'var(--text-dim)', fontSize: 14, textAlign: 'center', marginTop: 60 }}>No sessions yet.</div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {sorted.map(session => {
          const sm = getMatchesForSession(session.id)
          const andreTotal = sm.reduce((s, m) => s + m.andre_final, 0)
          const camiTotal  = sm.reduce((s, m) => s + m.cami_final, 0)
          function isDraw(m) { return !m.caller?.startsWith('empty_') && m.andre_final === 0 && m.cami_final === 0 }
          function mWinner(m) {
            if (isDraw(m)) return 'draw'
            if (m.caller === 'empty_andre') return 'andre'
            if (m.caller === 'empty_cami') return 'cami'
            if (m.andre_final < m.cami_final) return 'andre'
            if (m.cami_final < m.andre_final) return 'cami'
            return 'draw'
          }
          const matchWins = { andre: sm.filter(m => mWinner(m) === 'andre').length, cami: sm.filter(m => mWinner(m) === 'cami').length, draws: sm.filter(m => mWinner(m) === 'draw').length }
          const warStart   = getWarScoreAtSessionStart(session.id)
          const warEnd     = { andre: warStart.andre + andreTotal, cami: warStart.cami + camiTotal }
          const gapStart   = warStart.cami - warStart.andre // positive = andre ahead
          const gapEnd     = warEnd.cami - warEnd.andre
          const isExpanded = expanded === session.id

          return (
            <div
              key={session.id}
              className="card"
              style={{ cursor: 'pointer', transition: 'border-color 0.15s', borderColor: isExpanded ? 'var(--border2)' : 'var(--border)' }}
              onClick={() => setExpanded(isExpanded ? null : session.id)}
            >
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>
                    {new Date(session.date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3 }}>
                    {sm.length} matches{session.target_score ? ` · target ${session.target_score}` : ''}
                  </div>
                </div>
                <div style={{ fontSize: 12, fontWeight: 500, color: session.winner === 'andre' ? 'var(--andre)' : session.winner === 'cami' ? 'var(--cami)' : 'var(--text-dim)' }}>
                  {session.winner === 'andre' ? 'Andre won' : session.winner === 'cami' ? 'Cami won' : 'Draw'}
                </div>
              </div>

              {/* Session scores */}
              <div style={{ display: 'flex', gap: 10, marginTop: 10, paddingTop: 10, borderTop: '0.5px solid var(--border)' }}>
                <div style={{ flex: 1, textAlign: 'center', fontSize: 12, color: 'var(--text-muted)' }}>
                  <div style={{ fontFamily: 'Archivo Black, sans-serif', fontSize: 18, color: 'var(--andre)' }}>{andreTotal}</div>
                  Andre
                </div>
                <div style={{ flex: 1, textAlign: 'center', fontSize: 12, color: 'var(--text-muted)' }}>
                  <div style={{ fontFamily: 'Archivo Black, sans-serif', fontSize: 18, color: 'var(--cami)' }}>{camiTotal}</div>
                  Cami
                </div>
              </div>

              {/* Expanded */}
              {isExpanded && (
                <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }} onClick={e => e.stopPropagation()}>

                  {/* Match wins */}
                  <HthBar label="Match wins" andreVal={matchWins.andre} camiVal={matchWins.cami} drawVal={matchWins.draws} />

                  {/* War gap */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    {[['Gap at start', gapStart, warStart], ['Gap at end', gapEnd, warEnd]].map(([label, gap, war]) => {
                      const leader = gap > 0 ? 'andre' : gap < 0 ? 'cami' : null
                      const absGap = Math.abs(gap)
                      return (
                        <div key={label} style={{ background: 'var(--surface2)', borderRadius: 'var(--radius-sm)', padding: '10px 12px' }}>
                          <div style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 }}>{label}</div>
                          <div style={{ fontFamily: 'Archivo Black, sans-serif', fontSize: 16, color: leader ? `var(--${leader})` : 'var(--text)' }}>
                            {leader === 'andre' ? '−' : leader === 'cami' ? '+' : ''}{absGap}
                          </div>
                          <div style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 2 }}>
                            {leader ? `${leader === 'andre' ? 'Andre' : 'Cami'} ahead` : 'Tied'}
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {/* Match list */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {sm.map(m => (
                      <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, color: 'var(--text-muted)', padding: '5px 0', borderBottom: '0.5px solid var(--border)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span>#{m.match_number}</span>
                          <span className={`caller-tag ${m.caller}`}>{m.caller === 'andre' ? 'Andre' : 'Cami'}</span>
                        </div>
                        <span style={{ fontSize: 12 }}>
                          Andre{' '}
                          <span style={{ color: m.andre_final === 0 ? 'var(--green)' : m.andre_final > m.andre_raw ? 'var(--red)' : 'var(--text)', fontWeight: 500 }}>
                            {m.andre_final}
                          </span>
                          {' · '}
                          Cami{' '}
                          <span style={{ color: m.cami_final === 0 ? 'var(--green)' : m.cami_final > m.cami_raw ? 'var(--red)' : 'var(--text)', fontWeight: 500 }}>
                            {m.cami_final}
                          </span>
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
