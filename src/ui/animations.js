// ============================================================
//  ChronoBall — Animasyon Sistemi
//  API: triggerAnimation(type, teamSide)
//  type:     'goal' | 'freekick'
//  teamSide: 'home'  | 'away'
// ============================================================

/**
 * Ana giriş noktası — dışarıdan çağrılır
 * @param {'goal'|'freekick'} type
 * @param {'home'|'away'}     teamSide
 */
export function triggerAnimation(type, teamSide) {
  if (type === 'goal')     _goalAnimation(teamSide)
  if (type === 'freekick') _freekickAnimation(teamSide)
}

// ── GOL ANİMASYONU ───────────────────────────────────────────
// 1) Skor paneli yanıp söner (takım renginde)
// 2) Ekran üstünde kısa "GOL!" overlay gösterir
// 3) Oyuncu kutlama figürü belirir
function _goalAnimation(teamSide) {
  if (navigator.vibrate) {
    navigator.vibrate([100, 50, 100, 50, 200]);
  }

  const overlay = _getOrCreate('anim-goal-overlay', 'goal-overlay')
  overlay.innerHTML = `<span class="goal-anim-text">⚽ GOL!</span>`
  overlay.classList.remove(`team-home`, `team-away`)
  overlay.classList.add(`team-${teamSide}`)
  overlay.classList.remove('anim-active')
  void overlay.offsetWidth
  overlay.classList.add('anim-active')

  const panel = document.querySelector(`.${teamSide}-panel`)
  if (panel) {
    panel.classList.remove('panel-flash')
    void panel.offsetWidth
    panel.classList.add('panel-flash')
    setTimeout(() => panel.classList.remove('panel-flash'), 1600)
  }

  _spawnCelebration(teamSide)

  setTimeout(() => overlay.classList.remove('anim-active'), 1800)
}

// ── FRİKİK ANİMASYONU ────────────────────────────────────────
// Ayak ve top emojisi animasyonu kaldırıldı
function _freekickAnimation(teamSide) {
  return;
}

// ── KUTLAMA FİGÜRÜ ───────────────────────────────────────────
function _spawnCelebration(teamSide) {
  const container = document.getElementById('screen-match')
  if (!container) return

  const fig = document.createElement('div')
  fig.className = `celebration-figure celebrate-${teamSide}`
  fig.innerHTML = `<span class="cel-player">🙌</span><span class="cel-stars">✨</span>`
  container.appendChild(fig)

  setTimeout(() => fig.remove(), 1600)
}

// ── YARDIMCI: overlay/container bul ya da oluştur ────────────
function _getOrCreate(id, className) {
  let el = document.getElementById(id)
  if (!el) {
    el = document.createElement('div')
    el.id        = id
    el.className = className
    document.getElementById('screen-match')?.appendChild(el)
  }
  return el
}