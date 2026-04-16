import { useState } from 'react'
import { computeScores } from '../../lib/scoring.js'

export default function Session({ sessionData, allData, onSessionChange }) {
  const { activeSession, matches, sessionTotals, startSession, logMatch, closeSession } = sessionData
  const [phase, setPhase] = useState('start') // 'start' | 'entry' | 'confirm' | 'closing'
  const [targetInput, setTargetInput] = useState('')
  const [caller, setCaller] = useState(null)
  const [andreRaw, setAndreRaw] = useState('')
  const [camiRaw, setCamiRaw] = useState('')
  const [computed, setComputed] = useState(null)
  const [loading, setLoading] = useState(false)
  const [showEndConfirm, setShowEndConfirm] = useState(false)

  // If there's an active session, go straight to entry
  const showEntry = !!activeSession

  async function handleStartSession() {
    setLoading(true)
    await startSession(targetInput ? parseInt(targetInput) : null)
    setLoading(false)
    setPhase('entry')
  }

  function handleCallerSelect(p) {
    setCaller(p)
  }

  function handleCompute() {
    if (!caller || andreRaw === '' || camiRaw === '') return
    const result = computeScores({ caller, andreRaw: parseInt(andreRaw), camiRaw: parseInt(camiRaw) })
    setComputed(result)
    setPhase('confirm')
  }

  async function handleLogMatch() {
    if (!computed) return
    setLoading(true)
    await logMatch({
      caller,
      andreRaw: parseInt(andreRaw),
      camiRaw: parseInt(camiRaw),
      andreFinal: computed.andreFinal,
      camiFinal: computed.camiFinal,
    })
    // Reset for next match
    setCaller(null); setAndreRaw(''); setCamiRaw(''); setComputed(null)
    setPhase('entry')
    setLoading(false)
    allData.refetch()
  }

  async function handleCloseSession() {
    setLoading(true)
    const { winner } = await closeSession()
    setLoading(false)
    setShowEndConfirm(false)
    onSessionChange()
  }

  const sessionAndre = sessionTotals.andre
  const sessionCami  = sessionTotals.cami
  const target = activeSession?.target_score

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
              <div style={{ fontSize: 12, color: `var(--${p})`, width: 36, fontWeight: 500, textTransform: 'capitalize' }}>{p === 'andre' ? 'Andre' : 'Cami'}</div>
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

      {/* Match entry */}
      {phase !== 'confirm' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 16 }}>
          {/* Who called */}
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

          {/* Card values */}
          <div>
            <div style={{ fontSize: 12, color: 'var(--text-dim)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 }}>
              Card values
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {[['andre', andreRaw, setAndreRaw], ['cami', camiRaw, setCamiRaw]].map(([p, val, set]) => (
                <div key={p} className="card-sm" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ fontSize: 12, fontWeight: 500, color: `var(--${p})` }}>{p === 'andre' ? 'Andre' : 'Cami'}</div>
                  <input
                    type="number"
                    value={val}
                    onChange={e => set(e.target.value)}
                    min="0"
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
        </div>
      ) : (
        /* Confirm phase */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
          <div style={{ fontSize: 12, color: 'var(--text-dim)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: 0.8 }}>
            Confirm
          </div>
          <div className="card-sm">
            {[['andre', computed.andreFinal], ['cami', computed.camiFinal]].map(([p, score]) => (
              <div key={p} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0' }}>
                <span style={{ fontSize: 13, fontWeight: 500, color: `var(--${p})` }}>{p === 'andre' ? 'Andre' : 'Cami'}</span>
                <span style={{
                  fontFamily: 'Archivo Black, sans-serif', fontSize: 18,
                  color: score === 0 ? 'var(--green)' : score > (p === 'andre' ? parseInt(andreRaw) : parseInt(camiRaw)) ? 'var(--red)' : 'var(--text)',
                }}>{score}</span>
              </div>
            ))}
          </div>
          <button className="btn-primary" onClick={handleLogMatch} disabled={loading}>
            {loading ? 'Logging…' : 'Log match'}
          </button>
          <button className="btn-secondary" onClick={() => setPhase('entry')}>Back</button>
        </div>
      )}

      {/* Match log */}
      {matches.length > 0 && (
        <>
          <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
            This session
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
            {[...matches].reverse().map(m => (
              <div key={m.id} className="card-sm" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>#{m.match_number}</span>
                  <span className={`caller-tag ${m.caller}`}>{m.caller === 'andre' ? 'Andre' : 'Cami'} called</span>
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                  {[['Andre', m.andre_final, m.andre_raw], ['Cami', m.cami_final, m.cami_raw]].map(([name, final, raw]) => (
                    <div key={name} style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 10, color: 'var(--text-dim)' }}>{name}</div>
                      <div style={{
                        fontSize: 14, fontWeight: 500,
                        color: final === 0 ? 'var(--green)' : final > raw ? 'var(--red)' : 'var(--text)',
                      }}>{final}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
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
