// ============================================================
//  ChronoBall — Formasyon Seçici
//  10 oyuncu için formasyon şablonları (oyuncu 0 = Kaleci)
//  Görsel: CSS mini saha + çizgiler + oyuncu noktaları
// ============================================================

// Her formasyon: [pos0..pos9]  — pos0 her zaman 'K'
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
  '4-4-1': '🛡️ 4-4-1 (Savunma)',
  '4-3-2': '⚖️ 4-3-2 (Dengeli)',
  '3-4-2': '⚙️ 3-4-2 (Orta Saha)',
  '4-2-3': '⚔️ 4-2-3 (Hücum)',
  '3-3-3': '🔥 3-3-3 (Tam Hücum)',
  '2-3-4': '🔥🔥 2-3-4 (Ultra Hücum)',
}

// Taktik → Varsayılan Formasyon
export const TACTIC_FORMATION = {
  defense: '4-4-1',
  balance: '4-3-2',
  attack:  '3-3-3',
}

/**
 * Taktik seçilince otomatik formasyon uygula.
 * @param {number} teamIdx
 */
export function applyTacticFormation(teamIdx) {
  const tacticSel = document.getElementById(`team${teamIdx}-tactic`)
  const formSel   = document.getElementById(`team${teamIdx}-formation`)
  if (!tacticSel || !formSel) return

  const tactic    = tacticSel.value
  const formation = TACTIC_FORMATION[tactic] || '4-3-2'
  formSel.value   = formation
  applyFormation(teamIdx)
}

/**
 * Seçilen formasyona göre takımın oyuncu pozisyon select'lerini günceller.
 * @param {number} teamIdx
 */
export function applyFormation(teamIdx) {
  const sel = document.getElementById(`team${teamIdx}-formation`)
  if (!sel) return
  const formation = sel.value
  const positions = FORMATIONS[formation]
  if (!positions) return

  // Forvet limiti kontrolü (max 5)
  const fCount = positions.filter(p => p === 'F').length
  if (fCount > 5) {
    alert(`⚠️ Maksimum 5 forvet olabilir (şu an ${fCount} forvet var). Lütfen başka bir formasyon seçin.`)
    // Varsayılan formasyona geri dön
    sel.value = '4-3-2'
    applyFormation(teamIdx)
    return
  }

  // Oyuncu pozisyon select'lerini güncelle
  for (let i = 0; i < 10; i++) {
    const posSel = document.getElementById(`team${teamIdx}-player${i}-pos`)
    if (posSel) {
      posSel.value = positions[i]
      // Formasyona bağlı kaldığı için disabled yapıyoruz
      posSel.disabled = true
      posSel.style.opacity = '0.7'
      posSel.style.cursor = 'not-allowed'
    }
  }

  _renderFormationPitch(teamIdx, positions, formation)
}

/**
 * CSS tabanlı görsel mini saha — çizgiler + oyuncu noktaları
 */
function _renderFormationPitch(teamIdx, positions, formation) {
  const boardEl = document.getElementById(`team${teamIdx}-formation-board`)
  if (!boardEl) return

  // Satır başına oyuncu sayısı
  const rows = {
    K:  positions.filter(p => p === 'K').length,
    D:  positions.filter(p => p === 'D').length,
    OS: positions.filter(p => p === 'OS').length,
    F:  positions.filter(p => p === 'F').length,
  }

  const makePlayerDots = (count, cls) => {
    if (count === 0) return ''
    return Array.from({ length: count }, () =>
      `<span class="fp-dot fp-${cls.toLowerCase()}"></span>`
    ).join('')
  }

  boardEl.innerHTML = `
    <div class="fp-pitch">
      <!-- Gol çizgisi üst -->
      <div class="fp-goal-line"></div>

      <!-- Forvetler -->
      <div class="fp-row fp-row-f">
        ${makePlayerDots(rows.F, 'F')}
      </div>

      <!-- Orta saha -->
      <div class="fp-row fp-row-os">
        ${makePlayerDots(rows.OS, 'OS')}
      </div>

      <!-- Orta çizgi -->
      <div class="fp-midline">
        <div class="fp-midcircle"></div>
      </div>

      <!-- Defans -->
      <div class="fp-row fp-row-d">
        ${makePlayerDots(rows.D, 'D')}
      </div>

      <!-- Kaleci -->
      <div class="fp-row fp-row-k">
        ${makePlayerDots(rows.K, 'K')}
        <div class="fp-goalbox"></div>
      </div>
    </div>
    <div class="fp-label">${formation}</div>
  `
}

/**
 * Config ekranına formasyon seçicileri enjekte eder.
 * buildPlayerInputs() çağrısından sonra çalışmalı.
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

    const defaultFormation = '4-3-2'
    const defaultPositions = FORMATIONS[defaultFormation]
    _renderFormationPitch(t, defaultPositions, defaultFormation)
  }
}