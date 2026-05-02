// ============================================================
//  ChronoBall — Lig Draft (Transfer) Ekranı
// ============================================================

import { PLAYERS_DB } from '../data/playersDB.js'
import { FORMATIONS } from './formation.js'
import { startLeague } from '../state/leagueState.js'
import { showScreen } from './screens.js'

let budget = 10.0
let selectedPlayers = new Array(10).fill(null) // Seçili oyuncuların objeleri
let currentFilter = 'ALL'

// Draft ekranı açıldığında
export function initDraftScreen() {
  budget = 10.0
  selectedPlayers = new Array(10).fill(null)
  
  // Formation değerini alıp slotları çiz
  renderDraftSlots()
  renderMarket()
  updateBudgetDisplay()
  checkDraftComplete()
}

// Seçilen formasyona göre 10 kişilik boş kadro slotları
export function renderDraftSlots() {
  const formationSel = document.getElementById('draft-formation')
  const formation = formationSel ? formationSel.value : '4-3-2'
  const positions = FORMATIONS[formation]

  // Eğer mevcut seçili oyunculardan yeni formasyona uymayan varsa, onları sat
  for (let i = 0; i < 10; i++) {
    const p = selectedPlayers[i]
    if (p && p.pos !== positions[i]) {
      budget += p.price
      selectedPlayers[i] = null
    }
  }
  updateBudgetDisplay()

  const container = document.getElementById('draft-slots-container')
  if (!container) return

  let html = ''
  for (let i = 0; i < 10; i++) {
    const reqPos = positions[i]
    const p = selectedPlayers[i]

    if (p) {
      html += `
        <div style="display: flex; align-items: center; justify-content: space-between; padding: 10px 14px; background: var(--surface-2); border: var(--border); border-radius: 8px;">
          <div style="display: flex; align-items: center; gap: 10px;">
            <span style="font-weight: 800; font-size: 0.8rem; background: var(--surface-3); padding: 4px 8px; border-radius: 4px;">${reqPos}</span>
            <span style="font-weight: 700; color: var(--ink);">${p.name}</span>
            <span style="font-size: 0.75rem; color: var(--ink-3);">SHO:${p.ratings.sho} DEF:${p.ratings.def}</span>
          </div>
          <div style="display: flex; align-items: center; gap: 10px;">
            <span style="font-weight: 700; color: var(--gold);">${p.price.toFixed(1)} M</span>
            <button class="btn btn-sm btn-ghost" style="height: 28px; padding: 0 10px; color: var(--c-red);" onclick="window.sellPlayer(${i})">X</button>
          </div>
        </div>
      `
    } else {
      html += `
        <div style="display: flex; align-items: center; padding: 10px 14px; background: transparent; border: 1px dashed var(--border-color); border-radius: 8px; opacity: 0.7;">
          <span style="font-weight: 800; font-size: 0.8rem; background: var(--surface-2); padding: 4px 8px; border-radius: 4px; margin-right: 10px;">${reqPos}</span>
          <span style="font-size: 0.85rem; font-style: italic; color: var(--ink-3);">Oyuncu seçilmedi...</span>
        </div>
      `
    }
  }
  container.innerHTML = html

  renderMarket() // Filtreyi uydurmak için
  checkDraftComplete()
}

// Oyuncu Satın Alma
window.buyPlayer = function(playerId) {
  const p = PLAYERS_DB.find(x => x.id === playerId)
  if (!p) return

  // Bütçe kontrolü
  if (budget < p.price) {
    alert('Bütçe yetersiz!')
    return
  }

  // Uygun slot bul
  const formationSel = document.getElementById('draft-formation')
  const formation = formationSel ? formationSel.value : '4-3-2'
  const positions = FORMATIONS[formation]

  // Bu mevkiye ait boş slot var mı?
  let emptySlotIdx = -1
  for (let i = 0; i < 10; i++) {
    if (positions[i] === p.pos && !selectedPlayers[i]) {
      emptySlotIdx = i
      break
    }
  }

  if (emptySlotIdx === -1) {
    alert(`Takımında boş ${p.pos} mevkisi kalmadı!`)
    return
  }

  // Satın al
  budget -= p.price
  selectedPlayers[emptySlotIdx] = p
  
  updateBudgetDisplay()
  renderDraftSlots()
}

// Oyuncu Satma
window.sellPlayer = function(slotIdx) {
  const p = selectedPlayers[slotIdx]
  if (!p) return

  budget += p.price
  selectedPlayers[slotIdx] = null

  updateBudgetDisplay()
  renderDraftSlots()
}

function updateBudgetDisplay() {
  const el = document.getElementById('draft-budget')
  if (el) {
    el.textContent = `Bütçe: ${budget.toFixed(1)} M`
  }
}

// Market Listesi
window.filterMarket = function(pos) {
  currentFilter = pos
  const lbl = document.getElementById('market-filter-label')
  if (lbl) lbl.textContent = pos === 'ALL' ? 'Tümü' : pos
  renderMarket()
}

export function renderMarket() {
  const container = document.getElementById('market-players-container')
  if (!container) return

  let html = ''

  // Seçili oyuncuları id listesi olarak al
  const selectedIds = selectedPlayers.filter(p => p !== null).map(p => p.id)

  const filtered = PLAYERS_DB.filter(p => {
    if (selectedIds.includes(p.id)) return false // Zaten kadroda
    if (currentFilter !== 'ALL' && p.pos !== currentFilter) return false
    return true
  }).sort((a, b) => b.price - a.price)

  filtered.forEach(p => {
    const isAffordable = budget >= p.price
    html += `
      <div style="display: flex; align-items: center; justify-content: space-between; padding: 12px 14px; background: var(--surface); border: var(--border); border-radius: 8px; ${!isAffordable ? 'opacity:0.5;' : ''}">
        <div style="display: flex; flex-direction: column; gap: 4px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-weight: 900; font-size: 0.75rem; color: var(--ink-2);">${p.pos}</span>
            <span style="font-weight: 700; color: var(--ink);">${p.name}</span>
          </div>
          <div style="font-size: 0.65rem; color: var(--ink-3); display: flex; gap: 6px;">
            <span>SHO:${p.ratings.sho}</span>
            <span>DEF:${p.ratings.def}</span>
            <span>GK:${p.ratings.gk}</span>
          </div>
        </div>
        <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 6px;">
          <span style="font-weight: 800; color: var(--gold); font-size: 0.9rem;">${p.price.toFixed(1)} M</span>
          <button class="btn btn-sm" style="height: 26px; font-size: 0.7rem; padding: 0 12px; background: ${isAffordable ? 'var(--home)' : 'var(--ink-4)'}; color: #fff;" 
                  ${!isAffordable ? 'disabled' : ''} onclick="window.buyPlayer('${p.id}')">AL</button>
        </div>
      </div>
    `
  })

  container.innerHTML = html
}

function checkDraftComplete() {
  const isComplete = selectedPlayers.every(p => p !== null)
  const btn = document.getElementById('btn-complete-draft')
  if (btn) {
    btn.disabled = !isComplete
  }
}

// ── DRAFT BİTİR ──────────────────────────────────────────────
window.completeDraft = function() {
  if (!selectedPlayers.every(p => p !== null)) return

  const teamName = document.getElementById('draft-team-name').value.trim() || 'Benim Takım'
  const formation = document.getElementById('draft-formation').value
  const tactic = document.getElementById('draft-tactic').value

  // Oyuncuları formata dönüştür {name, pos, ratings}
  const squad = selectedPlayers.map(p => ({
    name: p.name,
    pos: p.pos,
    ratings: { ...p.ratings }
  }))

  startLeague(teamName, formation, tactic, squad, 7) // goalDigit varsayılan 7 yapalım, veya config eklenebilir

  // Lig merkezini aç
  import('./leagueHub.js').then(hub => {
    hub.initLeagueHub()
    showScreen('league-hub')
  })
}

// HTML onchange/onclick fonksiyonlarını global'e asıyoruz ki DOM içinden çağrılabilsin
window.renderDraftSlots = renderDraftSlots
