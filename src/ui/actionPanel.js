// ============================================================
//  ChronoBall — Aksiyon Paneli
//  Oyuncu adı büyük, aksiyon bilgisi altında gösterilir
// ============================================================

/**
 * @param {string} title      - Aksiyon başlığı (örn. "⚽ GOL!")
 * @param {string} subtitle   - Alt bilgi (oyuncu adı + dakika)
 * @param {string} cssType    - gol | kart | sari | normal
 * @param {boolean} showContinue - Devam butonu göster?
 * @param {string} [playerLabel] - Ayrı büyük oyuncu adı (opsiyonel)
 */
export function showAction(title, subtitle, cssType, showContinue, playerLabel = '') {
  const panel      = document.getElementById('action-panel')
  const resultEl   = document.getElementById('action-result')
  const playerEl   = document.getElementById('action-player')
  const btnCont    = document.getElementById('btn-continue')

  resultEl.textContent    = title
  resultEl.className      = `action-result ${cssType}`
  playerEl.innerHTML      = playerLabel
    ? `<span class="action-player-name">${playerLabel}</span><span class="action-player-detail">${subtitle}</span>`
    : subtitle
  btnCont.style.display   = showContinue ? 'inline-flex' : 'none'
  panel.style.display     = 'flex'
  panel.classList.remove('pop-in')
  void panel.offsetWidth  // reflow
  panel.classList.add('pop-in')
}

export function hideAction() {
  const panel = document.getElementById('action-panel')
  if (panel) panel.style.display = 'none'
}