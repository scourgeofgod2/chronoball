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
  const chronoCard = document.querySelector('.chrono-card')

  resultEl.textContent = title
  resultEl.className   = `action-result ${cssType}`

  playerEl.innerHTML = playerLabel
    ? `<span class="action-player-name">${playerLabel}</span><span class="action-player-detail">${subtitle}</span>`
    : subtitle

  panel.style.display   = 'flex'

  panel.classList.remove('pop-in')
  void panel.offsetWidth
  panel.classList.add('pop-in')

  // Kronometreyi sadece "devam butonu beklerken" gizle
  if (chronoCard) {
    if (showContinue) {
      chronoCard.classList.add('is-hidden')
    } else {
      chronoCard.classList.remove('is-hidden')
    }
  }
}

export function hideAction() {
  const panel      = document.getElementById('action-panel')
  const chronoCard = document.querySelector('.chrono-card')

  if (panel) panel.style.display = 'none'

  // Kronometreyi her durumda geri getir
  if (chronoCard) {
    chronoCard.classList.remove('is-hidden')
    chronoCard.style.display = '' // eski inline style'ı da temizle
  }
}