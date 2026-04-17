/**
 * Compute final scores for a match given who called and raw card values.
 * Lower is better. Caller wins if their raw <= opponent raw.
 * Winner gets 0. Loser gets raw + 10. Non-caller always gets their raw.
 * If both players have equal raw values, it's a draw — both get 0.
 */
export function computeScores({ caller, andreRaw, camiRaw }) {
  const isDraw = andreRaw === camiRaw
  if (isDraw) return { andreFinal: 0, camiFinal: 0, winner: null }

  const callerWins =
    caller === 'andre' ? andreRaw < camiRaw : camiRaw < andreRaw

  if (caller === 'andre') {
    return {
      andreFinal: callerWins ? 0 : andreRaw + 10,
      camiFinal: camiRaw,
      winner: callerWins ? 'andre' : null,
    }
  } else {
    return {
      andreFinal: andreRaw,
      camiFinal: callerWins ? 0 : camiRaw + 10,
      winner: callerWins ? 'cami' : null,
    }
  }
}

/**
 * Compute final scores for an empty hand match.
 * The player who emptied their hand gets -10.
 * The opponent gets their raw card value.
 * No call/knock involved — emptying hand ends the match automatically.
 */
export function computeEmptyHandScores({ emptyPlayer, andreRaw, camiRaw }) {
  if (emptyPlayer === 'andre') {
    return {
      andreFinal: -10,
      camiFinal: camiRaw,
      winner: 'andre',
    }
  } else {
    return {
      andreFinal: andreRaw,
      camiFinal: -10,
      winner: 'cami',
    }
  }
}

/**
 * Determine session winner from an array of matches.
 * Player with lowest sum of final scores in this session wins.
 */
export function computeSessionWinner(matches) {
  const andreTotal = matches.reduce((s, m) => s + m.andre_final, 0)
  const camiTotal  = matches.reduce((s, m) => s + m.cami_final, 0)
  if (andreTotal === camiTotal) return null
  return andreTotal < camiTotal ? 'andre' : 'cami'
}

/**
 * Compute cumulative war scores from all matches ever played.
 * Returns { andre: number, cami: number }
 */
export function computeWarScore(allMatches) {
  return allMatches.reduce(
    (acc, m) => ({ andre: acc.andre + m.andre_final, cami: acc.cami + m.cami_final }),
    { andre: 0, cami: 0 }
  )
}

/**
 * Check if a session should auto-close (one or both players hit the target).
 */
export function shouldAutoClose(matches, targetScore) {
  if (!targetScore) return false
  const andreTotal = matches.reduce((s, m) => s + m.andre_final, 0)
  const camiTotal  = matches.reduce((s, m) => s + m.cami_final, 0)
  return andreTotal >= targetScore || camiTotal >= targetScore
}
