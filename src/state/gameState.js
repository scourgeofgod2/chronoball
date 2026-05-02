// ============================================================
//  ChronoBall — Tek Gerçek Kaynak (Single Source of Truth)
// ============================================================

export function createInitialState() {
  return {
    phase:      'idle',   // idle | first-half | halftime | second-half
                          // extra-time | penalty-shootout | fulltime
    gameMode:   'quick',  // 'quick' = Tek Maç | 'league' = Lig Modu
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
 * Pozisyona göre varsayılan rating değerleri döner (0-100 arası).
 * SHO: Şut gücü, DEF: Savunma, GK: Kalecilik, PAC: Hız, PHY: Fizik
 */
export function defaultRatings(pos) {
  const base = {
    K:  { sho: 25, def: 50, gk: 80, pac: 45, phy: 60 },
    D:  { sho: 35, def: 75, gk: 20, pac: 55, phy: 70 },
    OS: { sho: 55, def: 55, gk: 20, pac: 65, phy: 65 },
    F:  { sho: 78, def: 30, gk: 15, pac: 75, phy: 65 },
  }
  return base[pos] || base['OS']
}

/**
 * @param {string} name
 * @param {'K'|'D'|'OS'|'F'} pos
 * @param {object} [ratings] - Opsiyonel: { sho, def, gk, pac, phy }
 */
export function createPlayer(name, pos = 'OS', ratings = null) {
  const r = ratings || defaultRatings(pos)
  return {
    name,
    pos,
    yellowCards: 0,
    redCard:     false,
    goals:       0,
    ratings: {
      sho: r.sho ?? 55,
      def: r.def ?? 55,
      gk:  r.gk  ?? 20,
      pac: r.pac ?? 60,
      phy: r.phy ?? 65,
    },
  }
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