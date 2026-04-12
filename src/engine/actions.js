// ============================================================
//  ChronoBall — Aksiyon Tablosu + Pozisyon & Taktik Sistemi
//  Yeni: yakın frikik (tip 4) vs uzak frikik (tip 0) çarpanları
// ============================================================

export const ACTIONS = {
  0: { name: 'Uzak Frikik',    icon: '🚩', type: 'freekick-far'  },  // uzak mesafeden
  1: { name: 'Faul',           icon: '🦵', type: 'faul'          },
  2: { name: 'Sarı Kart',      icon: '🟨', type: 'sari'          },
  3: { name: 'Penaltı',        icon: '🎯', type: 'penalty'       },
  4: { name: 'Yakın Frikik',   icon: '🌀', type: 'freekick-near' },  // ceza sahası yakını +bonus
  5: { name: 'Serbest Vuruş',  icon: '⚡', type: 'freekick'      },
  6: { name: 'Korner',         icon: '📐', type: 'corner'        },
  7: { name: 'GOL!',           icon: '⚽', type: 'gol'           },
  8: { name: 'Kırmızı Kart',   icon: '🟥', type: 'kirmizi'      },
  9: { name: 'Ofsayt',         icon: '🚫', type: 'normal'        },
}

// ── Pozisyon Taban Ağırlıkları ───────────────────────────────
export const POS_WEIGHTS = {
  K:  { goalMult: 0.15, penaltyMult: 0.60 },
  D:  { goalMult: 0.30, penaltyMult: 0.65 },
  OS: { goalMult: 0.55, penaltyMult: 0.75 },
  F:  { goalMult: 0.80, penaltyMult: 0.85 },
}

// ── Frikik Pozisyon Çarpanları ───────────────────────────────
// Yakın frikik (ceza sahası kenarı) — tehlikeli bölge
const FREEKICK_NEAR_MODS = { K: 1.0, D: 1.05, OS: 1.10, F: 1.20 }
// Uzak frikik — standart mesafe
const FREEKICK_FAR_MODS  = { K: 1.0, D: 1.05, OS: 1.07, F: 1.09 }

// ── Taktik Modifiyerleri ─────────────────────────────────────
export const TACTIC_MODS = {
  attack:  1.3,
  balance: 1.0,
  defense: 0.7,
}

/** Normal oyun / korner gol çarpanı */
export function calcGoalMult(pos, tactic) {
  const base = POS_WEIGHTS[pos]?.goalMult ?? 0.5
  const mod  = TACTIC_MODS[tactic] ?? 1.0
  return Math.min(1, base * mod)
}

/** Yakın frikik — D:+5%, OS:+10%, F:+20% */
export function calcFreekickNearMult(pos, tactic) {
  const base    = POS_WEIGHTS[pos]?.goalMult ?? 0.5
  const tacMod  = TACTIC_MODS[tactic] ?? 1.0
  const posMod  = FREEKICK_NEAR_MODS[pos] ?? 1.0
  return Math.min(0.95, base * tacMod * posMod)
}

/** Uzak frikik — D:+5%, OS:+7%, F:+9% */
export function calcFreekickFarMult(pos, tactic) {
  const base    = POS_WEIGHTS[pos]?.goalMult ?? 0.5
  const tacMod  = TACTIC_MODS[tactic] ?? 1.0
  const posMod  = FREEKICK_FAR_MODS[pos] ?? 1.0
  return Math.min(0.90, base * tacMod * posMod)
}

/** Penaltı — yüksek sabit taban, pozisyona göre artar */
export function calcPenaltyMult(pos, tactic) {
  const base     = POS_WEIGHTS[pos]?.penaltyMult ?? 0.70
  const mod      = TACTIC_MODS[tactic] ?? 1.0
  const modLight = 1 + (mod - 1) * 0.3
  return Math.min(0.95, base * modLight)
}

/**
 * Çarpandan "gol sayılan basamaklar" dizisi üret
 * mult=0.70 → [0,1,2,3,4,5,6] = 7 basamak ≈ %70
 */
export function goalDigitsFromMult(mult) {
  const count = Math.round(mult * 10)
  return Array.from({ length: count }, (_, i) => i)
}

// ── Rastgele İsimler ─────────────────────────────────────────
export const RANDOM_NAMES = [
  'Altay',    'Djiku',      'Rodrigues', 'Tadic',     'Sanchez',
  'Kahveci',  'Szymanski',  'Bazoer',    'Krunic',    'Valencia',
  'Muslera',  'Nelsson',    'Bardakci',  'Torreira',  'Oliveira',
  'Mertens',  'Zaniolo',    'Aktürkoğlu','Seferovic', 'Yılmaz',
  'Livakovic','Osayi',      'Zajc',      'Ozan',      'King',
  'Uzun',     'Güler',      'İrfan Can', 'Dzeko',     'İcardi',
  'Crespo',   'Hakim',      'Kenan',     'Batshuayi', 'Angelino',
  'Samet',    'Demirel',    'Babel',     'Slimani',   'Ferdi',
]

export function randomNames() {
  return [...RANDOM_NAMES].sort(() => Math.random() - 0.5)
}