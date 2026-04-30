// ============================================================
//  ChronoBall — Ana Giriş Noktası (main.js)
// ============================================================

import { setState, createTeam }       from './state/gameState.js'
import {
  chronoInit, chronoStart, chronoStop,
  chronoReset, isRunning, getLastDigit,
}                                      from './engine/chrono.js'
import {
  pullPhase, setPullPhase,
  processDigit,
  continueAction as _continueAction,
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
import { applyFormation as _applyFormation, buildFormationSelectors } from './ui/formation.js'
import { buildShareCard }              from './ui/resultScreens.js'

// ── Kronometre tick → DOM ────────────────────────────────────
chronoInit(
  // tickCallback: (displayText, running, countdownSecs)
  (displayText, running, countdownSecs) => {
    const disp = document.getElementById('chrono-display')
    if (!disp) return
    disp.textContent = displayText
    if (running) disp.classList.add('running')
    else         disp.classList.remove('running')

    // Geri sayım uyarısı
    const hint   = document.getElementById('chrono-hint')
    const btnTxt = document.getElementById('btn-pull-text')
    if (running && countdownSecs !== null && countdownSecs <= 5) {
      if (hint) {
        hint.textContent = `⚠️ ${countdownSecs} saniye — DURDUR!`
        hint.classList.add('hint-warning')
      }
      if (btnTxt) btnTxt.textContent = `🛑 DURDUR! (${countdownSecs})`
    } else if (running && countdownSecs !== null) {
      if (hint) hint.classList.remove('hint-warning')
    } else if (!running) {
      if (hint) hint.classList.remove('hint-warning')
    }
  },
  // autoStopCallback: 12 saniye dolunca otomatik durdur
  () => {
    const btnTxt = document.getElementById('btn-pull-text')
    if (btnTxt) btnTxt.textContent = '⚽ ÇEK!'
    const hint = document.getElementById('chrono-hint')
    if (hint) hint.classList.remove('hint-warning')
    // chrono.js zaten durdurdu — elapsed son değerde, getLastDigit() hazır
    processDigit(getLastDigit())
  }
)

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
    tactics: { 0: tactic0, 1: tactic1 },
    shootout: { scores:[0,0], round:0, maxRounds:5 },
  })

  setPullPhase('player')
  chronoReset()
  showScreen('match')
  updateMatchUI(1)
  renderPlayersStatus()
  setChronoHint('player')
}

window.handlePull = function () {
  if (pullPhase === 'waiting') return

  const btnTxt = document.getElementById('btn-pull-text')

  if (isRunning()) {
    const digit = chronoStop()
    const disp  = document.getElementById('chrono-display')
    if (disp) disp.classList.remove('running')
    if (btnTxt) btnTxt.textContent = '⚽ ÇEK!'
    processDigit(digit)
  } else {
    if (pullPhase === 'player') hideAction()
    if (btnTxt) btnTxt.textContent = '🛑 DURDUR!'
    chronoStart()
  }
}

window.continueAction = function () {
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

window.newMatch = function () {
  chronoReset()
  _newMatch()
  buildPlayerInputs()
  buildPresetOptions()
  buildFormationSelectors()
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

window.shareResult = async function () {
  await buildShareCard()
}

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
    if (pullPhase === 'waiting') _continueAction()
  }
})