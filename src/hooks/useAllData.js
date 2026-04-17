import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useAllData() {
  const [sessions, setSessions] = useState([])
  const [allMatches, setAllMatches] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAll()
  }, [])

  async function fetchAll() {
    setLoading(true)
    const [{ data: sessionsData }, { data: matchesData }] = await Promise.all([
      supabase.from('sessions').select('*').order('created_at', { ascending: true }),
      supabase.from('matches').select('*').order('match_number', { ascending: true }),
    ])
    setSessions(sessionsData || [])
    setAllMatches(matchesData || [])
    setLoading(false)
  }

  const warScore = allMatches.reduce(
    (acc, m) => ({ andre: acc.andre + m.andre_final, cami: acc.cami + m.cami_final }),
    { andre: 0, cami: 0 }
  )

  const completedSessions = sessions.filter(s => s.status === 'completed')

  const sessionWins = {
    andre: completedSessions.filter(s => s.winner === 'andre').length,
    cami:  completedSessions.filter(s => s.winner === 'cami').length,
  }

  // A draw: both raws equal, both finals 0 — neither player wins
  function isDraw(m) {
    return !m.caller?.startsWith('empty_') && m.andre_raw === m.cami_raw
  }

  // Match wins: caller got 0 AND it wasn't a draw
  const matchWins = allMatches.reduce(
    (acc, m) => ({
      andre: acc.andre + (m.andre_final === 0 && !isDraw(m) && m.caller !== 'cami' ? 1 : 0),
      cami:  acc.cami  + (m.cami_final  === 0 && !isDraw(m) && m.caller !== 'andre' ? 1 : 0),
    }),
    { andre: 0, cami: 0 }
  )

  function getMatchesForSession(sessionId) {
    return allMatches.filter(m => m.session_id === sessionId)
  }

  function getWarScoreAtSessionStart(sessionId) {
    const sessionIdx = sessions.findIndex(s => s.id === sessionId)
    const prevSessions = sessions.slice(0, sessionIdx)
    const prevMatches = allMatches.filter(m =>
      prevSessions.some(s => s.id === m.session_id)
    )
    return prevMatches.reduce(
      (acc, m) => ({ andre: acc.andre + m.andre_final, cami: acc.cami + m.cami_final }),
      { andre: 0, cami: 0 }
    )
  }

  const stats = computeStats(allMatches, completedSessions)

  return {
    sessions,
    completedSessions,
    allMatches,
    warScore,
    sessionWins,
    matchWins,
    loading,
    getMatchesForSession,
    getWarScoreAtSessionStart,
    stats,
    refetch: fetchAll,
  }
}

function isDraw(m) {
  return !m.caller?.startsWith('empty_') && m.andre_raw === m.cami_raw
}

function computeStats(allMatches, completedSessions) {
  const total = allMatches.length
  if (total === 0) return null

  const totalDraws = allMatches.filter(isDraw).length

  const players = ['andre', 'cami']
  const playerStats = {}

  for (const p of players) {
    const calls = allMatches.filter(m => m.caller === p)
    // A call win: caller got 0 and it wasn't a draw
    const callWins = calls.filter(m => m[`${p}_final`] === 0 && !isDraw(m))
    const penalties = calls.filter(m => m[`${p}_final`] > m[`${p}_raw`])

    // Call win streak (draws don't count as wins or losses for streaks)
    let longestStreak = 0, tempStreak = 0
    for (const m of allMatches) {
      if (isDraw(m)) continue // draws don't break or build streaks
      if (m.caller === p && m[`${p}_final`] === 0) {
        tempStreak++
        longestStreak = Math.max(longestStreak, tempStreak)
      } else if (m.caller === p) {
        tempStreak = 0
      }
    }

    // Current streak (from end, skipping draws)
    let currentStreak = 0
    for (let i = allMatches.length - 1; i >= 0; i--) {
      const m = allMatches[i]
      if (isDraw(m)) continue
      if (m.caller === p && m[`${p}_final`] === 0) currentStreak++
      else if (m.caller === p) break
    }

    // Session win streaks
    let longestSessionStreak = 0, currentSessionStreak = 0, tempSStreak = 0
    for (const s of completedSessions) {
      if (s.winner === p) { tempSStreak++; longestSessionStreak = Math.max(longestSessionStreak, tempSStreak) }
      else tempSStreak = 0
    }
    for (let i = completedSessions.length - 1; i >= 0; i--) {
      if (completedSessions[i].winner === p) currentSessionStreak++
      else break
    }

    const nonCallerScores = allMatches
      .filter(m => m.caller !== p && !m.caller?.startsWith('empty_'))
      .map(m => m[`${p}_final`])
    const callerLossScores = allMatches
      .filter(m => m.caller === p && m[`${p}_final`] > 0)
      .map(m => m[`${p}_final`])
    const worstMatch = Math.max(...[...nonCallerScores, ...callerLossScores, 0])

    const avgPerMatch = allMatches.reduce((s, m) => s + m[`${p}_final`], 0) / total

    const sessionScores = completedSessions.map(s => {
      const sm = allMatches.filter(m => m.session_id === s.id)
      return sm.reduce((acc, m) => acc + m[`${p}_final`], 0)
    })
    const avgPerSession = sessionScores.length
      ? sessionScores.reduce((a, b) => a + b, 0) / sessionScores.length
      : 0

    playerStats[p] = {
      totalCalls: calls.length,
      callWinRate: calls.length ? Math.round((callWins.length / calls.length) * 100) : 0,
      callWinCount: callWins.length,
      callRate: total ? Math.round((calls.length / total) * 100) : 0,
      penaltyRate: calls.length ? Math.round((penalties.length / calls.length) * 100) : 0,
      penaltyCount: penalties.length,
      currentCallStreak: currentStreak,
      longestCallStreak: longestStreak,
      currentSessionStreak,
      longestSessionStreak,
      avgPerMatch: Math.round(avgPerMatch * 10) / 10,
      avgPerSession: Math.round(avgPerSession),
      worstMatch,
      sessionWins: completedSessions.filter(s => s.winner === p).length,
      sessionWinRate: completedSessions.length
        ? Math.round((completedSessions.filter(s => s.winner === p).length / completedSessions.length) * 100)
        : 0,
    }
  }

  const bestStreak = playerStats.andre.longestCallStreak >= playerStats.cami.longestCallStreak
    ? { player: 'andre', value: playerStats.andre.longestCallStreak }
    : { player: 'cami', value: playerStats.cami.longestCallStreak }

  const worstLoss = playerStats.andre.worstMatch >= playerStats.cami.worstMatch
    ? { player: 'andre', value: playerStats.andre.worstMatch }
    : { player: 'cami', value: playerStats.cami.worstMatch }

  // Match wins excluding draws
  const matchWins = {
    andre: allMatches.filter(m => m.andre_final === 0 && !isDraw(m) && m.caller !== 'cami').length,
    cami:  allMatches.filter(m => m.cami_final  === 0 && !isDraw(m) && m.caller !== 'andre').length,
  }

  return {
    totalMatches: total,
    totalDraws,
    totalSessions: completedSessions.length,
    matchWins,
    sessionWins: {
      andre: completedSessions.filter(s => s.winner === 'andre').length,
      cami:  completedSessions.filter(s => s.winner === 'cami').length,
    },
    bestStreak,
    worstLoss,
    players: playerStats,
  }
}
