import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { computeSessionWinner, shouldAutoClose } from '../lib/scoring'

export function useSession() {
  const [activeSession, setActiveSession] = useState(null)
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)

  // On mount, look for any active session
  useEffect(() => {
    fetchActiveSession()
  }, [])

  async function fetchActiveSession() {
    setLoading(true)
    const { data: sessions } = await supabase
      .from('sessions')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)

    if (sessions && sessions.length > 0) {
      const session = sessions[0]
      setActiveSession(session)
      await fetchMatches(session.id)
    }
    setLoading(false)
  }

  async function fetchMatches(sessionId) {
    const { data } = await supabase
      .from('matches')
      .select('*')
      .eq('session_id', sessionId)
      .order('match_number', { ascending: true })
    setMatches(data || [])
    return data || []
  }

  async function startSession(targetScore) {
    const { data, error } = await supabase
      .from('sessions')
      .insert({
        target_score: targetScore || null,
        status: 'active',
        date: new Date().toISOString().split('T')[0],
      })
      .select()
      .single()

    if (!error) {
      setActiveSession(data)
      setMatches([])
    }
    return { data, error }
  }

  async function logMatch({ caller, andreRaw, camiRaw, andreFinal, camiFinal }) {
    if (!activeSession) return

    const matchNumber = matches.length + 1
    const { data, error } = await supabase
      .from('matches')
      .insert({
        session_id: activeSession.id,
        match_number: matchNumber,
        caller,
        andre_raw: andreRaw,
        cami_raw: camiRaw,
        andre_final: andreFinal,
        cami_final: camiFinal,
      })
      .select()
      .single()

    if (!error) {
      const newMatches = [...matches, data]
      setMatches(newMatches)

      // Check auto-close
      if (shouldAutoClose(newMatches, activeSession.target_score)) {
        await closeSession(newMatches)
      }

      return { data, autoClose: shouldAutoClose(newMatches, activeSession.target_score) }
    }
    return { error }
  }

  async function closeSession(matchesOverride) {
    const m = matchesOverride || matches
    const winner = computeSessionWinner(m)
    const { error } = await supabase
      .from('sessions')
      .update({ status: 'completed', winner })
      .eq('id', activeSession.id)

    if (!error) {
      setActiveSession(null)
      setMatches([])
    }
    return { winner, error }
  }

  const sessionTotals = matches.reduce(
    (acc, m) => ({ andre: acc.andre + m.andre_final, cami: acc.cami + m.cami_final }),
    { andre: 0, cami: 0 }
  )

  return {
    activeSession,
    matches,
    sessionTotals,
    loading,
    startSession,
    logMatch,
    closeSession,
    refetch: fetchActiveSession,
  }
}
