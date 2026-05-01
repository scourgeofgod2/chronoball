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
  K:  { goalMult: 0.03, penaltyMult: 0.45 },  // Kaleci: çok nadiren gol atar
  D:  { goalMult: 0.18, penaltyMult: 0.58 },
  OS: { goalMult: 0.32, penaltyMult: 0.68 },
  F:  { goalMult: 0.48, penaltyMult: 0.78 },
}

// ── Frikik Pozisyon Çarpanları ───────────────────────────────
const FREEKICK_NEAR_MODS = { K: 1.0, D: 1.05, OS: 1.10, F: 1.20 }
const FREEKICK_FAR_MODS  = { K: 1.0, D: 1.05, OS: 1.07, F: 1.09 }

// ── BİLATERAL TAKTİK SİSTEMİ ────────────────────────────────
// Saldıran takımın taktiği → kendi gol üretim şansını etkiler
export const ATTACK_TACTIC_MODS = {
  attack:  1.20,  // Agresif baskı: +20% gol fırsatı
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
    'Gooooooooool! Tam 90\'a! Örümcek ağlarını aldı!',
    'Kaleciyle topu ayrı köşelere yolladı! Klas bir bitiriş!',
    'Füze yolladı füze! Ağları delecek!',
    'Mükemmel bir şut! Kalecinin sadece izleyebileceği bir gol!',
    'Affetmedi! Ceza sahasında bir yılan gibi süzüldü ve golü yaptı!',
    'Şut mu çekti, balyoz mu indirdi belli değil! Muazzam gol!',
    'İğne deliğinden geçirdi! İnanılmaz bir görüş!',
    'Aşırtma bir vuruş! Kalecinin üstünden ağlara süzülüyor, jeneriklik!',
    'Kalecinin bacakları arasından geçti! Çok can yakan bir gol!',
    'Yerden çok sert ve düzgün! Bilardo topu gibi köşeden içeride!',
    'Top ağlarda, kaleci yerde! Savunma paramparça!',
    'İşte golü koklayan adam! Önüne düşen topu tavana astı!',
  ],
  goal_penalty: [
    'Kaleciyi bakkala gönderdi! Çok temiz gol!',
    'Çok soğukkanlı! Adeta buz adam!',
    'Ters köşe! Kaleci sağa, top sola!',
    'Panenka vuruşu! İnanılmaz bir özgüven, stadyum çıldırdı!',
    'Vurdu ve golü yaptı! Penaltıyı adeta nakış gibi işledi!',
    'Kalecinin üstüne üstüne, çok sert! Ellerinin arasından ağlara!',
    'Direk dibine plase! Kaleci uzandı ama nafile!',
    'Hiç acımadı! Topu adeta kaleye mühürledi!',
    'Öyle bir vurdu ki direkler titredi ama top içeride!',
    'Penaltı nasıl atılır dersi verdi! Tertemiz bir bitiriş!',
  ],
  goal_freekick: [
    'Barajı aştı, tam çatala! İnanılmaz bir frikik!',
    'Ölü yaprak vuruşu! Kalecinin yapacak hiçbir şeyi yok!',
    'Mükemmel bir kavis! Fiziğe aykırı bir gol!',
    'Usta işi bir vuruş! Şapka çıkarılır bu gole!',
    'Baraj bozuldu, top ağlarla buluştu!',
    'Roberto Carlos misali! Uzaklardan inanılmaz bir füze!',
    'Barajın altından yerden zekice bir vuruş! Kaleci donakaldı!',
    'Direk içine çarpıp ağlara gitti! Geometrinin sınırlarını zorladı!',
    'Kalecinin kapattığı köşeden avladı onu! Müthiş zeka!',
    'Kaleci uçtu ama sadece fotoğrafa girdi! Harika gol!',
  ],
  goal_corner: [
    'Karambolde dokundu ve goool!',
    'Herkesin üzerinden yükseldi, harika bir kafa vuruşu!',
    'Ön direkte usta işi bir dokunuş! Fırsatçılığını konuşturdu!',
    'Adeta uçarak kafayı vurdu! Defans uyudu, o affetmedi!',
    'Arka direkte kendini unutturdu, gelişine mükemmel vurdu!',
    'Kornerden doğrudan kaleye! İnanılmaz! Olimpik gol!',
    'Kalecinin elinden seken topu tamamladı! Fırsatçılık bu!',
    'Defans uzaklaştıramadı, ceza yayı üzerinden harika bir vole!',
    'Dönen topa gelişine mermi gibi vurdu, ağları havalandırdı!',
    'Kafa vuruşu yere çarptı ve hızlandı, kaleci çaresiz!',
  ],
  miss_penalty: [
    'Dağlara taşlara vurdu! İnanılır gibi değil!',
    'Kaleci panterleşti! İnanılmaz bir refleks!',
    'Direkte patladı! Taraftar saç baş yoluyor!',
    'Kötü vurdu, kaleci köşeyi doğru tahmin etti!',
    'Aut! Böyle penaltı mı kullanılır? Büyük fırsat tepti!',
    'Üstten farklı şekilde dışarıda! Takımını yaktı!',
    'Panenka denedi ama kaleci yerinden kımıldamadı! Rezillik!',
    'Kalecinin kucağına çok cılız bir şut! Neredeyse geri pas oldu!',
    'Topu stadyumdan dışarı yolladı! Baskıyı kaldıramadı!',
    'Yan direği yaladı geçti! Şans yanında değildi!',
  ],
  miss_freekick: [
    'Top barajdan sekmedi bile, doğrudan duvara nişanladı!',
    'Direği yalayarak dışarı çıktı! Yüreklerin ağza geldiği an!',
    'Farklı şekilde aut! Topu tribünlere hediye etti!',
    'Kaleci uzandı ve topu doksandan çıkardı! Müthiş!',
    'Şut mu orta mı belli değil, çok kötü bir vuruş!',
    'Kuşları avladı! Bu mesafeden bu kadar kötü vurulmaz.',
    'Reklam panolarında patladı! Kaleci için rahat bir an.',
    'Barajdan sekti, kornere gidiyor. Fırsat kaçtı.',
    'Yerden seken topu kaleci rahatça kontrol etti.',
    'Az farkla üstten aut! Stad bir an "Gooool" diye ayağa kalkmıştı!',
  ],
  miss_corner: [
    'Kimse dokunamadı, top doğrudan taca çıktı!',
    'Kaleci kalesinden çıktı ve çift yumrukla uzaklaştırdı!',
    'Defans etten duvar ördü, tehlike savuşturuldu!',
    'Çok arkaya kesildi, herkes topun altından geçti!',
    'Ön direkte defans kafayı vuruyor. Kötü bir orta.',
    'Çok kavisli gitti, havadan çizgiyi geçti! Hakem autu gösterdi.',
    'Karambolde top kalecinin kucağında kaldı.',
    'Hızlı atakta topu kaptırdılar, rakip kontra atağa çıkıyor!',
    'Kaleciye şarj var! Hakem faul düdüğünü çaldı.',
    'Ceza sahası ana baba günü ama topu uzaklaştırmayı başardılar.',
  ],
  card_yellow: [
    'Hakem tereddütsüz elini cebine attı, sarı kart!',
    'Gereksiz bir itiraz ve sarıyı gördü!',
    'Çok sert girdi, hakem affetmedi!',
    'Taktik faul! Takımı için sarıyı bilerek yedi!',
    'Formasından çekti bıraktı, bu net bir sarı kart!',
    'Topa değil direkt adama müdahale, hakem sarıyı çıkardı.',
    'Hakemi aldatmaya yönelik hareket! Kendini yere attı ve sarıyı yedi.',
    'Zaman geçirmekten dolayı sarı kart görüyor.',
    'Düdükten sonra topa vurdu, hakem bu saygısızlığı affetmez!',
    'Gerginlik tırmandı, hakem araya girip sarıyı gösterdi.',
  ],
  card_red: [
    'Kızardı! Direkt kırmızı! Takımını yalnız bırakıyor!',
    'Erken duş! Bu müdahalenin affı olmazdı!',
    'Ortalık karıştı! Hakem acımadı, kırmızıyı çıkardı!',
    'Takımını yaktı! Çok kritik bir dakikada atılıyor!',
    'İkinci sarıdan kırmızı! Evinin yolunu tutuyor.',
    'Son adam! Hakem mutlak gol şansını engellediği için kırmızıyı yapıştırdı!',
    'Topsuz alanda inanılmaz bir hareket, direkt kırmızı kart!',
    'VAR uyarısı geldi! Hakem kenara gitti, izledi ve kırmızıyı çıkardı!',
    'Hem penaltı yaptırdı hem kırmızı gördü! Felaket bir an!',
    'Hakeme fiili müdahale! Bunun cezası çok ağır olur!',
  ],
  foul: [
    'Adamı adeta biçti! Serbest vuruş!',
    'Arkadan müdahale, hakem düdüğünü çaldı.',
    'Kendini yere bıraktı ama hakem faulü veriyor.',
    'Çok tehlikeli bir yerden serbest vuruş kazandılar!',
    'Hızlı hücumu çekerek durdurdu. Klasik bir taktik faul.',
    'Tabanını gösterdi, endirekt serbest vuruş.',
    'Tehlikeli hareket! Rakibinin kafasının hizasına ayak kaldırdı.',
    'Hava topu mücadelesinde dirsek geldi, hakem oyunu durdurdu.',
    'Avantaja bırakmıştı ama pozisyon kaybolunca düdüğünü çaldı.',
    'Orta sahada kıran kırana bir ikili mücadele, faul!',
  ],
  offside: [
    'Yardımcı hakemin bayrağı havada! Enfes bir ofsayt taktiği!',
    'Çok net ofsayt! Hiç itiraz etmeye gerek yok.',
    'Burun farkıyla ofsayta düştü! Çok erken koşmuş.',
    'Defans çizgi halinde ileri çıktı, ofsayt bayrağı kalkıyor!',
    'Ağlara giden top ofsayt gerekçesiyle iptal ediliyor!',
    'VAR odasında çizgi çekiliyor... Evet, yarım omuzla ofsayt!',
    'Pasif alandaydı ama topa hareketlendiği için bayrak kalktı.',
    'Tam kaleciyle karşı karşıya kalmıştı ki o kahreden düdük çaldı!',
    'Zamanlamayı ayarlayamadı, rakip savunmanın arkasına çok erken sızdı.',
    'Gol sevinci kursaklarında kaldı, yardımcı hakem bayrağıyla bekliyor!',
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