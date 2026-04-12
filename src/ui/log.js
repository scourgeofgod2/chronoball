// ============================================================
//  ChronoBall — Maç Log Render
// ============================================================

import { getState } from '../state/gameState.js'

export function addLog(minute, teamIdx, playerDigit, type, text) {
  const state = getState()
  const entry = { minute, teamIdx, playerDigit, type, text }
  state.log.push(entry)

  const logEl = document.getElementById('match-log')
  if (logEl) logEl.prepend(buildLogItem(entry))
}

export function buildLogItem(entry) {
  const state = getState()

  const typeClass = {
    gol:    'log-gol',
    kart:   'log-kart',
    sari:   'log-sari',
    skip:   'log-skip',
    normal: '',
  }[entry.type] || ''

  const icon = {
    gol:    '⚽',
    kart:   '🟥',
    sari:   '🟨',
    skip:   '✕',
    normal: '›',
  }[entry.type] || '›'

  const teamName = state.teams[entry.teamIdx].name

  const div = document.createElement('div')
  div.className = `log-item ${typeClass}`
  div.innerHTML = `
    <span class="log-minute">${entry.minute}'</span>
    <span class="log-icon">${icon}</span>
    <span class="log-text"><strong>${teamName}</strong> — ${entry.text}</span>
  `
  return div
}