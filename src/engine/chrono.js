// ============================================================
//  ChronoBall — Kronometre Modülü
//  Kronometre kaldığı yerden devam eder — reset yalnızca
//  maç başında ve yarı başında çağrılır.
//  v2: 12 saniyelik auto-stop + geri sayım callback
// ============================================================

const MAX_RUN_MS = 12000  // 12 saniye — bu süre sonunda otomatik durdurulur

let interval    = null
let startTime   = null
let elapsed     = 0      // ms — birikmiş süre
let running     = false

let onTick     = (_displayText, _running, _countdown) => {}
let onAutoStop = null    // () => void — zaman aşımında çağrılır

export function chronoInit(tickCallback, autoStopCallback) {
  onTick     = tickCallback
  onAutoStop = autoStopCallback || null
}

export function chronoStart() {
  if (running) return
  startTime = Date.now() - elapsed   // kaldığı yerden devam
  running   = true
  interval  = setInterval(_tick, 10)
}

export function chronoStop() {
  if (!running) return 0
  clearInterval(interval)
  interval = null
  elapsed  = Date.now() - startTime  // kesin değeri kaydet
  running  = false
  // DOM'u durdurulmuş değerle güncelle
  onTick(getDisplayText(), false, null)
  return getLastDigit()
}

export function chronoReset() {
  clearInterval(interval)
  interval  = null
  running   = false
  elapsed   = 0
  startTime = null
  onTick('00.00', false, null)
}

export function isRunning() { return running }

export function getDisplayText() {
  const totalCs = Math.floor(elapsed / 10)
  const secs    = Math.floor(totalCs / 100) % 100
  const cs      = totalCs % 100
  return String(secs).padStart(2, '0') + '.' + String(cs).padStart(2, '0')
}

export function getLastDigit() {
  const txt = getDisplayText()
  return parseInt(txt.charAt(txt.length - 1))
}

export function calcMinute(phase) {
  const totalCs  = Math.floor(elapsed / 10)
  const dispSecs = Math.floor(totalCs / 100) % 100
  if (phase === 'second-half')    return Math.min(45 + dispSecs + 1, 90)
  if (phase === 'extra-time-1')   return Math.min(90 + dispSecs + 1, 97)
  if (phase === 'extra-time-2')   return Math.min(97 + dispSecs + 1, 105)
  return Math.min(dispSecs + 1, 45)
}

function _tick() {
  elapsed = Date.now() - startTime

  // Auto-stop: maksimum süre aşıldıysa
  if (elapsed >= MAX_RUN_MS) {
    // elapsed'ı sabitleme — son anlık değerde bırak, böylece son rakam rastgele kalır
    clearInterval(interval)
    interval = null
    running  = false
    onTick(getDisplayText(), false, null)
    if (onAutoStop) onAutoStop()
    return
  }

  const remaining = MAX_RUN_MS - elapsed
  const countdownSecs = Math.ceil(remaining / 1000)
  onTick(getDisplayText(), true, countdownSecs)
}