// ============================================================
//  ChronoBall — Kronometre İpucu & Buton Metni
// ============================================================

export function setChronoHint(phase) {
  const hint   = document.getElementById('chrono-hint')
  const btnTxt = document.getElementById('btn-pull-text')
  const btn    = document.getElementById('btn-pull')

  btn.classList.remove('second-pull')

  if (phase === 'player') {
    if (hint) hint.textContent   = 'SPACE veya butona bas → kronometreyi başlat & durdur'
    if (btnTxt) btnTxt.textContent = '⚽ ÇEK! (Oyuncu)'
  } else if (phase === 'action') {
    if (hint) hint.textContent   = '2. Çekim: Aksiyonu belirle — son basamak = aksiyon'
    if (btnTxt) btnTxt.textContent = '⚡ ÇEK! (Aksiyon)'
    btn.classList.add('second-pull')
  } else if (phase === 'third') {
    if (hint) hint.textContent   = '3. Çekim: Gol mu? — son basamak sonucu belirler'
    if (btnTxt) btnTxt.textContent = '🎯 ÇEK! (Sonuç)'
    btn.classList.add('second-pull')
  } else if (phase === 'waiting') {
    if (hint) hint.textContent   = 'ENTER veya Devam butonuna bas'
  }
}