let interval    = null
let startTime   = null
let elapsed     = 0
let running     = false

let onTick = (_displayText, _running) => {}

export function chronoInit(tickCallback) {
  onTick = tickCallback
}

export function chronoStart() {
  if (running) return
  startTime = Date.now() - elapsed
  running   = true
  interval  = setInterval(_tick, 10)
}

export function chronoStop() {
  if (!running) return 0
  clearInterval(interval)
  interval = null
  elapsed  = Date.now() - startTime
  running  = false
  onTick(getDisplayText(), false)
  return getLastDigit()
}

export function chronoReset() {
  clearInterval(interval)
  interval  = null
  running   = false
  elapsed   = 0
  startTime = null
  onTick('00.00', false)
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
  if (phase === 'second-half')  return Math.min(45 + dispSecs + 1, 90)
  if (phase === 'extra-time-1') return Math.min(90 + dispSecs + 1, 97)
  if (phase === 'extra-time-2') return Math.min(97 + dispSecs + 1, 105)
  return Math.min(dispSecs + 1, 45)
}

function _tick() {
  elapsed = Date.now() - startTime
  onTick(getDisplayText(), true)
}