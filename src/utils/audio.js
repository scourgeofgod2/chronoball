// ============================================================
//  ChronoBall — Ses Efektleri
//  MP3'ler data/ klasöründen gelir → Vite publicDir: '../data'
//  → Production'da /goal-sound.mp3 ve /blows.mp3 olarak erişilir
// ============================================================

// Preload edilen ses nesneleri
const _sounds = {
  goal: new Audio('/goal-sound.mp3'),
  blow: new Audio('/blows.mp3'),
}

// Sesi başa sararak çal (hızlı arka arkaya çalma desteği)
function play(key) {
  try {
    const snd = _sounds[key]
    if (!snd) return
    snd.currentTime = 0
    snd.play().catch(() => {})
  } catch (_) {}
}

export const sounds = {
  goal()    { play('goal') },
  card()    { play('blow') },
  click()   { },
  whistle() { play('blow') },
  miss()    { },
}

// ── SPİKER SİSTEMİ ───────────────────────────────────────────

const COMMENTARY_COUNTS = {
  goal_direct:   12,
  goal_penalty:  10,
  goal_freekick: 10,
  goal_corner:   10,
  miss_penalty:  10,
  miss_freekick: 10,
  miss_corner:   10,
  card_yellow:   10,
  card_red:      10,
  foul:          10,
  offside:       10,
}

// Her kategori için son çalınan indeksleri takip et (tekrar önleme)
const _lastPlayed = {}

// Şu an çalan spiker sesi
let _currentCommentary = null

export function playCommentary(category, delay = 20) {
  const count = COMMENTARY_COUNTS[category]
  if (!count) return

  const played = _lastPlayed[category] || []
  let available = Array.from({ length: count }, (_, i) => i + 1)
    .filter(i => !played.includes(i))

  if (available.length === 0) {
    _lastPlayed[category] = []
    available = Array.from({ length: count }, (_, i) => i + 1)
  }

  const idx = available[Math.floor(Math.random() * available.length)]
  _lastPlayed[category] = [...(_lastPlayed[category] || []), idx].slice(-Math.floor(count / 2))

  const num = String(idx).padStart(2, '0')
  const url = `/commentary_${category}_${num}.mp3`

  setTimeout(() => {
    if (_currentCommentary) {
      _currentCommentary.pause()
      _currentCommentary.currentTime = 0
    }
    const audio = new Audio(url)
    _currentCommentary = audio
    audio.play().catch(() => {})
  }, delay)
}