import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

function isDraw(m) {
  return !m.caller?.startsWith('empty_') && m.andre_final === 0 && m.cami_final === 0
}

function matchWinner(m) {
  if (isDraw(m)) return 'draw'
  if (m.caller === 'empty_andre') return 'andre'
  if (m.caller === 'empty_cami') return 'cami'
  if (m.caller === 'andre' && m.andre_final < 0) return 'andre'
  if (m.caller === 'cami' && m.cami_final < 0) return 'cami'
  if (m.andre_final < m.cami_final) return 'andre'
  if (m.cami_final < m.andre_final) return 'cami'
  return 'draw'
}

export function useAllData() {
  const [sessions, setSessions] = useState([])
  const [allMatches, setAllMatches] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    setLoading(true)
    const [{ data: sessionsData }, { data: matchesData }] = await Promise.all([
      supabase.from('sessions').select('*').order('created_at', { ascending: true }),
      supabase.from('matches').select('*').order('created_at', { ascending: true }).order('match_number', { ascending: true }),
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
    draws: completedSessions.filter(s => s.winner === null).length,
  }

  const matchWins = {
    andre: allMatches.filter(m => matchWinner(m) === 'andre').length,
    cami:  allMatches.filter(m => matchWinner(m) === 'cami').length,
    draws: allMatches.filter(m => matchWinner(m) === 'draw').length,
  }

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

  // Drift data: gap = cami_cumulative - andre_cumulative (positive = Cami ahead)
  function getDriftData(sessionId) {
    const matches = sessionId
      ? allMatches.filter(m => m.session_id === sessionId)
      : allMatches
    let andreAcc = 0, camiAcc = 0
    const pts = [0]
    for (const m of matches) {
      andreAcc += m.andre_final
      camiAcc += m.cami_final
      pts.push(camiAcc - andreAcc)
    }
    return pts
  }

  function getDriftBySession() {
    let andreAcc = 0, camiAcc = 0
    const pts = [0]
    const labels = ['']
    for (const s of completedSessions) {
      const sm = allMatches.filter(m => m.session_id === s.id)
      andreAcc += sm.reduce((a, m) => a + m.andre_final, 0)
      camiAcc  += sm.reduce((a, m) => a + m.cami_final, 0)
      pts.push(camiAcc - andreAcc)
      labels.push(new Date(s.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }))
    }
    return { pts, labels }
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
    getDriftData,
    getDriftBySession,
    stats,
    refetch: fetchAll,
  }
}

function computeStats(allMatches, completedSessions) {
  const total = allMatches.length
  if (total === 0) return null

  const totalDraws = allMatches.filter(isDraw).length

  const players = ['andre', 'cami']
  const playerStats = {}

  for (const p of players) {
    // Call = knock OR empty hand by this player
    const calls = allMatches.filter(m => m.caller === p || m.caller === `empty_${p}`)
    const regularCalls = allMatches.filter(m => m.caller === p)
    const callWins = regularCalls.filter(m => m[`${p}_final`] <= 0 && !isDraw(m))
    const penalties = regularCalls.filter(m => m[`${p}_final`] > m[`${p}_raw`])

    let longestStreak = 0, tempStreak = 0
    for (const m of allMatches) {
      if (isDraw(m)) continue
      if (matchWinner(m) === p) { tempStreak++; longestStreak = Math.max(longestStreak, tempStreak) }
      else tempStreak = 0
    }

    let currentStreak = 0
    for (let i = allMatches.length - 1; i >= 0; i--) {
      const m = allMatches[i]
      if (isDraw(m)) continue
      if (matchWinner(m) === p) currentStreak++
      else break
    }

    let longestSessionStreak = 0, currentSessionStreak = 0, tempSStreak = 0
    for (const s of completedSessions) {
      if (s.winner === p) { tempSStreak++; longestSessionStreak = Math.max(longestSessionStreak, tempSStreak) }
      else tempSStreak = 0
    }
    for (let i = completedSessions.length - 1; i >= 0; i--) {
      if (completedSessions[i].winner === p) currentSessionStreak++
      else break
    }

    const allFinalScores = allMatches.map(m => m[`${p}_final`])
    const worstMatch = Math.max(...allFinalScores, 0)

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
      callWinRate: regularCalls.length ? Math.round((callWins.length / regularCalls.length) * 100) : 0,
      callWinCount: callWins.length,
      callRate: total ? Math.round((calls.length / total) * 100) : 0,
      penaltyRate: regularCalls.length ? Math.round((penalties.length / regularCalls.length) * 100) : 0,
      penaltyCount: penalties.length,
      currentCallStreak: currentStreak,
      longestCallStreak: longestStreak,
      currentSessionStreak,
      longestSessionStreak,
      avgPerMatch: Math.round(avgPerMatch * 10) / 10,
      avgPerSession: Math.round(avgPerSession),
      worstMatch,
      matchWins: allMatches.filter(m => matchWinner(m) === p).length,
      sessionWins: completedSessions.filter(s => s.winner === p).length,
      sessionWinRate: completedSessions.length
        ? Math.round((completedSessions.filter(s => s.winner === p).length / completedSessions.length) * 100)
        : 0,
    }
  }

  const bestStreak = playerStats.andre.longestCallStreak >= playerStats.cami.longestCallStreak
    ? { player: 'andre', value: playerStats.andre.longestCallStreak }
    : { player: 'cami', value: playerStats.cami.longestCallStreak }

  // Most brutal loss: highest final score in a single match
  let worstLoss = { player: 'andre', value: 0, matchNum: null, sessionDate: null }
  for (const m of allMatches) {
    const s = completedSessions.find(s => s.id === m.session_id)
    const date = s ? new Date(s.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : ''
    if (m.andre_final > worstLoss.value) worstLoss = { player: 'andre', value: m.andre_final, matchNum: m.match_number, sessionDate: date }
    if (m.cami_final > worstLoss.value) worstLoss = { player: 'cami', value: m.cami_final, matchNum: m.match_number, sessionDate: date }
  }

  // Longest session
  let longestSession = { value: 0, sessionDate: null }
  for (const s of completedSessions) {
    const count = allMatches.filter(m => m.session_id === s.id).length
    if (count > longestSession.value) {
      longestSession = {
        value: count,
        sessionDate: new Date(s.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
      }
    }
  }

  // Biggest comeback: largest gap closed within a session (regardless of winner)
  let biggestComeback = { player: null, value: 0, sessionDate: null }
  for (const s of completedSessions) {
    const sm = allMatches.filter(m => m.session_id === s.id)
    let andreAcc = 0, camiAcc = 0
    let maxAndreDeficit = 0, maxCamiDeficit = 0
    let maxAndreDeficitIdx = 0, maxCamiDeficitIdx = 0
    const andreScores = [0], camiScores = [0]
    for (const m of sm) {
      andreAcc += m.andre_final; camiAcc += m.cami_final
      andreScores.push(andreAcc); camiScores.push(camiAcc)
    }
    // For each point, find the max deficit Andre had before and how much he closed
    for (let i = 0; i < andreScores.length; i++) {
      const gap = andreScores[i] - camiScores[i] // positive = Andre behind (higher is worse)
      if (gap > maxAndreDeficit) { maxAndreDeficit = gap; maxAndreDeficitIdx = i }
    }
    const andreClose = maxAndreDeficit - (andreScores[andreScores.length-1] - camiScores[camiScores.length-1])
    if (andreClose > biggestComeback.value) {
      biggestComeback = { player: 'andre', value: Math.round(andreClose), sessionDate: new Date(s.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) }
    }
    for (let i = 0; i < camiScores.length; i++) {
      const gap = camiScores[i] - andreScores[i]
      if (gap > maxCamiDeficit) { maxCamiDeficit = gap; maxCamiDeficitIdx = i }
    }
    const camiClose = maxCamiDeficit - (camiScores[camiScores.length-1] - andreScores[andreScores.length-1])
    if (camiClose > biggestComeback.value) {
      biggestComeback = { player: 'cami', value: Math.round(camiClose), sessionDate: new Date(s.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) }
    }
  }

  // Call rate (including empty hands)
  const andreCalls = playerStats.andre.totalCalls
  const camiCalls = playerStats.cami.totalCalls
  const callRateAndre = total ? Math.round((andreCalls / total) * 100) : 0
  const callRateCami = 100 - callRateAndre

  return {
    totalMatches: total,
    totalDraws,
    totalSessions: completedSessions.length,
    matchWins: {
      andre: allMatches.filter(m => matchWinner(m) === 'andre').length,
      cami:  allMatches.filter(m => matchWinner(m) === 'cami').length,
      draws: allMatches.filter(m => matchWinner(m) === 'draw').length,
    },
    sessionWins: {
      andre: completedSessions.filter(s => s.winner === 'andre').length,
      cami:  completedSessions.filter(s => s.winner === 'cami').length,
      draws: completedSessions.filter(s => s.winner === null).length,
    },
    bestStreak,
    worstLoss,
    longestSession,
    biggestComeback,
    callRateAndre,
    callRateCami,
    andreTotalCalls: andreCalls,
    camiTotalCalls: camiCalls,
    players: playerStats,
  }
}
