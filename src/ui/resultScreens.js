// ============================================================
//  ChronoBall — Devre Arası & Maç Sonu Ekranları
//  + Sosyal Paylaşım Kartı (Canvas API)
// ============================================================

import { getState }   from '../state/gameState.js'
import { calcMotm }   from '../engine/match.js'

export function buildHalftimeScreen() {
  const state = getState()
  const t     = state.teams

  _set('ht-team0-name', t[0].name)
  _set('ht-team1-name', t[1].name)
  _set('ht-score0',     t[0].score)
  _set('ht-score1',     t[1].score)

  const logEl = document.getElementById('halftime-log')
  if (logEl) {
    const goals = state.log.filter(e => e.type === 'gol')
    if (goals.length === 0) {
      logEl.innerHTML = '<p class="log-empty">Henüz gol yok</p>'
    } else {
      logEl.innerHTML = goals.map(e =>
        `<div class="summary-item gol-item">
           ⚽ ${e.minute}' — ${e.text}
         </div>`
      ).join('')
    }
  }
}

export function buildFulltimeScreen() {
  const state = getState()
  const t     = state.teams
  const s     = state.stats
  const so    = state.shootout

  _set('ft-team0-name', t[0].name)
  _set('ft-team1-name', t[1].name)
  _set('ft-score0',     t[0].score)
  _set('ft-score1',     t[1].score)

  // Sonuç metni
  const resEl = document.getElementById('fulltime-result-text')
  if (resEl) {
    if (state.phase === 'penalty-shootout' || so?.round >= so?.maxRounds) {
      const winner = so.scores[0] > so.scores[1] ? t[0].name : t[1].name
      resEl.textContent = `🥅 ${winner} Penaltılarda Kazandı! (${so.scores[0]}–${so.scores[1]})`
    } else if (t[0].score > t[1].score) {
      resEl.textContent = `🏆 ${t[0].name} Kazandı!`
    } else if (t[1].score > t[0].score) {
      resEl.textContent = `🏆 ${t[1].name} Kazandı!`
    } else {
      resEl.textContent = `🤝 Beraberlik!`
    }
  }

  // İstatistikler
  const statsEl = document.getElementById('fulltime-stats-content')
  if (statsEl) {
    statsEl.innerHTML = `
      <table class="stats-table">
        <thead>
          <tr>
            <th class="home-col">${t[0].name}</th>
            <th class="stat-label"></th>
            <th class="away-col">${t[1].name}</th>
          </tr>
        </thead>
        <tbody>
          ${_row(s[0].goals,       s[1].goals,       'Gol'          )}
          ${_row(s[0].fouls,       s[1].fouls,       'Faul'         )}
          ${_row(s[0].yellowCards, s[1].yellowCards,  'Sarı Kart'    )}
          ${_row(s[0].redCards,    s[1].redCards,     'Kırmızı Kart' )}
          ${_row(s[0].corners,     s[1].corners,      'Korner'       )}
          ${_row(s[0].penalties,   s[1].penalties,    'Penaltı'      )}
        </tbody>
      </table>
    `
  }

  // Maçın Adamı
  const motm = calcMotm(state)
  const motmEl = document.getElementById('fulltime-motm')
  if (motmEl) {
    if (motm) {
      const posIcon = { K:'🧤', D:'🛡️', OS:'⚙️', F:'🔥' }[motm.pos] || '⚽'
      motmEl.innerHTML = `
        <div class="motm-card">
          <div class="motm-label">⭐ MAÇIN ADAMI</div>
          <div class="motm-name">${posIcon} ${motm.name}</div>
          <div class="motm-team">${motm.teamName} — ${motm.goals} Gol</div>
        </div>
      `
    } else {
      motmEl.innerHTML = `<div class="motm-card motm-empty">Bu maçta gol olmadı</div>`
    }
  }

  // Log
  const logEl = document.getElementById('fulltime-log')
  if (logEl) {
    const events = state.log.filter(e => ['gol','kart','sari'].includes(e.type))
    if (events.length === 0) {
      logEl.innerHTML = '<p class="log-empty">Önemli olay kaydedilmedi</p>'
    } else {
      logEl.innerHTML = events.map(e => {
        const icon = e.type === 'gol' ? '⚽' : e.type === 'kart' ? '🟥' : '🟨'
        return `<div class="summary-item ${e.type}-item">${icon} ${e.minute}' — ${e.text}</div>`
      }).join('')
    }
  }

  // Lig modunda "YENİ MAÇ" butonunu "LİG MERKEZİNE DÖN" ile değiştir
  const newMatchBtn = document.querySelector('#screen-fulltime .result-btn-row .btn-cta')
  if (newMatchBtn) {
    if (state.gameMode === 'league') {
      newMatchBtn.textContent = '🏟️ LİG MERKEZİNE DÖN'
      newMatchBtn.onclick = () => window.returnToLeagueHub && window.returnToLeagueHub()
    } else {
      newMatchBtn.textContent = '🔄 YENİ MAÇ'
      newMatchBtn.onclick = () => window.newMatch && window.newMatch()
    }
  }
}

function _row(v0, v1, label) {
  const h0 = v0 > v1 ? 'winner' : ''
  const h1 = v1 > v0 ? 'winner' : ''
  return `<tr>
    <td class="home-col ${h0}">${v0}</td>
    <td class="stat-label">${label}</td>
    <td class="away-col ${h1}">${v1}</td>
  </tr>`
}

function _set(id, val) {
  const el = document.getElementById(id)
  if (el) el.textContent = val
}

// ============================================================
//  Sosyal Paylaşım Kartı — Canvas API
// ============================================================

export async function buildShareCard() {
  const state = getState()
  const t     = state.teams
  const motm  = calcMotm(state)
  const so    = state.shootout

  // Sonuç metni
  let resultText
  if (so?.scores && (so.scores[0] !== so.scores[1]) && so.round > 0) {
    const winner = so.scores[0] > so.scores[1] ? t[0].name : t[1].name
    resultText = `${winner} Penaltılarda Kazandı!`
  } else if (t[0].score > t[1].score) {
    resultText = `${t[0].name} Kazandı!`
  } else if (t[1].score > t[0].score) {
    resultText = `${t[1].name} Kazandı!`
  } else {
    resultText = 'Beraberlik!'
  }

  const canvas  = document.createElement('canvas')
  canvas.width  = 800
  canvas.height = 480
  const ctx     = canvas.getContext('2d')

  // ── Arkaplan ────────────────────────────────────────────
  ctx.fillStyle = '#0a0a0a'
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  // Yeşil saha çizgisi (dekoratif)
  ctx.strokeStyle = '#00ff88'
  ctx.lineWidth   = 3
  ctx.strokeRect(16, 16, canvas.width - 32, canvas.height - 32)

  // Logo çizgisi üst
  ctx.fillStyle = '#00ff88'
  ctx.fillRect(16, 16, canvas.width - 32, 4)

  // ── Başlık: ChronoBall ──────────────────────────────────
  ctx.fillStyle = '#ffffff'
  ctx.font      = 'bold 22px Inter, Arial, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('⚽ CHRONOBALL', canvas.width / 2, 60)

  // ── Takım Adları & Skor ─────────────────────────────────
  // Ev sahibi adı
  ctx.fillStyle = '#00ff88'
  ctx.font      = 'bold 36px Inter, Arial, sans-serif'
  ctx.textAlign = 'right'
  ctx.fillText(t[0].name, 310, 180)

  // Skor
  ctx.fillStyle = '#ffffff'
  ctx.font      = 'bold 80px Inter, Arial, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText(`${t[0].score} — ${t[1].score}`, canvas.width / 2, 200)

  // Deplasman adı
  ctx.fillStyle = '#ff6b6b'
  ctx.font      = 'bold 36px Inter, Arial, sans-serif'
  ctx.textAlign = 'left'
  ctx.fillText(t[1].name, 490, 180)

  // ── Sonuç metni ─────────────────────────────────────────
  ctx.fillStyle = '#ffdd57'
  ctx.font      = 'bold 26px Inter, Arial, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText(`🏆 ${resultText}`, canvas.width / 2, 255)

  // ── MOTM ────────────────────────────────────────────────
  if (motm) {
    const posIcon = { K:'🧤', D:'🛡', OS:'⚙', F:'🔥' }[motm.pos] || '⚽'
    ctx.fillStyle = '#aaaaaa'
    ctx.font      = '18px Inter, Arial, sans-serif'
    ctx.fillText('⭐ MAÇIN ADAMI', canvas.width / 2, 300)
    ctx.fillStyle = '#ffffff'
    ctx.font      = 'bold 22px Inter, Arial, sans-serif'
    ctx.fillText(`${posIcon} ${motm.name} — ${motm.goals} Gol`, canvas.width / 2, 330)
  }

  // ── İstatistik ──────────────────────────────────────────
  const s = state.stats
  ctx.fillStyle = '#888888'
  ctx.font      = '16px Inter, Arial, sans-serif'
  ctx.fillText(
    `Gol: ${s[0].goals}-${s[1].goals}  |  Korner: ${s[0].corners}-${s[1].corners}  |  Sarı: ${s[0].yellowCards}-${s[1].yellowCards}  |  Kırmızı: ${s[0].redCards}-${s[1].redCards}`,
    canvas.width / 2, 375
  )

  // ── URL / Watermark ─────────────────────────────────────
  ctx.fillStyle = '#444444'
  ctx.font      = '14px Inter, Arial, sans-serif'
  ctx.fillText('chronoball.app', canvas.width / 2, 450)

  // ── Paylaş veya İndir ───────────────────────────────────
  return new Promise((resolve) => {
    canvas.toBlob(async (blob) => {
      if (!blob) { resolve(); return }
      const file = new File([blob], 'chronoball-mac.png', { type: 'image/png' })
      try {
        if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            files:  [file],
            title:  'ChronoBall Maç Sonucu',
            text:   `${t[0].name} ${t[0].score} — ${t[1].score} ${t[1].name}`,
          })
        } else {
          // Fallback: PNG olarak indir
          const url = URL.createObjectURL(blob)
          const a   = document.createElement('a')
          a.href     = url
          a.download = 'chronoball-mac.png'
          document.body.appendChild(a)
          a.click()
          document.body.removeChild(a)
          URL.revokeObjectURL(url)
        }
      } catch (_) {
        // Kullanıcı paylaşımı iptal etti — sessizce geç
      }
      resolve()
    }, 'image/png')
  })
}