import { useState } from 'react'
import { computeScores, computeEmptyHandScores } from '../../lib/scoring.js'

export default function Session({ sessionData, allData, onSessionChange }) {
  const { activeSession, matches, sessionTotals, startSession, logMatch, closeSession } = sessionData
  const [phase, setPhase] = useState('entry') // 'entry' | 'empty' | 'confirm'
  const [targetInput, setTargetInput] = useState('')
  const [caller, setCaller] = useState(null)
  const [emptyPlayer, setEmptyPlayer] = useState(null)
  const [andreRaw, setAndreRaw] = useState('')
  const [camiRaw, setCamiRaw] = useState('')
  const [computed, setComputed] = useState(null)
  const [loading, setLoading] = useState(false)
  const [showEndConfirm, setShowEndConfirm] = useState(false)

  async function handleStartSession() {
    setLoading(true)
    await startSession(targetInput ? parseInt(targetInput) : null)
    setLoading(false)
  }

  function handleCallerSelect(p) {
    setCaller(p)
    setEmptyPlayer(null)
  }

  function handleEmptyHand(p) {
    setEmptyPlayer(p)
    setCaller(null)
    setAndreRaw('')
    setCamiRaw('')
    setPhase('empty')
  }

  function handleCompute() {
    if (!caller || andreRaw === '' || camiRaw === '') return
    const result = computeScores({ caller, andreRaw: parseInt(andreRaw), camiRaw: parseInt(camiRaw) })
    setComputed(result)
    setPhase('confirm')
  }

  function handleEmptyCompute() {
    const oppRaw = emptyPlayer === 'andre' ? camiRaw : andreRaw
    if (oppRaw === '') return
    const result = computeEmptyHandScores({
      emptyPlayer,
      andreRaw: emptyPlayer === 'andre' ? 0 : parseInt(andreRaw),
      camiRaw:  emptyPlayer === 'cami'  ? 0 : parseInt(camiRaw),
    })
    setComputed(result)
    setPhase('confirm')
  }

  function resetEntry() {
    setCaller(null); setEmptyPlayer(null)
    setAndreRaw(''); setCamiRaw('')
    setComputed(null); setPhase('entry')
  }

  async function handleLogMatch() {
    if (!computed) return
    setLoading(true)
    await logMatch({
      caller: emptyPlayer ? `empty_${emptyPlayer}` : caller,
      andreRaw: emptyPlayer === 'andre' ? 0 : parseInt(andreRaw) || 0,
      camiRaw:  emptyPlayer === 'cami'  ? 0 : parseInt(camiRaw)  || 0,
      andreFinal: computed.andreFinal,
      camiFinal: computed.camiFinal,
    })
    resetEntry()
    setLoading(false)
    allData.refetch()
  }

  async function handleCloseSession() {
    setLoading(true)
    await closeSession()
    setLoading(false)
    setShowEndConfirm(false)
    onSessionChange()
  }

  const sessionAndre = sessionTotals.andre
  const sessionCami  = sessionTotals.cami
  const target = activeSession?.target_score

  function scoreColor(final, raw, isOut) {
    if (isOut || final < 0) return 'var(--green)'
    if (final === 0) return 'var(--green)'
    if (final > raw) return 'var(--red)'
    return 'var(--text)'
  }

  function matchLabel(m) {
    if (m.caller?.startsWith('empty_')) {
      const p = m.caller.split('_')[1]
      return { tag: p, label: `${p === 'andre' ? 'Andre' : 'Cami'} went out` }
    }
    return { tag: m.caller, label: `${m.caller === 'andre' ? 'Andre' : 'Cami'} called` }
  }

  // No active session — start screen
  if (!activeSession) {
    return (
      <div className="scrollable fade-in" style={{ height: '100%', padding: '20px 16px' }}>
        <h1 style={{ fontFamily: 'Archivo Black, sans-serif', fontSize: 22, letterSpacing: -0.5, marginBottom: 24 }}>Session</h1>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="card-sm" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <label style={{ fontSize: 13, color: 'var(--text-muted)', flex: 1 }}>Target score (optional)</label>
            <input
              type="number"
              value={targetInput}
              onChange={e => setTargetInput(e.target.value)}
              placeholder="e.g. 100"
              style={{
                background: 'var(--surface2)', border: '0.5px solid var(--border)', borderRadius: 6,
                color: 'var(--text)', fontFamily: 'Archivo, sans-serif', fontSize: 14, fontWeight: 500,
                padding: '6px 10px', width: 90, textAlign: 'right',
              }}
            />
          </div>
          <button className="btn-primary" onClick={handleStartSession} disabled={loading}>
            {loading ? 'Starting…' : 'Start session'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="scrollable fade-in" style={{ height: '100%', padding: '20px 16px' }}>

      {/* Header */}
      <div style={{ marginBottom: 14 }}>
        <h1 style={{ fontFamily: 'Archivo Black, sans-serif', fontSize: 22, letterSpacing: -0.5 }}>Session</h1>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
          {new Date(activeSession.date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}
          {' · Match '}{matches.length + (phase === 'confirm' ? 0 : 1)}
          {target ? ` · target ${target}` : ''}
        </div>
      </div>

      {/* Progress bars */}
      {target && (
        <div style={{ marginBottom: 10 }}>
          {[['andre', sessionAndre], ['cami', sessionCami]].map(([p, val]) => (
            <div key={p} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
              <div style={{ fontSize: 12, color: `var(--${p})`, width: 36, fontWeight: 500 }}>{p === 'andre' ? 'Andre' : 'Cami'}</div>
              <div style={{ flex: 1, height: 5, background: 'var(--surface2)', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ width: `${Math.min(100, (val / target) * 100)}%`, height: '100%', background: `var(--${p})`, borderRadius: 3 }} />
              </div>
              <div style={{ fontSize: 12, color: `var(--${p})`, width: 28, textAlign: 'right', fontWeight: 500 }}>{val}</div>
            </div>
          ))}
        </div>
      )}

      {/* Session scoreboard */}
      <div className="card-sm" style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--andre)', marginBottom: 4 }}>Andre</div>
          <div style={{ fontFamily: 'Archivo Black, sans-serif', fontSize: 28, color: 'var(--andre)' }}>{sessionAndre}</div>
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-dim)' }}>vs</div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--cami)', marginBottom: 4 }}>Cami</div>
          <div style={{ fontFamily: 'Archivo Black, sans-serif', fontSize: 28, color: 'var(--cami)' }}>{sessionCami}</div>
        </div>
      </div>

      {/* ENTRY PHASE */}
      {phase === 'entry' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 12, color: 'var(--text-dim)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 }}>
              Who called?
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {['andre', 'cami'].map(p => (
                <button
                  key={p}
                  onClick={() => handleCallerSelect(p)}
                  style={{
                    padding: '18px 12px', borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                    fontFamily: 'Archivo Black, sans-serif', fontSize: 18, textAlign: 'center',
                    background: caller === p ? `var(--${p}-light)` : `rgba(${p === 'andre' ? '55,138,221' : '239,159,39'},0.05)`,
                    border: `1.5px solid ${caller === p ? `var(--${p})` : `var(--${p}-border)`}`,
                    color: `var(--${p})`, transition: 'all 0.15s',
                  }}
                >
                  {p === 'andre' ? 'Andre' : 'Cami'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div style={{ fontSize: 12, color: 'var(--text-dim)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 }}>
              Card values
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {[['andre', andreRaw, setAndreRaw], ['cami', camiRaw, setCamiRaw]].map(([p, val, set]) => (
                <div key={p} className="card-sm" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ fontSize: 12, fontWeight: 500, color: `var(--${p})` }}>{p === 'andre' ? 'Andre' : 'Cami'}</div>
                  <input
                    type="number" value={val} onChange={e => set(e.target.value)}
                    inputMode="numeric"
                    style={{
                      background: 'var(--surface2)', border: '0.5px solid var(--border)', borderRadius: 6,
                      color: 'var(--text)', fontFamily: 'Archivo Black, sans-serif', fontSize: 28,
                      padding: '8px 10px', width: '100%', textAlign: 'center',
                    }}
                  />
                </div>
              ))}
            </div>
          </div>

          <button
            className="btn-primary"
            onClick={handleCompute}
            disabled={!caller || andreRaw === '' || camiRaw === ''}
            style={{ opacity: (!caller || andreRaw === '' || camiRaw === '') ? 0.4 : 1 }}
          >
            Preview
          </button>

          {/* Empty hand — secondary, subtle */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 24, paddingTop: 2 }}>
            {['andre', 'cami'].map(p => (
              <button
                key={p}
                onClick={() => handleEmptyHand(p)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontSize: 12, color: 'var(--text-dim)', fontFamily: 'Archivo, sans-serif',
                  textDecoration: 'underline', textDecorationColor: 'rgba(136,135,128,0.4)',
                  padding: '4px 0',
                }}
              >
                {p === 'andre' ? 'Andre' : 'Cami'} went out
              </button>
            ))}
          </div>
        </div>
      )}

      {/* EMPTY HAND PHASE */}
      {phase === 'empty' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 16 }}>
          <div style={{ fontSize: 12, color: 'var(--text-dim)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: 0.8 }}>
            {emptyPlayer === 'andre' ? 'Andre' : 'Cami'} went out — −10 pts
          </div>
          <div className="card-sm" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {(() => {
              const opp = emptyPlayer === 'andre' ? 'cami' : 'andre'
              const val = opp === 'cami' ? camiRaw : andreRaw
              const set = opp === 'cami' ? setCamiRaw : setAndreRaw
              return (
                <>
                  <div style={{ fontSize: 12, fontWeight: 500, color: `var(--${opp})` }}>
                    {opp === 'andre' ? 'Andre' : 'Cami'}'s cards
                  </div>
                  <input
                    type="number" value={val} onChange={e => set(e.target.value)}
                    inputMode="numeric" autoFocus
                    style={{
                      background: 'var(--surface2)', border: '0.5px solid var(--border)', borderRadius: 6,
                      color: 'var(--text)', fontFamily: 'Archivo Black, sans-serif', fontSize: 28,
                      padding: '8px 10px', width: '100%', textAlign: 'center',
                    }}
                  />
                </>
              )
            })()}
          </div>
          <button
            className="btn-primary"
            onClick={handleEmptyCompute}
            disabled={(emptyPlayer === 'andre' ? camiRaw : andreRaw) === ''}
            style={{ opacity: (emptyPlayer === 'andre' ? camiRaw : andreRaw) === '' ? 0.4 : 1 }}
          >
            Preview
          </button>
          <button className="btn-secondary" onClick={resetEntry}>Back</button>
        </div>
      )}

      {/* CONFIRM PHASE */}
      {phase === 'confirm' && computed && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
          <div style={{ fontSize: 12, color: 'var(--text-dim)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: 0.8 }}>
            Confirm
          </div>
          <div className="card-sm">
            {[['andre', computed.andreFinal], ['cami', computed.camiFinal]].map(([p, score]) => {
              const raw = p === 'andre' ? parseInt(andreRaw) || 0 : parseInt(camiRaw) || 0
              const isOut = emptyPlayer === p
              return (
                <div key={p} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0' }}>
                  <span style={{ fontSize: 13, fontWeight: 500, color: `var(--${p})` }}>
                    {p === 'andre' ? 'Andre' : 'Cami'}
                    {isOut && <span style={{ fontSize: 11, color: 'var(--text-dim)', fontWeight: 400, marginLeft: 6 }}>went out</span>}
                  </span>
                  <span style={{ fontFamily: 'Archivo Black, sans-serif', fontSize: 18, color: scoreColor(score, raw, isOut) }}>
                    {score}
                  </span>
                </div>
              )
            })}
          </div>
          <button className="btn-primary" onClick={handleLogMatch} disabled={loading}>
            {loading ? 'Logging…' : 'Log match'}
          </button>
          <button className="btn-secondary" onClick={resetEntry}>Back</button>
        </div>
      )}

      {/* Match log */}
      {matches.length > 0 && (
        <>
          <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
            This session
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
            {[...matches].reverse().map(m => {
              const { tag, label } = matchLabel(m)
              const isOut = m.caller?.startsWith('empty_')
              return (
                <div key={m.id} className="card-sm" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>#{m.match_number}</span>
                    <span className={`caller-tag ${tag}`}>{label}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 12 }}>
                    {[['Andre', m.andre_final, m.andre_raw, 'andre'], ['Cami', m.cami_final, m.cami_raw, 'cami']].map(([name, final, raw, p]) => (
                      <div key={name} style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 10, color: 'var(--text-dim)' }}>{name}</div>
                        <div style={{ fontSize: 14, fontWeight: 500, color: scoreColor(final, raw, isOut && m.caller === `empty_${p}`) }}>
                          {final}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      {/* End session */}
      {!showEndConfirm ? (
        <button className="btn-secondary" onClick={() => setShowEndConfirm(true)}>End session</button>
      ) : (
        <div className="card-sm" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center' }}>
            End session? {matches.length} matches played.
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <button className="btn-secondary" onClick={() => setShowEndConfirm(false)}>Cancel</button>
            <button className="btn-primary" onClick={handleCloseSession} disabled={loading}>
              {loading ? 'Saving…' : 'Confirm'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
