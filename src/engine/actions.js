// ============================================================
//  ChronoBall — Aksiyon Tablosu + Pozisyon & Taktik Sistemi
//  v3: Bilateral taktik, defans kalitesi çarpanı, yorumcu sistemi
// ============================================================

export const ACTIONS = {
  0: { name: 'Uzak Frikik',    icon: '🚩', type: 'freekick-far'  },
  1: { name: 'Faul',           icon: '🦵', type: 'faul'          },
  2: { name: 'Sarı Kart',      icon: '🟨', type: 'sari'          },
  3: { name: 'Penaltı',        icon: '🎯', type: 'penalty'       },
  4: { name: 'Yakın Frikik',   icon: '🌀', type: 'freekick-near' },
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
const FREEKICK_NEAR_MODS = { K: 1.0, D: 1.05, OS: 1.10, F: 1.20 }
const FREEKICK_FAR_MODS  = { K: 1.0, D: 1.05, OS: 1.07, F: 1.09 }

// ── BİLATERAL TAKTİK SİSTEMİ ────────────────────────────────
// Saldıran takımın taktiği → kendi gol üretim şansını etkiler
export const ATTACK_TACTIC_MODS = {
  attack:  1.30,  // Agresif baskı: +30% gol fırsatı
  balance: 1.00,  // Normal oyun
  defense: 0.85,  // Temkinli oyna: az gol fırsatı üretir
}

// Savunan takımın taktiği → rakibin gol atma şansını etkiler
export const DEFENSE_TACTIC_MODS = {
  attack:  1.20,  // Yüksek hat = arkada boşluk = rakip kolay gol atar
  balance: 1.00,  // Normal savunma
  defense: 0.75,  // Kompakt blok = rakibin işi zorlaşır
}

// ── DEFANS KALİTESİ ÇARPANI ─────────────────────────────────
/**
 * Rakibin kadro kompozisyonunu değerlendirip gol atma kolaylığını döner.
 * Düşük değer = rakibin savunması güçlü (gol atmak zor)
 * Yüksek değer = rakibin savunması zayıf (gol atmak kolay)
 *
 * @param {Object} defTeam - savunan takım objesi
 * @returns {number} çarpan (0.55 – 1.40 arasında)
 */
export function calcDefenseQualityMod(defTeam) {
  if (!defTeam) return 1.0

  const active    = defTeam.players.filter(p => !p.redCard)
  const hasKeeper = active.some(p => p.pos === 'K')
  const defCount  = active.filter(p => p.pos === 'D').length

  let mod = 1.0
  if (!hasKeeper) mod += 0.25                   // Kaleci yoksa +25% kolay gol
  mod -= Math.min(4, defCount) * 0.04           // Her defans: -4% (max 4 = -16%)

  return Math.max(0.55, Math.min(1.40, mod))
}

// ── GOL ÇARPANI HESAPLAMA ────────────────────────────────────
/**
 * Normal oyun / korner gol çarpanı
 * @param {string}      pos        - saldıran oyuncu pozisyonu
 * @param {string}      atkTactic  - saldıran takım taktiği
 * @param {string}      defTactic  - savunan takım taktiği
 * @param {Object|null} defTeam    - savunan takım objesi
 */
export function calcGoalMult(pos, atkTactic, defTactic, defTeam) {
  const base      = POS_WEIGHTS[pos]?.goalMult ?? 0.5
  const atkMod    = ATTACK_TACTIC_MODS[atkTactic]  ?? 1.0
  const defTacMod = DEFENSE_TACTIC_MODS[defTactic] ?? 1.0
  const defQual   = calcDefenseQualityMod(defTeam)
  return Math.min(0.95, base * atkMod * defTacMod * defQual)
}

/**
 * Yakın frikik çarpanı — ceza sahası kenarı, tehlikeli bölge
 */
export function calcFreekickNearMult(pos, atkTactic, defTactic, defTeam) {
  const base      = POS_WEIGHTS[pos]?.goalMult ?? 0.5
  const atkMod    = ATTACK_TACTIC_MODS[atkTactic]  ?? 1.0
  const defTacMod = DEFENSE_TACTIC_MODS[defTactic] ?? 1.0
  const defQual   = calcDefenseQualityMod(defTeam)
  const posMod    = FREEKICK_NEAR_MODS[pos] ?? 1.0
  return Math.min(0.95, base * atkMod * defTacMod * defQual * posMod)
}

/**
 * Uzak frikik çarpanı — standart mesafe
 */
export function calcFreekickFarMult(pos, atkTactic, defTactic, defTeam) {
  const base      = POS_WEIGHTS[pos]?.goalMult ?? 0.5
  const atkMod    = ATTACK_TACTIC_MODS[atkTactic]  ?? 1.0
  const defTacMod = DEFENSE_TACTIC_MODS[defTactic] ?? 1.0
  const defQual   = calcDefenseQualityMod(defTeam)
  const posMod    = FREEKICK_FAR_MODS[pos] ?? 1.0
  return Math.min(0.90, base * atkMod * defTacMod * defQual * posMod)
}

/**
 * Penaltı çarpanı — taktik ve kadro etkisi azaltılmış (1'e 1 durum)
 */
export function calcPenaltyMult(pos, atkTactic, defTactic, defTeam) {
  const base     = POS_WEIGHTS[pos]?.penaltyMult ?? 0.70
  const atkMod   = ATTACK_TACTIC_MODS[atkTactic] ?? 1.0
  const atkLight = 1 + (atkMod - 1) * 0.3         // Taktik etkisi %30'a düşürüldü
  const defQual  = calcDefenseQualityMod(defTeam)
  const defLight = 1 + (defQual - 1) * 0.35        // Kadro etkisi %35'e düşürüldü
  return Math.min(0.95, base * atkLight * defLight)
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

// ── YORUMCU SİSTEMİ ──────────────────────────────────────────
export const COMMENTARY = {
  goal_direct: [
    'Top fileleri havalandırdı! İnanılmaz!',
    'Mükemmel bir bitiriş! Seyirciler çılgına döndü!',
    'Kimse durduramadı! Harika gol!',
    'Bomba gibi bir vuruş! Kaleci çaresiz kaldı!',
    'Saha inledi! Gol bulucu isim!',
    'Köşeye yatırdı, kaleci uçsa değişmezdi!',
  ],
  goal_penalty: [
    'Soğukkanlılıkla köşeye bıraktı!',
    'Kaleci yanlış tarafa atladı, net gol!',
    'Üst köşeden süpürdü, itiraz yok!',
    'Penaltı uzmanı gibi bitirdi!',
    'Kaleci donup kaldı, top içeride!',
  ],
  goal_freekick: [
    'Duvarın üzerinden kıvrılarak içeri!',
    'Kale duvarı dağıldı, top filelerde!',
    'İnanılmaz bir kıvrım, kaleci seyirci!',
    'Ön direkten dönerek içeri süzüldü!',
    'Doğrudan gol! Müthiş vuruş!',
  ],
  goal_corner: [
    'Saptırmayla içeri! Kornerden gol!',
    'Kalabalıktan sıyrılıp kafayı vurdu!',
    'Ön direkten dönerek ağlara!',
    'Korner kaosunda top içeride!',
  ],
  miss_penalty: [
    'Direk! Top dışarı, büyük şans kaçtı!',
    'Kaleci muhteşem kurtardı! Süper refleks!',
    'Penaltı kaçtı! Takım nefes aldı!',
    'Kaleci bir hamleyle önüne attı!',
    'Az fark üstten aştı, kaleci sevindi!',
    'Yan direkte patladı! İnanamıyoruz!',
  ],
  miss_freekick: [
    'Duvar harika bloke etti!',
    'Kaleci güçlü durdu, kornere!',
    'Az fark üstten aştı, çok yakındı!',
    'Biraz daha alçak olsaydı gondü...',
    'Duvar boyladı, fırsat heba oldu!',
  ],
  miss_corner: [
    'Kimse yetişemedi, kaçan bir fırsat!',
    'Defans temizledi, tehlike atlatıldı!',
    'Kaleci hâkimiyetle kapıp kurtardı!',
    'Başlar karıştı, kimse yetişemedi!',
  ],
  card_yellow: [
    'Hakem anında cebine gitti!',
    'Tartışmalı bir karar ama hakem kesin!',
    'İtiraz etse de karar değişmiyor!',
    'Sert müdahale, sarı kart kaçınılmazdı!',
  ],
  card_red: [
    'Erken duş! Takım 10 kişi kalıyor!',
    'Maç dengeleri tamamen değişti!',
    'Tartışmalı karar ama hakem geri adım atmıyor!',
    'Kırmızı! Bu karar maçı şekillendirebilir!',
  ],
  foul: [
    'Sert müdahale! Hakem hemen çaldı!',
    'Rakip yerde kaldı, hakem düdüğü kaldırdı!',
    'Gereksiz faul, takım tehlikeye girdi!',
    'Hakem hızlı tepki gösterdi, faul!',
  ],
  offside: [
    'Bayrak kalktı, hakem ofsayt dedi!',
    'Ofsayt tuzağı mükemmel kuruldu!',
    'Çok erken koştu, kapana yakalandı!',
    'Defans koordineli çıktı, ofsayt!',
  ],
}

/**
 * Belirli bir kategori için rastgele yorumcu metni döner
 * @param {string} type - COMMENTARY anahtarı
 * @returns {string}
 */
export function pickCommentary(type) {
  const arr = COMMENTARY[type]
  if (!arr || !arr.length) return ''
  return arr[Math.floor(Math.random() * arr.length)]
}