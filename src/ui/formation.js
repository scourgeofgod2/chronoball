// ============================================================
//  ChronoBall — Formasyon Seçici
//  10 oyuncu için formasyon şablonları (oyuncu 0 = Kaleci)
// ============================================================

// Her formasyon: [pos0, pos1, ..., pos9]
// pos0 her zaman 'K' (Kaleci)
export const FORMATIONS = {
  '5-3-1': ['K', 'D','D','D','D','D', 'OS','OS','OS', 'F'],
  '4-4-1': ['K', 'D','D','D','D', 'OS','OS','OS','OS', 'F'],
  '4-3-2': ['K', 'D','D','D','D', 'OS','OS','OS', 'F','F'],
  '3-4-2': ['K', 'D','D','D', 'OS','OS','OS','OS', 'F','F'],
  '4-2-3': ['K', 'D','D','D','D', 'OS','OS', 'F','F','F'],
  '3-3-3': ['K', 'D','D','D', 'OS','OS','OS', 'F','F','F'],
  '2-3-4': ['K', 'D','D', 'OS','OS','OS', 'F','F','F','F'],
}

export const FORMATION_LABELS = {
  '5-3-1': '🛡️🛡️ 5-3-1 (Tam Defans)',
  '4-4-1': '🛡️  4-4-1 (Savunma)',
  '4-3-2': '⚖️  4-3-2 (Dengeli)',
  '3-4-2': '⚙️  3-4-2 (Orta Saha)',
  '4-2-3': '⚔️  4-2-3 (Hücum)',
  '3-3-3': '🔥  3-3-3 (Tam Hücum)',
  '2-3-4': '🔥🔥 2-3-4 (Ultra Hücum)',
}

/**
 * Seçilen formasyona göre takımın oyuncu pozisyon select'lerini günceller.
 * @param {number} teamIdx - 0 veya 1
 */
export function applyFormation(teamIdx) {
  const sel = document.getElementById(`team${teamIdx}-formation`)
  if (!sel) return
  const formation = sel.value
  const positions = FORMATIONS[formation]
  if (!positions) return

  for (let i = 0; i < 10; i++) {
    const posEl = document.getElementById(`team${teamIdx}-player${i}-pos`)
    if (posEl) {
      posEl.value = positions[i]
    }
  }

  // Görsel taktik tahtasını güncelle
  _renderFormationBoard(teamIdx, positions)
}

/**
 * Formasyon tahtası görseli oluşturur (emoji bazlı mini saha).
 */
function _renderFormationBoard(teamIdx, positions) {
  const boardEl = document.getElementById(`team${teamIdx}-formation-board`)
  if (!boardEl) return

  // Satırlar: K | D grubu | OS grubu | F grubu
  const rows = {
    K:  positions.filter(p => p === 'K').length,
    D:  positions.filter(p => p === 'D').length,
    OS: positions.filter(p => p === 'OS').length,
    F:  positions.filter(p => p === 'F').length,
  }

  const makeRow = (emoji, count, label) => {
    if (count === 0) return ''
    return `<div class="fb-row">
      <span class="fb-label">${label}</span>
      <span class="fb-players">${emoji.repeat(count)}</span>
    </div>`
  }

  boardEl.innerHTML = `
    <div class="formation-board">
      ${makeRow('🔥', rows.F,  'F')}
      ${makeRow('⚙️', rows.OS, 'OS')}
      ${makeRow('🛡️', rows.D,  'D')}
      ${makeRow('🧤', rows.K,  'K')}
    </div>
  `
}

/**
 * Config ekranına formasyon seçicileri enjekte eder.
 * players.js buildPlayerInputs() çağrısından sonra çalışmalı.
 */
export function buildFormationSelectors() {
  for (let t = 0; t < 2; t++) {
    const container = document.getElementById(`team${t}-formation-container`)
    if (!container) continue

    let opts = ''
    for (const [key, label] of Object.entries(FORMATION_LABELS)) {
      const sel = key === '4-3-2' ? ' selected' : ''
      opts += `<option value="${key}"${sel}>${label}</option>`
    }

    container.innerHTML = `
      <div class="cfg-formation-group">
        <label class="field-label">FORMASYON</label>
        <select id="team${t}-formation" class="select select-sm"
                onchange="applyFormation(${t})">
          ${opts}
        </select>
        <div id="team${t}-formation-board" class="formation-board-wrap"></div>
      </div>
    `

    // Varsayılan formasyonu uygula
    applyFormation(t)
  }
}