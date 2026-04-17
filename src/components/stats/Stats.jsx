import { useState } from 'react'
import HthBar from '../shared/HthBar.jsx'

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

      {/* Tab switcher */}
      <div style={{
        display: 'flex', background: 'var(--surface)', borderRadius: 'var(--radius-sm)',
        border: '0.5px solid var(--border)', padding: 3, gap: 2, marginBottom: 16,
      }}>
        {[['game', 'Game', null], ['andre', 'Andre', 'andre'], ['cami', 'Cami', 'cami']].map(([id, label, color]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            style={{
              flex: 1, textAlign: 'center', padding: '8px 4px', fontSize: 12, fontWeight: 500,
              borderRadius: 6, cursor: 'pointer', border: 'none', fontFamily: 'Archivo, sans-serif',
              background: tab === id ? 'var(--surface2)' : 'none',
              color: tab === id && color ? `var(--${color})` : tab === id ? 'var(--text)' : 'var(--text-muted)',
              transition: 'all 0.15s',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'game'  && <GameStats  stats={stats} />}
      {tab === 'andre' && <PlayerStats stats={stats.players.andre} player="andre" />}
      {tab === 'cami'  && <PlayerStats stats={stats.players.cami}  player="cami"  />}
    </div>
  )
}

function GameStats({ stats }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <SectionTitle>Overall</SectionTitle>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <StatCard label="Total matches" value={stats.totalMatches} />
        <StatCard label="Total sessions" value={stats.totalSessions} />
        <StatCard label="Total draws" value={stats.totalDraws} />
      </div>

      <SectionTitle>Match wins</SectionTitle>
      <HthBar andreVal={stats.matchWins.andre} camiVal={stats.matchWins.cami} drawVal={stats.matchWins.draws} />

      <SectionTitle>Session wins</SectionTitle>
      <HthBar andreVal={stats.sessionWins.andre} camiVal={stats.sessionWins.cami} drawVal={stats.sessionWins.draws} />

      <SectionTitle>Records</SectionTitle>
      <RecordCard
        label="Best winning streak"
        value={stats.bestStreak.value}
        sub="matches in a row"
        player={stats.bestStreak.player}
      />
      <RecordCard
        label="Most brutal loss"
        value={stats.worstLoss.value}
        sub="called and lost badly"
        player={stats.worstLoss.player}
        bad
      />
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
        <StatCard
          label="Call win rate"
          value={`${stats.callWinRate}%`}
          valueColor={stats.callWinRate >= 50 ? 'var(--green)' : 'var(--red)'}
          sub={`${stats.callWinCount} of ${stats.totalCalls} calls won`}
          tooltip={`Of all the times ${name} knocked, how often they had the lowest score at the table.`}
        />
        <StatCard
          label="Call rate"
          value={`${stats.callRate}%`}
          valueColor={color}
          sub="of all matches"
          tooltip={`Out of all matches played, how often ${name} was the one who knocked to end the match.`}
        />
        <StatCard
          label="Penalty rate"
          value={`${stats.penaltyRate}%`}
          valueColor={stats.penaltyRate > 50 ? 'var(--red)' : 'var(--text)'}
          sub={`${stats.penaltyCount} calls backfired`}
          tooltip={`Of all ${name}'s calls, how often they knocked but didn't have the lowest score — earning the +10 penalty.`}
        />
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
  return (
    <div style={{ fontSize: 11, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 500, paddingTop: 4 }}>
      {children}
    </div>
  )
}

function StatCard({ label, value, valueColor, sub, tooltip }) {
  const [showTooltip, setShowTooltip] = useState(false)

  return (
    <div className="card-sm" style={{ position: 'relative' }}>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6, lineHeight: 1.3, paddingRight: tooltip ? 18 : 0 }}>
        {label}
      </div>
      <div style={{ fontFamily: 'Archivo Black, sans-serif', fontSize: 22, color: valueColor || 'var(--text)' }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 2 }}>{sub}</div>}

      {tooltip && (
        <>
          <button
            onClick={e => { e.stopPropagation(); setShowTooltip(v => !v) }}
            style={{
              position: 'absolute', top: 10, right: 10, width: 14, height: 14,
              borderRadius: '50%', border: '0.5px solid var(--border2)',
              background: 'none', color: 'var(--text-dim)', fontSize: 9, fontWeight: 500,
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'Archivo, sans-serif', lineHeight: 1,
            }}
          >?</button>
          {showTooltip && (
            <div
              onClick={e => e.stopPropagation()}
              style={{
                position: 'absolute', bottom: 'calc(100% + 6px)', left: 0, right: 0,
                background: 'var(--surface2)', border: '0.5px solid var(--border2)',
                borderRadius: 'var(--radius-sm)', padding: '8px 10px',
                fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.4, zIndex: 20,
              }}
            >
              {tooltip}
            </div>
          )}
        </>
      )}
    </div>
  )
}

function RecordCard({ label, value, sub, player, bad }) {
  return (
    <div className="card-sm" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>{label}</div>
        <div style={{
          fontFamily: 'Archivo Black, sans-serif', fontSize: 22,
          color: bad ? 'var(--red)' : `var(--${player})`,
        }}>{value}</div>
        <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 2 }}>{sub}</div>
      </div>
      <div style={{ fontSize: 13, fontWeight: 500, color: `var(--${player})` }}>
        {player === 'andre' ? 'Andre' : 'Cami'}
      </div>
    </div>
  )
}
