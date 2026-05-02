// ============================================================
//  ChronoBall — Ana Giriş Noktası (main.js)
// ============================================================

import { setState, getState, createTeam } from './state/gameState.js'
import {
  chronoInit, chronoStart, chronoStop,
  chronoReset, isRunning,
}                                      from './engine/chrono.js'
import {
  pullPhase, setPullPhase,
  processDigit,
  continueAction as _continueAction,
  cancelAutoContinue,
  startSecondHalf as _startSecondHalf,
  startExtraTime as _startExtraTime,
  newMatch as _newMatch,
}                                      from './engine/match.js'
import {
  buildPlayerInputs,
  buildPresetOptions,
  applyPreset as _applyPreset,
  randomFill as _randomFill,
  renderPlayersStatus,
}                                      from './ui/players.js'
import { showScreen, switchTab as _switchTab } from './ui/screens.js'
import { updateMatchUI }               from './ui/scoreboard.js'
import { hideAction }                  from './ui/actionPanel.js'
import { setChronoHint }               from './ui/chronoHint.js'
import { applyFormation as _applyFormation, buildFormationSelectors, applyTacticFormation as _applyTacticFormation } from './ui/formation.js'
import { buildShareCard }              from './ui/resultScreens.js'

// ── Kronometre tick → DOM ────────────────────────────────────
chronoInit((displayText, running) => {
  const disp = document.getElementById('chrono-display')
  if (!disp) return
  disp.textContent = displayText
  if (running) disp.classList.add('running')
  else         disp.classList.remove('running')
})

// ── Config ekranını hazırla ──────────────────────────────────
buildPlayerInputs()
buildPresetOptions()
buildFormationSelectors()

// ══════════════════════════════════════════════════════════════
//  Global Fonksiyonlar (HTML onclick bağlantıları)
// ══════════════════════════════════════════════════════════════

window.startMatch = function () {
  const team0Name = document.getElementById('team0-name').value.trim() || 'Takım 1'
  const team1Name = document.getElementById('team1-name').value.trim() || 'Takım 2'
  const team0Goal = parseInt(document.getElementById('team0-goal-digit').value)
  const team1Goal = parseInt(document.getElementById('team1-goal-digit').value)
  const tactic0   = document.getElementById('team0-tactic')?.value || 'balance'
  const tactic1   = document.getElementById('team1-tactic')?.value || 'balance'

  const buildPlayers = (t) => {
    const list = []
    for (let i = 0; i < 10; i++) {
      const inp = document.getElementById(`team${t}-player${i}`)
      const pos = document.getElementById(`team${t}-player${i}-pos`)
      list.push({
        name: inp?.value.trim()  || `Oyuncu ${i}`,
        pos:  pos?.value?.trim() || 'OS',
      })
    }
    return list
  }

  // ── Forvet Limiti Kontrolü (max 5) ──────────────────────
  for (const t of [0, 1]) {
    const players  = buildPlayers(t)
    const fCount   = players.filter(p => p.pos === 'F').length
    const teamName = t === 0 ? team0Name : team1Name
    if (fCount > 5) {
      alert(`⚠️ ${teamName}: Maksimum 5 forvet olabilir (şu an ${fCount} forvet var).\n\nFormasyonu değiştir veya bazı oyuncuları OS/D pozisyonuna al.`)
      return
    }
  }

  setState({
    phase:      'first-half',
    activeTeam: 0,
    turCount:   0,
    teams: [
      createTeam(team0Name, team0Goal, buildPlayers(0)),
      createTeam(team1Name, team1Goal, buildPlayers(1)),
    ],
    log:  [],
    stats: {
      0: { goals:0, yellowCards:0, redCards:0, penalties:0, corners:0, fouls:0 },
      1: { goals:0, yellowCards:0, redCards:0, penalties:0, corners:0, fouls:0 },
    },
    gameMode: _selectedGameMode,
    tactics: { 0: tactic0, 1: tactic1 },
    shootout: { scores:[0,0], round:0, maxRounds:5 },
  })

  chronoReset()
  showScreen('match')
  updateMatchUI(1)
  renderPlayersStatus()
  setPullPhase('player')
  setChronoHint('player')
  const btnTxt = document.getElementById('btn-pull-text')
  if (btnTxt) btnTxt.textContent = '▶ BAŞLAT'
}

window.handlePull = function () {
  if (pullPhase === 'waiting') {
    _continueAction()
    return
  }

  const btnTxt = document.getElementById('btn-pull-text')
  const disp   = document.getElementById('chrono-display')

  if (isRunning()) {
    if (window.__skipTimer) { clearTimeout(window.__skipTimer); window.__skipTimer = null }
    cancelAutoContinue()
    const digit = chronoStop()
    if (disp) disp.classList.remove('running')

    _flashDigit(digit)

    if (btnTxt) btnTxt.textContent = '⚽ ÇEK!'
    processDigit(digit)
  } else {
    chronoStart()
    if (disp) disp.classList.add('running')
    if (btnTxt) {
      if (pullPhase === 'player' || pullPhase === 'shootout') btnTxt.textContent = '🛑 DURDUR!'
      else if (pullPhase === 'action') btnTxt.textContent = '🛑 DURDUR! (Aksiyon)'
      else if (pullPhase === 'third')  btnTxt.textContent = '🛑 DURDUR! (Sonuç)'
    }
    _startSkipTimer()
  }
}

function _startSkipTimer() {
  cancelAutoContinue()
  const timer = setTimeout(() => {
    if (!isRunning()) return
    chronoStop()
    const disp = document.getElementById('chrono-display')
    if (disp) disp.classList.remove('running')
    _showTurnSkipAnim()
    setTimeout(() => {
      import('./engine/match.js').then(m => m.continueAction())
    }, 1200)
  }, 3000)
  window.__skipTimer = timer
}

function _showTurnSkipAnim() {
  const el = document.getElementById('turn-skip-anim')
  if (!el) return
  el.classList.remove('skip-active')
  void el.offsetWidth
  el.classList.add('skip-active')
  setTimeout(() => el.classList.remove('skip-active'), 1100)
}

function _flashDigit(digit) {
  if (navigator.vibrate) {
    navigator.vibrate(50);
  }
}

window.continueAction = function () {
  cancelAutoContinue()  // Manuel tıklamada timer'ı iptal et
  _continueAction()
}

window.startSecondHalf = function () {
  chronoReset()
  _startSecondHalf()
}

window.startExtraTime = function () {
  chronoReset()
  _startExtraTime()
}

let _selectedGameMode = 'quick'

window.selectGameMode = function (mode) {
  _selectedGameMode = mode
  if (mode === 'quick') {
    showScreen('config')
  } else {
    // Lig Modu -> Draft ekranına geç
    import('./ui/draft.js').then(draft => {
      draft.initDraftScreen()
      showScreen('draft')
    })
  }
}

window.newMatch = function () {
  chronoReset()
  _newMatch()
  buildPlayerInputs()
  buildPresetOptions()
  buildFormationSelectors()
  showScreen('mainmenu')
}

window.applyPreset = function (teamIdx) {
  _applyPreset(teamIdx)
}

window.randomFill = function (teamIdx) {
  _randomFill(teamIdx)
}

window.switchTab = function (tab, btn) {
  _switchTab(tab, btn)
}

window.applyFormation = function (teamIdx) {
  _applyFormation(teamIdx)
}

window.applyTacticFormation = function (teamIdx) {
  _applyTacticFormation(teamIdx)
}

window.shareResult = async function () {
  await buildShareCard()
}

// ══════════════════════════════════════════════════════════════
//  Nasıl Oynanır — Modal
// ══════════════════════════════════════════════════════════════
window.openHowToPlay = function () {
  const overlay = document.getElementById('howto-overlay')
  if (overlay) overlay.classList.add('open')
  document.body.style.overflow = 'hidden'
}

window.closeHowToPlay = function (e) {
  if (e && e.target !== document.getElementById('howto-overlay')) return
  const overlay = document.getElementById('howto-overlay')
  if (overlay) overlay.classList.remove('open')
  document.body.style.overflow = ''
}

// ESC tuşu ile kapat
document.addEventListener('keydown', (e) => {
  if (e.code === 'Escape') {
    const overlay = document.getElementById('howto-overlay')
    if (overlay && overlay.classList.contains('open')) {
      overlay.classList.remove('open')
      document.body.style.overflow = ''
    }
  }
})

// ══════════════════════════════════════════════════════════════
//  Dark Mode Toggle
// ══════════════════════════════════════════════════════════════
window.toggleDark = function () {
  const isDark = document.documentElement.classList.toggle('dark')
  try { localStorage.setItem('cb-dark', isDark ? '1' : '0') } catch (_) {}
}

;(function () {
  try {
    const saved = localStorage.getItem('cb-dark')
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    if (saved === '1' || (saved === null && prefersDark)) {
      document.documentElement.classList.add('dark')
    }
  } catch (_) {}
})()

// ══════════════════════════════════════════════════════════════
//  Klavye Kısayolları
// ══════════════════════════════════════════════════════════════
document.addEventListener('keydown', (e) => {
  const activeScreen = document.querySelector('.screen.active')
  if (!activeScreen || activeScreen.id !== 'screen-match') return

  const tag = document.activeElement?.tagName
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return

  if (e.code === 'Space') {
    e.preventDefault()
    window.handlePull()
  }

  if (e.code === 'Enter') {
    e.preventDefault()
    if (pullPhase === 'waiting') {
      cancelAutoContinue()
      _continueAction()
    }
  }
})