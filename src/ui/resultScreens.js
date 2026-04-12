// ============================================================
//  ChronoBall — Devre Arası & Maç Sonu Ekranları
// ============================================================

import { getState }   from '../state/gameState.js'
import { calcMotm }   from '../engine/match.js'

export function buildHalftimeScreen() {
  const state = getState()
  const t     = state.teams

  _set('ht-team0-name', t[0].name)
  _set('ht-team1-name', t[1].name)
  _set('ht-score0',     t[0].score)
  _set('ht-score1',     t[1].score)

  const logEl = document.getElementById('halftime-log')
  if (logEl) {
    const goals = state.log.filter(e => e.type === 'gol')
    if (goals.length === 0) {
      logEl.innerHTML = '<p class="log-empty">Henüz gol yok</p>'
    } else {
      logEl.innerHTML = goals.map(e =>
        `<div class="summary-item gol-item">
           ⚽ ${e.minute}' — ${e.text}
         </div>`
      ).join('')
    }
  }
}

export function buildFulltimeScreen() {
  const state = getState()
  const t     = state.teams
  const s     = state.stats
  const so    = state.shootout

  _set('ft-team0-name', t[0].name)
  _set('ft-team1-name', t[1].name)
  _set('ft-score0',     t[0].score)
  _set('ft-score1',     t[1].score)

  // Sonuç metni
  const resEl = document.getElementById('fulltime-result-text')
  if (resEl) {
    if (state.phase === 'penalty-shootout' || so?.round >= so?.maxRounds) {
      const winner = so.scores[0] > so.scores[1] ? t[0].name : t[1].name
      resEl.textContent = `🥅 ${winner} Penaltılarda Kazandı! (${so.scores[0]}–${so.scores[1]})`
    } else if (t[0].score > t[1].score) {
      resEl.textContent = `🏆 ${t[0].name} Kazandı!`
    } else if (t[1].score > t[0].score) {
      resEl.textContent = `🏆 ${t[1].name} Kazandı!`
    } else {
      resEl.textContent = `🤝 Beraberlik!`
    }
  }

  // İstatistikler
  const statsEl = document.getElementById('fulltime-stats-content')
  if (statsEl) {
    statsEl.innerHTML = `
      <table class="stats-table">
        <thead>
          <tr>
            <th class="home-col">${t[0].name}</th>
            <th class="stat-label"></th>
            <th class="away-col">${t[1].name}</th>
          </tr>
        </thead>
        <tbody>
          ${_row(s[0].goals,       s[1].goals,       'Gol'          )}
          ${_row(s[0].fouls,       s[1].fouls,       'Faul'         )}
          ${_row(s[0].yellowCards, s[1].yellowCards,  'Sarı Kart'    )}
          ${_row(s[0].redCards,    s[1].redCards,     'Kırmızı Kart' )}
          ${_row(s[0].corners,     s[1].corners,      'Korner'       )}
          ${_row(s[0].penalties,   s[1].penalties,    'Penaltı'      )}
        </tbody>
      </table>
    `
  }

  // Maçın Adamı
  const motm = calcMotm(state)
  const motmEl = document.getElementById('fulltime-motm')
  if (motmEl) {
    if (motm) {
      const posIcon = { K:'🧤', D:'🛡️', OS:'⚙️', F:'🔥' }[motm.pos] || '⚽'
      motmEl.innerHTML = `
        <div class="motm-card">
          <div class="motm-label">⭐ MAÇIN ADAMI</div>
          <div class="motm-name">${posIcon} ${motm.name}</div>
          <div class="motm-team">${motm.teamName} — ${motm.goals} Gol</div>
        </div>
      `
    } else {
      motmEl.innerHTML = `<div class="motm-card motm-empty">Bu maçta gol olmadı</div>`
    }
  }

  // Log
  const logEl = document.getElementById('fulltime-log')
  if (logEl) {
    const events = state.log.filter(e => ['gol','kart','sari'].includes(e.type))
    if (events.length === 0) {
      logEl.innerHTML = '<p class="log-empty">Önemli olay kaydedilmedi</p>'
    } else {
      logEl.innerHTML = events.map(e => {
        const icon = e.type === 'gol' ? '⚽' : e.type === 'kart' ? '🟥' : '🟨'
        return `<div class="summary-item ${e.type}-item">${icon} ${e.minute}' — ${e.text}</div>`
      }).join('')
    }
  }
}

function _row(v0, v1, label) {
  const h0 = v0 > v1 ? 'winner' : ''
  const h1 = v1 > v0 ? 'winner' : ''
  return `<tr>
    <td class="home-col ${h0}">${v0}</td>
    <td class="stat-label">${label}</td>
    <td class="away-col ${h1}">${v1}</td>
  </tr>`
}

function _set(id, val) {
  const el = document.getElementById(id)
  if (el) el.textContent = val
}