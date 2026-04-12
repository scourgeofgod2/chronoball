// ============================================================
//  ChronoBall — Skor & Dakika Güncelleme
//  Aktif takım: topbar border + side panel vurgusu + pill rengi
// ============================================================

import { getState } from '../state/gameState.js'

export function updateMatchUI(minute = 1) {
  const state     = getState()
  const isFirst   = state.phase === 'first-half'
  const halfLabel = isFirst ? '1. YARI' : '2. YARI'

  _set('match-minute',     `${minute}. DAKİKA`)
  _set('match-half',       halfLabel)
  _set('match-team0-name', state.teams[0].name)
  _set('match-team1-name', state.teams[1].name)
  _set('active-team-name', state.teams[state.activeTeam].name)
  _set('panel-title-0',    state.teams[0].name)
  _set('panel-title-1',    state.teams[1].name)

  updateScoreboard()
  _updateActiveTeamColor(state.activeTeam)
}

export function updateScoreboard() {
  const state = getState()
  _set('score0', state.teams[0].score)
  _set('score1', state.teams[1].score)
}

// ── Aktif takım görsel güncellemeleri ───────────────────────
function _updateActiveTeamColor(activeTeam) {
  // 1. Topbar border
  const topbar = document.getElementById('match-topbar')
  if (topbar) {
    topbar.classList.remove('topbar-home-active', 'topbar-away-active')
    topbar.classList.add(activeTeam === 0 ? 'topbar-home-active' : 'topbar-away-active')
  }

  // 2. Side panel vurgusu (active-turn class)
  const homePanel = document.querySelector('.home-panel')
  const awayPanel = document.querySelector('.away-panel')
  if (homePanel) homePanel.classList.toggle('active-turn', activeTeam === 0)
  if (awayPanel) awayPanel.classList.toggle('active-turn', activeTeam === 1)

  // 3. Active-team pill rengi
  const pill = document.getElementById('active-team-bar')
  if (pill) {
    pill.classList.remove('home-active', 'away-active')
    pill.classList.add(activeTeam === 0 ? 'home-active' : 'away-active')
  }

  // 4. Çek butonu tonu
  const btn = document.getElementById('btn-pull')
  if (btn) {
    btn.classList.remove('second-pull')
    if (activeTeam === 1) btn.classList.add('second-pull')
  }
}

function _set(id, value) {
  const el = document.getElementById(id)
  if (el) el.textContent = value
}