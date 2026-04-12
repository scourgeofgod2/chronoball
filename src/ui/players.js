// ============================================================
//  ChronoBall — Config & Maç Oyuncu UI
// ============================================================

import { getState }       from '../state/gameState.js'
import { PRESET_TEAMS }   from '../data/presetTeams.js'
import { randomNames }    from '../engine/actions.js'

const POSITIONS = ['K', 'D', 'OS', 'F']
const POS_LABELS = { K: '🧤K', D: '🛡️D', OS: '⚙️OS', F: '🔥F' }

// ── Config: Oyuncu Input + Pozisyon Seçici ───────────────────
export function buildPlayerInputs() {
  ;[0, 1].forEach(t => {
    const container = document.getElementById(`team${t}-players`)
    if (!container) return
    container.innerHTML = ''

    for (let i = 0; i < 10; i++) {
      // Varsayılan pozisyon: 0→K, 1–4→D, 5–7→OS, 8–9→F
      const defaultPos = i === 0 ? 'K' : i <= 4 ? 'D' : i <= 7 ? 'OS' : 'F'
      const row = document.createElement('div')
      row.className = 'player-row'
      row.innerHTML = `
        <span class="player-number">${i}</span>
        <input type="text" id="team${t}-player${i}" class="input player-name-input"
               placeholder="Oyuncu ${i}" maxlength="22" autocomplete="off" />
        <select id="team${t}-player${i}-pos" class="select pos-select">
          ${POSITIONS.map(p =>
            `<option value="${p}" ${p === defaultPos ? 'selected' : ''}>${POS_LABELS[p]}</option>`
          ).join('')}
        </select>
      `
      container.appendChild(row)
    }
  })
}

// ── Hazır Takım Seçildi ──────────────────────────────────────
export function applyPreset(teamIdx) {
  const sel  = document.getElementById(`team${teamIdx}-preset`)
  const key  = sel?.value
  if (!key || key === '__custom__') return

  const preset = PRESET_TEAMS[key]
  if (!preset) return

  // Takım adı
  const nameInput = document.getElementById(`team${teamIdx}-name`)
  if (nameInput) nameInput.value = key

  // Gol rakamı
  const goalSel = document.getElementById(`team${teamIdx}-goal-digit`)
  if (goalSel) goalSel.value = preset.goalDigit

  // Oyuncu isimleri + pozisyonlar
  preset.players.forEach((p, i) => {
    const inp    = document.getElementById(`team${teamIdx}-player${i}`)
    const posSel = document.getElementById(`team${teamIdx}-player${i}-pos`)
    if (inp)    inp.value    = typeof p === 'string' ? p : p.name
    if (posSel) posSel.value = typeof p === 'string' ? 'OS' : (p.pos || 'OS')
  })
}

// ── Rastgele Doldur ──────────────────────────────────────────
export function randomFill(teamIdx) {
  const names = randomNames()
  for (let i = 0; i < 10; i++) {
    const inp = document.getElementById(`team${teamIdx}-player${i}`)
    if (inp) inp.value = names[i] || `Oyuncu ${i}`
    // Pozisyonu değiştirme — varsayılanı kalsın
  }
}

// ── Maç Ekranı: Oyuncu Durum Kartları ───────────────────────
export function renderPlayersStatus() {
  const state = getState()
  ;[0, 1].forEach(teamIdx => {
    const container = document.getElementById(`players-status-${teamIdx}`)
    if (!container) return
    container.innerHTML = ''
    const team = state.teams[teamIdx]
    team.players.forEach((player, digit) => {
      const div = document.createElement('div')
      let cls = 'player-badge'
      if (player.redCard)              cls += ' red-card'
      else if (player.yellowCards >= 1) cls += ' yellow-card'
      div.className = cls
      const posIcon = { K:'🧤', D:'🛡️', OS:'⚙️', F:'🔥' }[player.pos] || '⚽'
      div.innerHTML = `<span class="pnum">${digit}</span><span class="ppos">${posIcon}</span><span class="pname">${player.name}</span>`
      container.appendChild(div)
    })
  })
}

// ── Aktif Oyuncu Vurgula ─────────────────────────────────────
export function highlightPlayer(teamIdx, digit) {
  document.querySelectorAll('.player-badge').forEach(el => el.classList.remove('active'))
  const container = document.getElementById(`players-status-${teamIdx}`)
  if (!container) return
  const items = container.querySelectorAll('.player-badge')
  if (items[digit]) items[digit].classList.add('active')
}

// ── Hazır Takım <select> Opsiyonları ─────────────────────────
export function buildPresetOptions() {
  ;[0, 1].forEach(t => {
    const sel = document.getElementById(`team${t}-preset`)
    if (!sel) return
    sel.innerHTML = '<option value="__custom__">✏️ Özel Takım</option>'
    Object.keys(PRESET_TEAMS).forEach(key => {
      const opt = document.createElement('option')
      opt.value = key
      opt.textContent = key
      sel.appendChild(opt)
    })
  })
}