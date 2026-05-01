export function setChronoHint(phase) {
  const hint   = document.getElementById('chrono-hint')
  const btnTxt = document.getElementById('btn-pull-text')
  const btn    = document.getElementById('btn-pull')

  btn.classList.remove('second-pull')
  if (hint) hint.classList.remove('hint-warning')

  if (phase === 'player') {
    if (hint)   hint.textContent = '▶ Butona bas → kronometreyi başlat, sonra durdur!'
    if (btnTxt) btnTxt.textContent = '▶ BAŞLAT'
    _setProgress(1)
  } else if (phase === 'action') {
    if (hint)   hint.textContent = '2. Çekim: Butona bas → başlat → durdur!'
    if (btnTxt) btnTxt.textContent = '▶ BAŞLAT (Aksiyon)'
    btn.classList.add('second-pull')
    _setProgress(2)
  } else if (phase === 'third') {
    if (hint)   hint.textContent = '3. Çekim: Butona bas → başlat → durdur!'
    if (btnTxt) btnTxt.textContent = '▶ BAŞLAT (Sonuç)'
    btn.classList.add('second-pull')
    _setProgress(3)
  } else if (phase === 'waiting') {
    if (hint)   hint.textContent = 'Devam etmek için butona bas'
    if (btnTxt) btnTxt.textContent = '▶ DEVAM'
    _setProgress(0)
  }
}

function _setProgress(step) {
  const steps = document.querySelectorAll('.phase-step')
  steps.forEach((s, i) => {
    s.classList.remove('active', 'done')
    if (i + 1 < step)  s.classList.add('done')
    if (i + 1 === step) s.classList.add('active')
  })
}