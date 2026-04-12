// ============================================================
//  ChronoBall — localStorage Maç Geçmişi
// ============================================================

const KEY = 'chronoball_history'

export function saveMatch(state) {
  try {
    const history = getHistory()
    const summary = {
      date:   new Date().toISOString(),
      teams:  state.teams.map(t => ({ name: t.name, score: t.score })),
      stats:  state.stats,
      events: state.log.filter(e => e.type !== 'normal' && e.type !== 'skip').length,
    }
    history.unshift(summary)
    localStorage.setItem(KEY, JSON.stringify(history.slice(0, 20)))
  } catch (_) {
    // localStorage devre dışı olabilir
  }
}

export function getHistory() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]')
  } catch (_) {
    return []
  }
}

export function clearHistory() {
  try { localStorage.removeItem(KEY) } catch (_) {}
}