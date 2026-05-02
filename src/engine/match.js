// ============================================================
//  ChronoBall — Maç Akış Motoru
//  v4: Bilateral taktik, defans kalitesi, yorumcu sistemi,
//      uzatma devresi (extra-time)
// ============================================================

import { getState }    from '../state/gameState.js'
import {
  ACTIONS,
  calcGoalMult,
  calcFreekickNearMult,
  calcFreekickFarMult,
  calcFreekickMult,
  calcPenaltyMult,
  goalDigitsFromMult,
  pickCommentary,
} from './actions.js'
import { calcMinute, chronoStart, chronoStop, getLastDigit, isRunning } from './chrono.js'
import { sounds, playCommentary } from '../utils/audio.js'
import { renderPlayersStatus, highlightPlayer } from '../ui/players.js'
import { showAction, hideAction }  from '../ui/actionPanel.js'
import { addLog }                  from '../ui/log.js'
import { updateMatchUI }           from '../ui/scoreboard.js'
import { showScreen }              from '../ui/screens.js'
import { setChronoHint }           from '../ui/chronoHint.js'
import { saveMatch }               from '../utils/storage.js'
import { triggerAnimation }        from '../ui/animations.js'
import { buildHalftimeScreen, buildFulltimeScreen } from '../ui/resultScreens.js'

// ── Çekim fazı ──────────────────────────────────────────────
export let pullPhase      = 'player'
export let selectedPlayer = null
export let selectedAction = null
export let currentMinute  = 1

let _shootoutTeam      = 0
let _shootoutRound     = 0
let _autoContinueTimer = null

const AUTO_SKIP_MS = 3000

export function setPullPhase(p) {
  pullPhase = p
  _clearAutoContinue()
  
  if (p === 'waiting' || p === 'action' || p === 'third') {
    chronoStop()
    return
  }
}

function _clearAutoContinue() {
  if (_autoContinueTimer !== null) {
    clearTimeout(_autoContinueTimer)
    _autoContinueTimer = null
  }
}

/** Dışarıdan timer'ı iptal etmek için (manuel devam butonunda) */
export function cancelAutoContinue() {
  _clearAutoContinue()
}

// ── Çekim işle ─────────────────────────────────────────────
export function processDigit(digit) {
  currentMinute = calcMinute(getState().phase)
  if (pullPhase === 'player')   return _processPlayer(digit)
  if (pullPhase === 'action')   return _processAction(digit)
  if (pullPhase === 'third')    return _processThird(digit)
  if (pullPhase === 'shootout') return _processShootout(digit)
}

// ── AŞAMA 1: Oyuncu ─────────────────────────────────────────
function _processPlayer(digit) {
  const state   = getState()
  const teamIdx = state.activeTeam
  const team    = state.teams[teamIdx]
  const player  = team.players[digit]

  if (player.redCard) {
    showAction(
      `❌ Kırmızı Kartlı Oyuncu`,
      `Sıra ${state.teams[1 - teamIdx].name}'a geçti`,
      'kart', true, `${player.name} (#${digit})`
    )
    addLog(currentMinute, teamIdx, digit, 'skip', `${player.name} sahada yok`)
    setPullPhase('waiting')
    setChronoHint('waiting')
    return
  }

  selectedPlayer = { digit, name: player.name, pos: player.pos || 'OS' }
  setPullPhase('action')
  highlightPlayer(teamIdx, digit)
  sounds.click()

  const posBadge = _posBadge(player.pos)
  showAction(
    `👤 Oyuncu Seçildi`,
    `${team.name} — aksiyonu belirlemek için tekrar çek!`,
    'normal', false,
    `${posBadge} ${player.name} (#${digit})`
  )
  setChronoHint('action')
}

// ── AŞAMA 2: Aksiyon ────────────────────────────────────────
function _processAction(digit) {
  const state      = getState()
  const teamIdx    = state.activeTeam
  const defTeamIdx = 1 - teamIdx
  const action     = ACTIONS[digit]

  selectedAction = { digit, ...action }
  const pLabel   = `${_posBadge(selectedPlayer.pos)} ${selectedPlayer.name} (#${selectedPlayer.digit})`
  const atkTactic = state.tactics[teamIdx]        || 'balance'
  const defTactic = state.tactics[defTeamIdx]     || 'balance'
  const defTeam   = state.teams[defTeamIdx]

  switch (action.type) {
    case 'gol':
      _scoreGoal(teamIdx, selectedPlayer.digit)
      break

    case 'sari':
      _giveYellowCard(teamIdx, selectedPlayer.digit)
      break

    case 'kirmizi':
      _giveRedCard(teamIdx, selectedPlayer.digit)
      break

    case 'faul': {
      state.stats[teamIdx].fouls++
      sounds.card()
      const foulComment = pickCommentary('foul')
      playCommentary('foul')
      showAction(`🦵 Faul`, `${currentMinute}' — ${foulComment}`, 'normal', true, pLabel)
      addLog(currentMinute, teamIdx, selectedPlayer.digit, 'normal', `Faul — ${selectedPlayer.name}`)
      setPullPhase('waiting')
      setChronoHint('waiting')
      break
    }

    case 'penalty': {
      sounds.click()
      state.stats[teamIdx].penalties++
      const _atkPlayer = state.teams[teamIdx].players[selectedPlayer.digit]
      const pm = calcPenaltyMult(selectedPlayer.pos, atkTactic, defTactic, defTeam, _atkPlayer)
      const penaltyComment = pickCommentary('action_penalty')
      playCommentary('action_penalty')
      showAction(
        `🎯 Penaltı!`,
        `${currentMinute}' — ${penaltyComment} Gol şansı: ${_chanceLabel(pm)} — Tekrar çek!`,
        'normal', false, pLabel
      )
      setPullPhase('third')
      setChronoHint('third')
      break
    }

    case 'freekick-near': {
      sounds.click()
      const nm = calcFreekickNearMult(selectedPlayer.pos, atkTactic, defTactic, defTeam)
      const fkNearComment = pickCommentary('action_freekick_near')
      playCommentary('action_freekick_near')
      showAction(
        `🌀 Yakın Frikik!`,
        `${currentMinute}' — ${fkNearComment} Gol şansı: ${_chanceLabel(nm)} — Tekrar çek!`,
        'normal', false, pLabel
      )
      triggerAnimation('freekick', teamIdx === 0 ? 'home' : 'away')
      setPullPhase('third')
      setChronoHint('third')
      break
    }

    case 'freekick-far': {
      sounds.click()
      const fm = calcFreekickFarMult(selectedPlayer.pos, atkTactic, defTactic, defTeam)
      const fkFarComment = pickCommentary('action_freekick_far')
      playCommentary('action_freekick_far')
      showAction(
        `🚩 Uzak Frikik`,
        `${currentMinute}' — ${fkFarComment} Gol şansı: ${_chanceLabel(fm)} — Tekrar çek!`,
        'normal', false, pLabel
      )
      triggerAnimation('freekick', teamIdx === 0 ? 'home' : 'away')
      setPullPhase('third')
      setChronoHint('third')
      break
    }

    case 'freekick': {
      sounds.click()
      const gm = calcFreekickMult(selectedPlayer.pos, atkTactic, defTactic, defTeam)
      const fkComment = pickCommentary('action_freekick')
      playCommentary('action_freekick')
      showAction(
        `⚡ Serbest Vuruş!`,
        `${currentMinute}' — ${fkComment} Gol şansı: ${_chanceLabel(gm)} — Tekrar çek!`,
        'normal', false, pLabel
      )
      setPullPhase('third')
      setChronoHint('third')
      break
    }

    case 'corner': {
      sounds.click()
      state.stats[teamIdx].corners++
      const cm = calcGoalMult(selectedPlayer.pos, atkTactic, defTactic, defTeam)
      const cornerComment = pickCommentary('action_corner')
      playCommentary('action_corner')
      showAction(
        `📐 Korner!`,
        `${currentMinute}' — ${cornerComment} Gol şansı: ${_chanceLabel(cm)} — Tekrar çek!`,
        'normal', false, pLabel
      )
      setPullPhase('third')
      setChronoHint('third')
      break
    }

    case 'normal': {
      const offComment = pickCommentary('offside')
      playCommentary('offside')
      showAction(`${action.icon} ${action.name}`, `${currentMinute}' — ${offComment}`, 'normal', true, pLabel)
      addLog(currentMinute, teamIdx, selectedPlayer.digit, 'normal',
             `${action.name} — ${selectedPlayer.name}`)
      setPullPhase('waiting')
      setChronoHint('waiting')
      break
    }

    default:
      showAction(`${action.icon} ${action.name}`, `${currentMinute}. dakika`, 'normal', true, pLabel)
      addLog(currentMinute, teamIdx, selectedPlayer.digit, 'normal',
             `${action.name} — ${selectedPlayer.name}`)
      setPullPhase('waiting')
      setChronoHint('waiting')
  }
}

// ── AŞAMA 3: Sonuç ──────────────────────────────────────────
function _processThird(digit) {
  const state      = getState()
  const teamIdx    = state.activeTeam
  const defTeamIdx = 1 - teamIdx
  const team       = state.teams[teamIdx]
  const aType      = selectedAction.type
  const atkTactic  = state.tactics[teamIdx]    || 'balance'
  const defTactic  = state.tactics[defTeamIdx] || 'balance'
  const defTeam    = state.teams[defTeamIdx]
  const pLabel     = `${_posBadge(selectedPlayer.pos)} ${selectedPlayer.name} (#${selectedPlayer.digit})`

  let mult, isGoal, label, icon, commentKey

  const _atkPlayerObj = state.teams[teamIdx].players[selectedPlayer.digit]
  const _gMode = state.gameMode || 'quick'

  if (aType === 'penalty') {
    mult       = calcPenaltyMult(selectedPlayer.pos, atkTactic, defTactic, defTeam, _atkPlayerObj, _gMode)
    isGoal     = goalDigitsFromMult(mult).includes(digit)
    label      = 'Penaltıdan'
    icon       = '🎯'
    commentKey = isGoal ? 'goal_penalty' : 'miss_penalty'
  } else if (aType === 'freekick-near') {
    mult       = calcFreekickNearMult(selectedPlayer.pos, atkTactic, defTactic, defTeam, _atkPlayerObj, _gMode)
    isGoal     = goalDigitsFromMult(mult).includes(digit)
    label      = 'Yakın Frikikten'
    icon       = '🌀'
    commentKey = isGoal ? 'goal_freekick' : 'miss_freekick'
  } else if (aType === 'freekick-far') {
    mult       = calcFreekickFarMult(selectedPlayer.pos, atkTactic, defTactic, defTeam, _atkPlayerObj, _gMode)
    isGoal     = goalDigitsFromMult(mult).includes(digit)
    label      = 'Uzak Frikikten'
    icon       = '🚩'
    commentKey = isGoal ? 'goal_freekick' : 'miss_freekick'
  } else if (aType === 'freekick') {
    mult       = calcFreekickMult(selectedPlayer.pos, atkTactic, defTactic, defTeam, _atkPlayerObj, _gMode)
    isGoal     = goalDigitsFromMult(mult).includes(digit)
    label      = 'Serbest Vuruştan'
    icon       = '⚡'
    commentKey = isGoal ? 'goal_freekick' : 'miss_freekick'
  } else {
    // corner
    mult       = calcGoalMult(selectedPlayer.pos, atkTactic, defTactic, defTeam, _atkPlayerObj, _gMode)
    isGoal     = goalDigitsFromMult(mult).includes(digit)
    label      = 'Kornerden'
    icon       = '📐'
    commentKey = isGoal ? 'goal_corner' : 'miss_corner'
  }

  const commentary = pickCommentary(commentKey)
  playCommentary(commentKey)

  if (isGoal) {
    team.score++
    team.players[selectedPlayer.digit].goals++
    state.stats[teamIdx].goals++
    sounds.goal()
    showAction(`⚽ ${label} GOL!`, `${currentMinute}' — ${commentary}`, 'gol', true, pLabel)
    triggerAnimation('goal', teamIdx === 0 ? 'home' : 'away')
    addLog(currentMinute, teamIdx, selectedPlayer.digit, 'gol',
           `${label} GOL! — ${selectedPlayer.name}`)
    _flashScore(teamIdx)
    triggerAnimation('goal', teamIdx === 0 ? 'home' : 'away')
    renderPlayersStatus()
  } else {
    sounds.miss()
    showAction(`${icon} Gol Yok`, `${currentMinute}' — ${commentary}`, 'normal', true, pLabel)
    addLog(currentMinute, teamIdx, selectedPlayer.digit, 'normal',
           `${label} gol yok — ${selectedPlayer.name} (${digit})`)
  }

  setPullPhase('waiting')
  setChronoHint('waiting')
}

// ── PENALTI ATIŞLARI ─────────────────────────────────────────
export function startShootout() {
  const state = getState()
  state.phase = 'penalty-shootout'
  _shootoutTeam  = 0
  _shootoutRound = 0
  state.shootout = { scores:[0,0], round:0, maxRounds:5 }

  document.getElementById('match-log').innerHTML = ''
  showScreen('match')
  updateMatchUI(120)

  setPullPhase('shootout')
  setChronoHint('player')
  showAction(
    `🥅 Penaltı Atışları Başlıyor!`,
    `${state.teams[0].name} ilk atıyor`,
    'normal', false,
    `Her takım 5 atış yapar`
  )
}

function _processShootout(digit) {
  const state   = getState()
  const so      = state.shootout
  const teamIdx = _shootoutTeam
  const team    = state.teams[teamIdx]
  const isGoal  = digit <= 4

  if (isGoal) {
    so.scores[teamIdx]++
    sounds.goal()
    const goalComment = pickCommentary('goal_penalty')
    playCommentary('goal_penalty', 1200)
    showAction(
      `⚽ GOL! (${so.scores[0]}–${so.scores[1]})`,
      `Atış ${Math.floor(so.round) + 1} — ${goalComment}`,
      'gol', true
    )
    addLog(120, teamIdx, 0, 'gol', `Penaltı atışı GOL — ${team.name}`)
    _flashScore(teamIdx)
    triggerAnimation('goal', teamIdx === 0 ? 'home' : 'away')
  } else {
    sounds.miss()
    const missComment = pickCommentary('miss_penalty')
    playCommentary('miss_penalty')
    showAction(
      `🥅 Kaçtı! (${so.scores[0]}–${so.scores[1]})`,
      `Atış ${Math.floor(so.round) + 1} — ${missComment}`,
      'normal', true
    )
    addLog(120, teamIdx, 0, 'normal', `Penaltı atışı kaçtı — ${team.name}`)
  }

  if (_shootoutTeam === 0) {
    _shootoutTeam = 1
  } else {
    _shootoutTeam = 0
    _shootoutRound++
    so.round++
  }

  const [s0, s1] = so.scores
  const remaining = so.maxRounds - so.round
  const earlyDecide = remaining < so.maxRounds && Math.abs(s0 - s1) > remaining

  if (so.round >= so.maxRounds || earlyDecide) {
    setPullPhase('waiting')
    setChronoHint('waiting')
    return
  }

  setPullPhase('shootout')
  setChronoHint('player')
}

// ── GOL (direkt) ──────────────────────────────────────────────
function _scoreGoal(teamIdx, playerDigit) {
  const state  = getState()
  const team   = state.teams[teamIdx]
  const player = team.players[playerDigit]
  const pLabel = `${_posBadge(player.pos)} ${player.name} (#${playerDigit})`

  team.score++
  player.goals++
  state.stats[teamIdx].goals++
  sounds.goal()

  const commentary = pickCommentary('goal_direct')
  playCommentary('goal_direct', 1200)
  showAction(`⚽ GOL!`, `${currentMinute}' — ${commentary}`, 'gol', true, pLabel)
  addLog(currentMinute, teamIdx, playerDigit, 'gol', `GOL! — ${player.name}`)
  _flashScore(teamIdx)
  triggerAnimation('goal', teamIdx === 0 ? 'home' : 'away')
  renderPlayersStatus()
  setPullPhase('waiting')
  setChronoHint('waiting')
}

// ── KARTLAR ──────────────────────────────────────────────────
function _giveYellowCard(teamIdx, playerDigit) {
  const state  = getState()
  const player = state.teams[teamIdx].players[playerDigit]
  const pLabel = `${_posBadge(player.pos)} ${player.name} (#${playerDigit})`

  player.yellowCards++
  state.stats[teamIdx].yellowCards++

  if (player.yellowCards >= 2 && !player.redCard) {
    player.redCard = true
    state.stats[teamIdx].redCards++
    sounds.card()  // 2. sarı = kırmızı → düdük çalar
    const redComment = pickCommentary('card_red')
    playCommentary('card_red')
    showAction(`🟨🟥 2. Sarı = Kırmızı!`, `${currentMinute}' — ${redComment}`, 'kart', true, pLabel)
    addLog(currentMinute, teamIdx, playerDigit, 'kart', `2. Sarı → Kırmızı — ${player.name}`)
  } else {
    // Düz sarı kartta düdük çalmaz
    const yellowComment = pickCommentary('card_yellow')
    playCommentary('card_yellow')
    showAction(`🟨 Sarı Kart`, `${currentMinute}' — ${yellowComment}`, 'sari', true, pLabel)
    addLog(currentMinute, teamIdx, playerDigit, 'sari', `Sarı Kart — ${player.name}`)
  }

  renderPlayersStatus()
  setPullPhase('waiting')
  setChronoHint('waiting')
}

function _giveRedCard(teamIdx, playerDigit) {
  const state  = getState()
  const player = state.teams[teamIdx].players[playerDigit]
  const pLabel = `${_posBadge(player.pos)} ${player.name} (#${playerDigit})`

  player.redCard = true
  state.stats[teamIdx].redCards++
  sounds.card()

  const redComment = pickCommentary('card_red')
  playCommentary('card_red')
  showAction(`🟥 Kırmızı Kart!`, `${currentMinute}' — ${redComment}`, 'kart', true, pLabel)
  addLog(currentMinute, teamIdx, playerDigit, 'kart', `Kırmızı Kart — ${player.name}`)
  renderPlayersStatus()
  setPullPhase('waiting')
  setChronoHint('waiting')
}

// ── MAÇIN ADAMI ──────────────────────────────────────────────
export function calcMotm(state) {
  let best = null
  let bestScore = -Infinity

  state.teams.forEach((team, teamIdx) => {
    team.players.forEach((player, digit) => {
      if (player.redCard) return  // Kırmızı kartlı oyuncu aday olamaz
      const score = player.goals * 3
                  - player.yellowCards * 1
      // En az 1 puan olan ya da golcü olan oyuncular aday
      if (score > bestScore && (player.goals > 0 || score > 0)) {
        bestScore = score
        best = { name: player.name, pos: player.pos, goals: player.goals,
                 teamName: team.name, teamIdx, digit }
      }
    })
  })
  return best
}

// ── YARDIMCILAR ──────────────────────────────────────────────
function _flashScore(teamIdx) {
  const state = getState()
  const el0   = document.getElementById('score0')
  const el1   = document.getElementById('score1')
  if (el0) el0.textContent = state.teams[0].score
  if (el1) el1.textContent = state.teams[1].score

  const id = teamIdx === 0 ? 'score0' : 'score1'
  const el = document.getElementById(id)
  if (!el) return
  el.classList.remove('score-flash')
  void el.offsetWidth
  el.classList.add('score-flash')
  setTimeout(() => el.classList.remove('score-flash'), 600)
}

function _posBadge(pos) {
  return { K:'🧤', D:'🛡️', OS:'⚙️', F:'🔥' }[pos] || '⚽'
}

function _chanceLabel(mult) {
  const pct = Math.round(mult * 100)
  if (pct >= 70) return `Yüksek (%${pct})`
  if (pct >= 45) return `Orta (%${pct})`
  return `Düşük (%${pct})`
}

// ── DEVAM ────────────────────────────────────────────────────
export function continueAction() {
  hideAction()
  const state = getState()

  if (state.phase === 'penalty-shootout') {
    const so = state.shootout
    if (so.round >= so.maxRounds || so.scores[0] !== so.scores[1]) {
      goToFulltime()
    }
    return
  }

  state.activeTeam = 1 - state.activeTeam
  state.turCount++

  if (state.phase === 'first-half' && currentMinute >= 45 && state.turCount >= 5) {
    goToHalftime(); return
  }
  if (state.phase === 'second-half' && currentMinute >= 90 && state.turCount >= 5) {
    if (state.teams[0].score === state.teams[1].score) {
      goToExtraTimeBreak(1); return  // Uzatma 1. yarısı
    }
    goToFulltime(); return
  }
  if (state.phase === 'extra-time-1' && currentMinute >= 105 && state.turCount >= 3) {
    goToExtraTimeBreak(2); return  // Uzatma 2. yarısı
  }
  if (state.phase === 'extra-time-2' && currentMinute >= 120 && state.turCount >= 3) {
    if (state.teams[0].score === state.teams[1].score) {
      startShootout(); return
    }
    goToFulltime(); return
  }

  selectedPlayer = null
  selectedAction = null
  setPullPhase('player')
  setChronoHint('player')
  updateMatchUI(currentMinute)

  // Lig modunda bot tur otomasyonu
  _maybeBotTurn()
}

// ── BOT TUR OTOMASYONU ────────────────────────────────────────
function _setBotPullLock(locked) {
  const btn = document.getElementById('btn-pull')
  if (!btn) return
  if (locked) {
    btn.disabled = true
    btn.style.opacity = '0.4'
    btn.style.cursor = 'not-allowed'
  } else {
    btn.disabled = false
    btn.style.opacity = ''
    btn.style.cursor = ''
  }
}

function _maybeBotTurn() {
  const state = getState()
  if (state.gameMode !== 'league') return
  const userIdx = (typeof state.userTeamIndex === 'number') ? state.userTeamIndex : 0
  if (state.activeTeam === userIdx) {
    _setBotPullLock(false)  // Kullanıcı sırası — butonu aç
    return
  }

  // Bot sırası — butonu kapat ve kısa gecikmeyle başlat
  _setBotPullLock(true)
  setTimeout(() => _botStep(), 700)
}

let _botStepTimer = null

function _botStep() {
  const state = getState()
  const userIdx = (typeof state.userTeamIndex === 'number') ? state.userTeamIndex : 0
  if (state.activeTeam === userIdx) return  // Artık kullanıcı sırası, dur

  if (pullPhase === 'player' || pullPhase === 'action' || pullPhase === 'third' || pullPhase === 'shootout') {
    // Kronometre başlat — görsel olarak ilerliyormuş gibi görünsün
    chronoStart()
    // Rastgele 400-900ms arasında bekle, sonra durdur ve son rakamı al
    const holdMs = 400 + Math.floor(Math.random() * 500)
    _botStepTimer = setTimeout(() => {
      const digit = chronoStop()  // Kronometreyi durdur, son rakamı al
      processDigit(digit)
      // Bir sonraki aşama gerekiyorsa devam et
      if (pullPhase === 'action' || pullPhase === 'third') {
        _botStepTimer = setTimeout(() => _botStep(), 600)
      } else if (pullPhase === 'waiting') {
        // Bot turu bitti, otomatik devam et
        _botStepTimer = setTimeout(() => continueAction(), 1200)
      }
    }, holdMs)
  }
}

// ── DEVRE ARASI ───────────────────────────────────────────────
export function goToHalftime() {
  const state = getState()
  state.phase = 'halftime'
  sounds.whistle()
  buildHalftimeScreen()
  showScreen('halftime')
}

export function startSecondHalf() {
  const state      = getState()
  state.phase      = 'second-half'
  state.activeTeam = 1 - state.activeTeam
  state.turCount   = 0
  currentMinute    = 46

  selectedPlayer = null
  selectedAction = null

  document.getElementById('match-log').innerHTML = ''
  showScreen('match')
  updateMatchUI(currentMinute)
  renderPlayersStatus()
  setPullPhase('player')
  setChronoHint('player')
  _maybeBotTurn()
}

// ── UZATMA DEVRESİ ─────────────────────────────────────────────
/**
 * @param {1|2} half - 1 = Uzatma 1. yarısı (90-105'), 2 = Uzatma 2. yarısı (105-120')
 */
export function goToExtraTimeBreak(half) {
  const state = getState()
  sounds.whistle()

  // Extra-time ekranını hazırla
  const t = state.teams
  const _set = (id, val) => {
    const el = document.getElementById(id)
    if (el) el.textContent = val
  }
  _set('et-team0-name', t[0].name)
  _set('et-team1-name', t[1].name)
  _set('et-score0',     t[0].score)
  _set('et-score1',     t[1].score)

  const heading = document.getElementById('extratime-heading')
  const info    = document.getElementById('extratime-info')

  if (half === 1) {
    state.phase = 'extra-time-break-1'
    if (heading) heading.textContent = 'Beraberlik! Uzatma 1. Yarısı Başlıyor'
    if (info)    info.textContent    = '90-105. dakikalar arası oynanacak.'
  } else {
    state.phase = 'extra-time-break-2'
    if (heading) heading.textContent = 'Beraberlik! Uzatma 2. Yarısı Başlıyor'
    if (info)    info.textContent    = '105-120. dakikalar arası oynanacak.'
  }

  showScreen('extratime')
}

export function startExtraTime() {
  const state = getState()
  const isFirstHalf = (state.phase === 'extra-time-break-1')

  state.phase      = isFirstHalf ? 'extra-time-1' : 'extra-time-2'
  state.activeTeam = 1 - state.activeTeam
  state.turCount   = 0
  currentMinute    = isFirstHalf ? 90 : 105

  selectedPlayer = null
  selectedAction = null

  document.getElementById('match-log').innerHTML = ''
  showScreen('match')
  updateMatchUI(currentMinute)
  renderPlayersStatus()
  setPullPhase('player')
  setChronoHint('player')
  _maybeBotTurn()
}

// ── MAÇ SONU ──────────────────────────────────────────────────
export function goToFulltime() {
  const state = getState()
  state.phase = 'fulltime'
  sounds.whistle()
  saveMatch(state)
  buildFulltimeScreen()
  showScreen('fulltime')
}

export function newMatch() {
  _clearAutoContinue()
  pullPhase      = 'player'
  selectedPlayer = null
  selectedAction = null
  currentMinute  = 1
  _shootoutTeam  = 0
  _shootoutRound = 0
  const logEl = document.getElementById('match-log')
  if (logEl) logEl.innerHTML = ''
  hideAction()
  showScreen('config')
}