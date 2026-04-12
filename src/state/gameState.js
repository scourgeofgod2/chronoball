// ============================================================
//  ChronoBall — Tek Gerçek Kaynak (Single Source of Truth)
// ============================================================

export function createInitialState() {
  return {
    phase:      'idle',   // idle | first-half | halftime | second-half
                          // extra-time | penalty-shootout | fulltime
    activeTeam: 0,
    turCount:   0,
    teams:      [],
    log:        [],
    stats: {
      0: { goals:0, yellowCards:0, redCards:0, penalties:0, corners:0, fouls:0 },
      1: { goals:0, yellowCards:0, redCards:0, penalties:0, corners:0, fouls:0 },
    },
    // Taktik: attack | balance | defense
    tactics: { 0: 'balance', 1: 'balance' },
    // Penaltı atışları (shootout)
    shootout: { scores: [0, 0], round: 0, maxRounds: 5 },
  }
}

/**
 * @param {string} name
 * @param {'K'|'D'|'OS'|'F'} pos
 */
export function createPlayer(name, pos = 'OS') {
  return { name, pos, yellowCards: 0, redCard: false, goals: 0 }
}

/**
 * @param {string}   name
 * @param {number}   goalDigit
 * @param {Array<string|{name:string,pos:string}>} players
 *   Dizideki her eleman string ya da { name, pos } olabilir.
 */
export function createTeam(name, goalDigit, players) {
  return {
    name,
    goalDigit,
    score: 0,
    players: players.map(p =>
      typeof p === 'string'
        ? createPlayer(p)
        : createPlayer(p.name, p.pos)
    ),
  }
}

let _state = createInitialState()

export function getState()         { return _state }
export function setState(s)        { _state = s }
export function resetState()       { _state = createInitialState() }