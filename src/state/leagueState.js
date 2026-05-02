// ============================================================
//  ChronoBall — Lig Modu State & Fikstür Yönetimi
// ============================================================

import { createPlayer } from './gameState.js'
import { randomNames } from '../engine/actions.js'

export function createInitialLeagueState() {
  return {
    isActive: false,
    currentWeek: 1,
    budget: 10.0,        // Kullanıcıya başlangıçta verilen bütçe (Milyon $)
    userTeamName: '',
    userFormation: '4-3-2',
    userTactic: 'balance',
    userSquad: [],       // Kullanıcının satın aldığı oyuncu objeleri (ya da ID'leri)
    teams: [],           // 8 takım objesi (0: kullanıcı, 1-7: botlar)
    schedule: [],        // 14 haftalık fikstür (her hafta maç listesi içerir)
    standings: [],       // Puan tablosu: id, O, G, B, M, AG, YG, AV, P
  }
}

let _leagueState = createInitialLeagueState()

export function getLeagueState()  { return _leagueState }
export function setLeagueState(s) { _leagueState = s }

// ── RASTGELE BOT TAKIM ÜRETİMİ ───────────────────────────────
const BOT_TEAM_NAMES = [
  'Kızıl Yıldız', 'Demirspor', 'Zümrüt İY', 'Kuzey Fırtınası',
  'Anadolu Kaplanları', 'Efsaneler Birliği', 'Bozkır SK', 'Körfez Gücü',
  'Şahinler FK', 'Panterler', 'Pars SK', 'Denizciler', 'Korsanlar',
  'Rüzgar SK', 'Güneşspor', 'Dağcılar', 'Kutup Ayıları', 'Yıldızlar', 'Kızıltepe', 'Altınova'
]

// Rastgele bir formasyon döndürür
function getRandomFormation() {
  const forms = ['5-3-1', '4-4-1', '4-3-2', '3-4-2', '4-2-3', '3-3-3', '2-3-4']
  return forms[Math.floor(Math.random() * forms.length)]
}

// Bot takımı oluşturur — nameSlice: bu takıma ait örtüşmeyen isim dilimi
export function generateBotTeam(id, name, nameSlice) {
  const formation = getRandomFormation()
  const tactics = ['attack', 'balance', 'defense']
  const tactic = tactics[Math.floor(Math.random() * tactics.length)]
  
  const powerMult = 0.8 + Math.random() * 0.4

  const formMap = {
    '5-3-1': ['K', 'D','D','D','D','D', 'OS','OS','OS', 'F'],
    '4-4-1': ['K', 'D','D','D','D', 'OS','OS','OS','OS', 'F'],
    '4-3-2': ['K', 'D','D','D','D', 'OS','OS','OS', 'F','F'],
    '3-4-2': ['K', 'D','D','D', 'OS','OS','OS','OS', 'F','F'],
    '4-2-3': ['K', 'D','D','D','D', 'OS','OS', 'F','F','F'],
    '3-3-3': ['K', 'D','D','D', 'OS','OS','OS', 'F','F','F'],
    '2-3-4': ['K', 'D','D', 'OS','OS','OS', 'F','F','F','F'],
  }
  const positions = formMap[formation]
  
  const players = positions.map((pos, idx) => {
    // Mevkiye göre taban istatistikler
    const baseAtk = pos === 'F' ? 78 : (pos === 'OS' ? 60 : (pos === 'D' ? 30 : 12))
    const baseDef = pos === 'K' ? 80 : (pos === 'D' ? 78 : (pos === 'OS' ? 55 : 22))
    const baseMid = pos === 'OS' ? 72 : (pos === 'D' ? 55 : (pos === 'F' ? 45 : 35))
    // FK ve PEN: mevkiden bağımsız biraz rastgele — sürpriz uzmanlıklar çıkabilir
    const baseFk  = 30 + Math.floor(Math.random() * 50)
    const basePen = 35 + Math.floor(Math.random() * 50)

    const calcStat = (base) => Math.min(99, Math.max(10, Math.floor(base * powerMult + (Math.random() * 14 - 7))))

    return createPlayer(nameSlice[idx] || `Oyuncu ${idx + 1}`, pos, {
      atk: calcStat(baseAtk),
      def: calcStat(baseDef),
      mid: calcStat(baseMid),
      fk:  baseFk,
      pen: basePen,
    })
  })

  return {
    id,
    name,
    isBot: true,
    formation,
    tactic,
    players,
    goalDigit: Math.floor(Math.random() * 10)
  }
}

// ── LİG OLUŞTURMA (DRAFT SONRASI ÇAĞRILACAK) ────────────────
export function startLeague(userTeamName, userFormation, userTactic, userPlayers, goalDigit) {
  const state = getLeagueState()
  state.isActive = true
  state.currentWeek = 1
  state.userTeamName = userTeamName
  state.userFormation = userFormation
  state.userTactic = userTactic

  // 1. Takımlar
  // Kullanıcı takımı (id: 0)
  const userTeam = {
    id: 0,
    name: userTeamName,
    isBot: false,
    formation: userFormation,
    tactic: userTactic,
    players: userPlayers, // Seçilmiş oyuncular objesi
    goalDigit: goalDigit
  }
  
  state.teams.push(userTeam)

  // Bot takımları (id: 1-7) - 7 ayrı takım için örtüşmeyen isim havuzları
  const shuffledBotNames = [...BOT_TEAM_NAMES].sort(() => Math.random() - 0.5)
  // 7 takım × 10 oyuncu = 70 isim gerekli; randomNames() ~60+ üretiyor, tekrar kullanarak tamamla
  const allPlayerNames = randomNames()
  // Yeterli isim yoksa havuzu shuffle edip ek isimler ekle
  while (allPlayerNames.length < 70) {
    const extra = randomNames()
    for (const n of extra) {
      if (!allPlayerNames.includes(n)) allPlayerNames.push(n)
      if (allPlayerNames.length >= 70) break
    }
  }
  for (let i = 1; i <= 7; i++) {
    const slice = allPlayerNames.slice((i - 1) * 10, i * 10)
    state.teams.push(generateBotTeam(i, shuffledBotNames[i - 1], slice))
  }

  // Puan Tablosu Başlangıcı
  state.standings = state.teams.map(t => ({
    id: t.id,
    name: t.name,
    played: 0,
    won: 0,
    drawn: 0,
    lost: 0,
    gf: 0, // atılan
    ga: 0, // yenilen
    gd: 0, // averaj
    points: 0
  }))

  // 2. Fikstür Oluşturma (Round Robin - 8 Takım = 7 Hafta, Rövanşlı = 14 Hafta)
  state.schedule = generateFixtures(state.teams.map(t => t.id))
  
  setLeagueState(state)
}

// ── ROUND ROBIN FİKSTÜR ALGORİTMASI ─────────────────────────
function generateFixtures(teamIds) {
  const numTeams = teamIds.length // 8
  const numWeeks = numTeams - 1   // 7 hafta ilk yarı
  const schedule = []

  let ids = [...teamIds]

  for (let w = 0; w < numWeeks; w++) {
    const weekMatches = []
    for (let i = 0; i < numTeams / 2; i++) {
      const home = ids[i]
      const away = ids[numTeams - 1 - i]
      
      // İlk hafta home-away dengesini sağlamak için dönüşümlü atama
      if (w % 2 !== 0 && i === 0) {
        weekMatches.push({ home: away, away: home, played: false, result: null })
      } else {
        weekMatches.push({ home, away, played: false, result: null })
      }
    }
    schedule.push(weekMatches)

    // Diziyi kaydır (İlk eleman sabit kalır)
    const last = ids.pop()
    ids.splice(1, 0, last)
  }

  // 2. Yarı (Rövanşlar)
  const secondHalf = schedule.map(week => 
    week.map(match => ({ home: match.away, away: match.home, played: false, result: null }))
  )

  return [...schedule, ...secondHalf] // Toplam 14 hafta
}
