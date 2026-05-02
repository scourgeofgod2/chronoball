// ============================================================
//  ChronoBall — Lig Merkezi (League Hub)
// ============================================================

import { getLeagueState, setLeagueState } from '../state/leagueState.js'
import { setState, getState, createPlayer } from '../state/gameState.js'
import { showScreen } from './screens.js'
import { chronoReset } from '../engine/chrono.js'
import { updateMatchUI } from './scoreboard.js'
import { renderPlayersStatus } from './players.js'
import { setPullPhase } from '../engine/match.js'
import { setChronoHint } from './chronoHint.js'

// ── Lig Hub Başlatma ────────────────────────────────────────
export function initLeagueHub() {
  const ls = getLeagueState()
  renderHubWeek(ls)
  renderStandings(ls)
  renderFixtures(ls)
}

function renderHubWeek(ls) {
  const el = document.getElementById('hub-week-display')
  if (el) {
    if (ls.currentWeek > 14) {
      el.textContent = '🏆 LİG BİTTİ!'
      el.style.background = 'var(--gold)'
      el.style.color = '#000'
    } else {
      el.textContent = `HAFTA ${ls.currentWeek} / 14`
    }
  }
}

// ── Puan Durumu ─────────────────────────────────────────────
function renderStandings(ls) {
  const tbody = document.getElementById('league-standings-body')
  if (!tbody) return

  const sorted = [...ls.standings].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points
    if (b.gd !== a.gd) return b.gd - a.gd
    return b.gf - a.gf
  })

  let html = ''
  sorted.forEach((s, i) => {
    const isUser = s.id === 0
    html += `
      <tr style="${isUser ? 'background: rgba(255,215,0,0.12); font-weight: 700;' : ''}">
        <td style="text-align:left; padding: 6px 4px;">${i + 1}</td>
        <td style="text-align:left; padding: 6px 4px;">${isUser ? '⭐ ' : ''}${s.name}</td>
        <td style="text-align:center; padding: 6px 4px;">${s.played}</td>
        <td style="text-align:center; padding: 6px 4px;">${s.won}</td>
        <td style="text-align:center; padding: 6px 4px;">${s.drawn}</td>
        <td style="text-align:center; padding: 6px 4px;">${s.lost}</td>
        <td style="text-align:center; padding: 6px 4px;">${s.gd >= 0 ? '+' : ''}${s.gd}</td>
        <td style="text-align:center; padding: 6px 4px; font-weight: 800; color: var(--gold);">${s.points}</td>
      </tr>
    `
  })
  tbody.innerHTML = html
}

// ── Fikstür (Bu Haftaki Maçlar) ─────────────────────────────
function renderFixtures(ls) {
  const container = document.getElementById('league-fixtures-container')
  if (!container) return

  const weekIdx = ls.currentWeek - 1
  if (weekIdx >= ls.schedule.length) {
    container.innerHTML = '<div style="text-align:center; color: var(--gold); font-weight: 800; padding: 20px;">🏆 Tüm maçlar tamamlandı!</div>'
    updatePlayButton(true)
    return
  }

  const weekMatches = ls.schedule[weekIdx]
  let html = ''

  weekMatches.forEach(m => {
    const homeTeam = ls.teams.find(t => t.id === m.home)
    const awayTeam = ls.teams.find(t => t.id === m.away)
    if (!homeTeam || !awayTeam) return

    const isUserMatch = m.home === 0 || m.away === 0

    if (m.played && m.result) {
      html += `
        <div style="display:flex; align-items:center; justify-content:space-between; padding: 10px 14px;
                    background: ${isUserMatch ? 'rgba(255,215,0,0.1)' : 'var(--surface-2)'};
                    border: ${isUserMatch ? '1px solid var(--gold)' : 'var(--border)'};
                    border-radius: 8px;">
          <span style="font-weight:700; flex:1;">${homeTeam.name}</span>
          <span style="font-weight:900; font-size:1.2rem; padding: 0 12px; color: var(--gold);">${m.result.home} - ${m.result.away}</span>
          <span style="font-weight:700; flex:1; text-align:right;">${awayTeam.name}</span>
        </div>
      `
    } else {
      html += `
        <div style="display:flex; align-items:center; justify-content:space-between; padding: 10px 14px;
                    background: ${isUserMatch ? 'rgba(255,215,0,0.08)' : 'var(--surface-2)'};
                    border: ${isUserMatch ? '2px solid var(--gold)' : 'var(--border)'};
                    border-radius: 8px;">
          <span style="font-weight:700; flex:1;">${homeTeam.name}</span>
          <span style="font-size:0.75rem; color: var(--ink-3); padding: 0 8px; white-space:nowrap;">
            ${isUserMatch ? '⚽ SENİN MAÇIN' : '🤖 Bot Maçı'}
          </span>
          <span style="font-weight:700; flex:1; text-align:right;">${awayTeam.name}</span>
        </div>
      `
    }
  })

  container.innerHTML = html
  updatePlayButton(weekIdx >= ls.schedule.length)
}

function updatePlayButton(leagueOver) {
  const btn = document.querySelector('#screen-league-hub .btn-cta')
  if (!btn) return

  const ls = getLeagueState()
  const weekIdx = ls.currentWeek - 1

  if (leagueOver || weekIdx >= ls.schedule.length) {
    btn.textContent = '🏆 Lig Sona Erdi'
    btn.disabled = true
    return
  }

  const weekMatches = ls.schedule[weekIdx]
  const allPlayed = weekMatches.every(m => m.played)

  if (allPlayed) {
    btn.textContent = '➡️ Sonraki Haftaya Geç'
    btn.onclick = () => advanceWeek()
    btn.disabled = false
  } else {
    btn.textContent = '⚽ MAÇA ÇIK'
    btn.onclick = () => playLeagueMatch()
    btn.disabled = false
  }
}

// ── Haftayı İlerlet ─────────────────────────────────────────
function advanceWeek() {
  const ls = getLeagueState()
  ls.currentWeek++
  setLeagueState(ls)
  initLeagueHub()
}

// ── Bot Simülasyonu ─────────────────────────────────────────
function simulateBotMatch(homeTeam, awayTeam) {
  const teamPower = (team) => {
    const players = team.players
    if (!players || players.length === 0) return 60
    const sum = players.reduce((acc, p) => {
      const r = p.ratings || {}
      return acc + ((r.sho || 50) + (r.def || 50) + (r.pac || 50)) / 3
    }, 0)
    return sum / players.length
  }

  const homePow = teamPower(homeTeam) * 1.05 // Ev avantajı
  const awayPow = teamPower(awayTeam)
  const total = homePow + awayPow

  const totalGoals = Math.floor(Math.random() * 5 + Math.random() * 3)
  const homeRatio = homePow / total

  let homeGoals = 0
  let awayGoals = 0
  for (let i = 0; i < totalGoals; i++) {
    if (Math.random() < homeRatio) homeGoals++
    else awayGoals++
  }

  return { home: homeGoals, away: awayGoals }
}

// ── Puan Tablosu Güncelle ───────────────────────────────────
function updateStandings(homeId, awayId, homeGoals, awayGoals) {
  const ls = getLeagueState()
  const home = ls.standings.find(s => s.id === homeId)
  const away = ls.standings.find(s => s.id === awayId)
  if (!home || !away) return

  home.played++; away.played++
  home.gf += homeGoals; home.ga += awayGoals; home.gd = home.gf - home.ga
  away.gf += awayGoals; away.ga += homeGoals; away.gd = away.gf - away.ga

  if (homeGoals > awayGoals) {
    home.won++; home.points += 3
    away.lost++
  } else if (homeGoals < awayGoals) {
    away.won++; away.points += 3
    home.lost++
  } else {
    home.drawn++; home.points++
    away.drawn++; away.points++
  }
  setLeagueState(ls)
}

// ── Maça Çık (Ana Fonksiyon) ─────────────────────────────────
export function playLeagueMatch() {
  const ls = getLeagueState()
  const weekIdx = ls.currentWeek - 1
  if (weekIdx >= ls.schedule.length) return

  const weekMatches = ls.schedule[weekIdx]

  // Bot maçlarını önce simüle et
  weekMatches.forEach(m => {
    if (m.played) return
    if (m.home === 0 || m.away === 0) return

    const homeTeam = ls.teams.find(t => t.id === m.home)
    const awayTeam = ls.teams.find(t => t.id === m.away)
    if (!homeTeam || !awayTeam) return

    const result = simulateBotMatch(homeTeam, awayTeam)
    m.played = true
    m.result = result
    updateStandings(m.home, m.away, result.home, result.away)
  })

  setLeagueState(ls)

  // Kullanıcı maçını bul
  const userMatch = weekMatches.find(m => (m.home === 0 || m.away === 0) && !m.played)

  if (!userMatch) {
    // Bu haftaki kullanıcı maçı zaten bitti ya da yok
    initLeagueHub()
    return
  }

  const userIsHome = userMatch.home === 0
  const userTeam = ls.teams.find(t => t.id === 0)
  const opponentTeam = ls.teams.find(t => t.id === (userIsHome ? userMatch.away : userMatch.home))

  if (!userTeam || !opponentTeam) return

  // Oyuncuları ratings ile oluştur
  const buildTeamWithRatings = (leagueTeam) => {
    const players = leagueTeam.players.map(p =>
      createPlayer(p.name, p.pos, p.ratings)
    )
    return {
      name: leagueTeam.name,
      goalDigit: leagueTeam.goalDigit !== undefined ? leagueTeam.goalDigit : 7,
      score: 0,
      players,
    }
  }

  const homeGameTeam = buildTeamWithRatings(userIsHome ? userTeam : opponentTeam)
  const awayGameTeam = buildTeamWithRatings(userIsHome ? opponentTeam : userTeam)

  // userTeamIndex: ev sahibi ise 0, deplasman ise 1
  const userTeamIndex = userIsHome ? 0 : 1

  setState({
    phase: 'first-half',
    activeTeam: 0,
    turCount: 0,
    gameMode: 'league',
    userTeamIndex,
    teams: [homeGameTeam, awayGameTeam],
    log: [],
    stats: {
      0: { goals: 0, yellowCards: 0, redCards: 0, penalties: 0, corners: 0, fouls: 0 },
      1: { goals: 0, yellowCards: 0, redCards: 0, penalties: 0, corners: 0, fouls: 0 },
    },
    tactics: {
      0: (userIsHome ? userTeam : opponentTeam).tactic || 'balance',
      1: (userIsHome ? opponentTeam : userTeam).tactic || 'balance',
    },
    shootout: { scores: [0, 0], round: 0, maxRounds: 5 },
    _leagueMatch: {
      weekIdx,
      matchIdx: weekMatches.indexOf(userMatch),
      homeId: userMatch.home,
      awayId: userMatch.away,
      userIsHome,
    },
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

// ── Lig Modunda Maç Bitti — Hub'a Dön ───────────────────────
export function returnToLeagueHub() {
  const gs = getState()
  const ls = getLeagueState()

  if (!gs._leagueMatch) {
    showScreen('league-hub')
    initLeagueHub()
    return
  }

  const { weekIdx, matchIdx, homeId, awayId } = gs._leagueMatch
  const homeGoals = gs.teams[0].score
  const awayGoals = gs.teams[1].score

  // Sonucu kaydet
  const match = ls.schedule[weekIdx][matchIdx]
  if (!match.played) {
    match.played = true
    match.result = { home: homeGoals, away: awayGoals }
    updateStandings(homeId, awayId, homeGoals, awayGoals)
  }

  setLeagueState(ls)
  showScreen('league-hub')
  initLeagueHub()
}

// Global erişim
window.playLeagueMatch = playLeagueMatch
window.returnToLeagueHub = returnToLeagueHub