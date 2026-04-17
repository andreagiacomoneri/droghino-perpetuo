import CumulativeChart from './CumulativeChart.jsx'

export default function Dashboard({ sessionData, allData, onNavigate }) {
  const { activeSession, matches: sessionMatches } = sessionData
  const { warScore, completedSessions, sessionWins, allMatches } = allData

  const gap = Math.abs(warScore.andre - warScore.cami)
  const warLeader = warScore.andre <= warScore.cami ? 'andre' : 'cami'

  const lastSession = completedSessions.length > 0 ? completedSessions[completedSessions.length - 1] : null
  const lastSessionMatches = lastSession ? allData.getMatchesForSession(lastSession.id) : []
  const lastAndre = lastSessionMatches.reduce((s, m) => s + m.andre_final, 0)
  const lastCami  = lastSessionMatches.reduce((s, m) => s + m.cami_final, 0)

  return (
    <div className="scrollable fade-in" style={{ height: '100%', padding: '20px 16px 16px' }}>

      {/* Title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h1 style={{ fontFamily: 'Archivo Black, sans-serif', fontSize: 22, letterSpacing: -0.5 }}>
          Droghino Perpetuo
        </h1>
        <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>All time</span>
      </div>

      {/* War score */}
      <div className="card" style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 }}>
          War score
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--andre)', marginBottom: 4 }}>Andre</div>
            <div style={{ fontFamily: 'Archivo Black, sans-serif', fontSize: 52, lineHeight: 1, letterSpacing: -2, color: 'var(--andre)' }}>
              {warScore.andre}
            </div>
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-dim)', paddingBottom: 8 }}>—</div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--cami)', marginBottom: 4 }}>Cami</div>
            <div style={{ fontFamily: 'Archivo Black, sans-serif', fontSize: 52, lineHeight: 1, letterSpacing: -2, color: 'var(--cami)' }}>
              {warScore.cami}
            </div>
          </div>
        </div>
        <div style={{ marginTop: 14, paddingTop: 14, borderTop: '0.5px solid var(--border)', fontSize: 13, color: 'var(--text-muted)' }}>
          <span style={{ color: warLeader === 'andre' ? 'var(--andre)' : 'var(--cami)', fontWeight: 500 }}>
            {warLeader === 'andre' ? 'Andre' : 'Cami'}
          </span>
          {' '}is winning by {gap} pts
        </div>
      </div>

      {/* Active session banner */}
      {activeSession && (
        <div
          onClick={() => onNavigate('session')}
          style={{
            marginBottom: 12, background: 'rgba(239,159,39,0.1)', border: '0.5px solid rgba(239,159,39,0.3)',
            borderRadius: 'var(--radius-sm)', padding: '12px 16px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="live-dot" />
            <div>
              <div style={{ fontSize: 13, color: 'var(--cami)', fontWeight: 500 }}>Session in progress</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                {sessionMatches.length} {sessionMatches.length === 1 ? 'match' : 'matches'}
                {activeSession.target_score ? ` · target ${activeSession.target_score}` : ''}
              </div>
            </div>
          </div>
          <button style={{
            fontSize: 12, fontWeight: 500, background: 'var(--cami)',
            border: 'none', borderRadius: 6, padding: '6px 12px', cursor: 'pointer', fontFamily: 'Archivo, sans-serif',
            color: '#412402',
          }}>
            Resume
          </button>
        </div>
      )}

      {/* Chart */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
          Cumulative score
        </div>
        <CumulativeChart allData={allData} />
      </div>

      {/* Last session */}
      {lastSession && (
        <>
          <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
            Last session
          </div>
          <div className="card-sm" style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <div style={{ fontSize: 13, fontWeight: 500 }}>
                {new Date(lastSession.date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}
              </div>
              <div style={{ fontSize: 12, fontWeight: 500, color: lastSession.winner === 'andre' ? 'var(--andre)' : lastSession.winner === 'cami' ? 'var(--cami)' : 'var(--text-dim)' }}>
                {lastSession.winner === 'andre' ? 'Andre won' : lastSession.winner === 'cami' ? 'Cami won' : 'Draw'}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 16 }}>
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                Andre <span style={{ fontWeight: 500, color: 'var(--text)' }}>{lastAndre} pts</span>
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                Cami <span style={{ fontWeight: 500, color: 'var(--text)' }}>{lastCami} pts</span>
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-dim)', marginLeft: 'auto' }}>
                {lastSessionMatches.length} matches
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
