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
    snd.play().catch(() => {
      // Tarayıcı autoplay politikası — sessizce geç
    })
  } catch (_) {}
}

export const sounds = {
  goal()    { play('goal') },
  card()    { play('blow') },
  click()   { /* sessiz — UI feedback yeterli */ },
  whistle() { play('blow') },
  miss()    { /* sessiz */ },
}