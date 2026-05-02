// ============================================================
//  ChronoBall — Lig Modu Oyuncu Veritabanı
//  44 Oyuncu | Toplam Bütçe: 10M Dolar (10 Oyuncu Seçilecek)
//
//  5 Özellik:
//    atk — Atak gücü (şut, gol, korner çarpanı)
//    def — Defans gücü (savunma kalitesi çarpanı)
//    mid — Orta saha gücü (genel katkı)
//    fk  — Frikik uzmanlığı (yakın/uzak frikik, serbest vuruş — korner değil)
//    pen — Penaltı uzmanlığı (penaltı çarpanını doğrudan etkiler)
// ============================================================

export const PLAYERS_DB = [
  // ── KALECİLER (K) - 5 Oyuncu ──────────────────────────────
  // Kalecilerin atk düşük, def yüksek. Bazıları özel penaltıcı olabilir.
  { id: 'p1',  name: 'Emiliano Muslera',  pos: 'K',  price: 2.5, ratings: { atk: 12, def: 92, mid: 40, fk: 30, pen: 55 } },
  { id: 'p2',  name: 'Giorgi Szymanski',  pos: 'K',  price: 1.8, ratings: { atk: 12, def: 84, mid: 38, fk: 28, pen: 50 } },
  { id: 'p3',  name: 'Altay Fernández',   pos: 'K',  price: 1.2, ratings: { atk: 10, def: 76, mid: 35, fk: 25, pen: 45 } },
  { id: 'p4',  name: 'Djordje Bardakçı',  pos: 'K',  price: 0.7, ratings: { atk: 10, def: 68, mid: 32, fk: 22, pen: 40 } },
  { id: 'p5',  name: 'Lucas Livakovic',   pos: 'K',  price: 0.4, ratings: { atk: 10, def: 60, mid: 28, fk: 20, pen: 35 } },

  // ── DEFANSLAR (D) - 14 Oyuncu ─────────────────────────────
  // Bazı defansçıların yüksek pen veya fk değerleri var — taktik fırsatlar!
  { id: 'p6',  name: 'Sergio Nelsson',    pos: 'D',  price: 2.2, ratings: { atk: 28, def: 90, mid: 60, fk: 45, pen: 72 } },
  { id: 'p7',  name: 'Marcos Djiku',      pos: 'D',  price: 2.0, ratings: { atk: 38, def: 88, mid: 55, fk: 55, pen: 68 } },
  { id: 'p8',  name: 'Ferdi Osayi',       pos: 'D',  price: 1.8, ratings: { atk: 42, def: 82, mid: 65, fk: 60, pen: 58 } },
  { id: 'p9',  name: 'Victor Zajc',       pos: 'D',  price: 1.6, ratings: { atk: 32, def: 80, mid: 58, fk: 88, pen: 55 } }, // Frikik uzmanı defansçı!
  { id: 'p10', name: 'Angelino Torreira', pos: 'D',  price: 1.5, ratings: { atk: 22, def: 80, mid: 52, fk: 48, pen: 88 } }, // Penaltı uzmanı defansçı!
  { id: 'p11', name: 'Rodrigues Kaçar',   pos: 'D',  price: 1.3, ratings: { atk: 42, def: 76, mid: 62, fk: 70, pen: 65 } }, // İyi frikik
  { id: 'p12', name: 'Samet Rodrigo',     pos: 'D',  price: 1.2, ratings: { atk: 28, def: 75, mid: 50, fk: 42, pen: 60 } },
  { id: 'p13', name: 'Nicolás Erkin',     pos: 'D',  price: 1.1, ratings: { atk: 48, def: 72, mid: 60, fk: 52, pen: 56 } },
  { id: 'p14', name: 'Emre Valeri',       pos: 'D',  price: 1.0, ratings: { atk: 45, def: 70, mid: 58, fk: 65, pen: 62 } },
  { id: 'p15', name: 'Kaan Bazoer',       pos: 'D',  price: 0.9, ratings: { atk: 18, def: 74, mid: 48, fk: 35, pen: 70 } }, // Sürpriz penaltıcı
  { id: 'p16', name: 'Domagoj Tufan',     pos: 'D',  price: 0.8, ratings: { atk: 32, def: 70, mid: 44, fk: 40, pen: 52 } },
  { id: 'p17', name: 'Irfan Crespo',      pos: 'D',  price: 0.6, ratings: { atk: 22, def: 64, mid: 38, fk: 30, pen: 45 } },
  { id: 'p18', name: 'Berat Slimani',     pos: 'D',  price: 0.5, ratings: { atk: 28, def: 60, mid: 42, fk: 38, pen: 48 } },
  { id: 'p19', name: 'Can Hakim',         pos: 'D',  price: 0.3, ratings: { atk: 18, def: 55, mid: 35, fk: 25, pen: 40 } },

  // ── ORTA SAHALAR (OS) - 14 Oyuncu ─────────────────────────
  // OS'ler dengeli. Bazıları frikik uzmanı, bazıları penaltıcı, bazıları topsever.
  { id: 'p20', name: 'Luka Kahveci',      pos: 'OS', price: 2.6, ratings: { atk: 74, def: 70, mid: 85, fk: 90, pen: 72 } }, // Elit frikikçi!
  { id: 'p21', name: 'Kenan Tadic',       pos: 'OS', price: 2.3, ratings: { atk: 68, def: 65, mid: 82, fk: 78, pen: 85 } }, // Hem frikik hem penaltı iyi
  { id: 'p22', name: 'Sofyan Zaniolo',    pos: 'OS', price: 2.0, ratings: { atk: 66, def: 68, mid: 78, fk: 65, pen: 70 } },
  { id: 'p23', name: 'Arda Mertens',      pos: 'OS', price: 1.8, ratings: { atk: 62, def: 75, mid: 80, fk: 58, pen: 65 } },
  { id: 'p24', name: 'Ozan Krunic',       pos: 'OS', price: 1.6, ratings: { atk: 80, def: 50, mid: 68, fk: 72, pen: 78 } }, // Golcü OS + penaltıcı
  { id: 'p25', name: 'Michy Güler',       pos: 'OS', price: 1.5, ratings: { atk: 48, def: 82, mid: 76, fk: 45, pen: 55 } },
  { id: 'p26', name: 'Mauro Aktürkoğlu',  pos: 'OS', price: 1.4, ratings: { atk: 62, def: 45, mid: 72, fk: 55, pen: 58 } },
  { id: 'p27', name: 'Yusuf Oliveira',    pos: 'OS', price: 1.2, ratings: { atk: 58, def: 60, mid: 70, fk: 84, pen: 62 } }, // Frikik uzmanı
  { id: 'p28', name: 'Nacer Valencia',    pos: 'OS', price: 1.1, ratings: { atk: 68, def: 40, mid: 62, fk: 50, pen: 72 } },
  { id: 'p29', name: 'King Yılmaz',       pos: 'OS', price: 0.9, ratings: { atk: 52, def: 65, mid: 66, fk: 48, pen: 58 } },
  { id: 'p30', name: 'Ugurcan Babel',     pos: 'OS', price: 0.8, ratings: { atk: 48, def: 60, mid: 62, fk: 55, pen: 52 } },
  { id: 'p31', name: 'Kerem Sanchez',     pos: 'OS', price: 0.6, ratings: { atk: 52, def: 45, mid: 58, fk: 45, pen: 48 } },
  { id: 'p32', name: 'Cengiz Amrabat',    pos: 'OS', price: 0.5, ratings: { atk: 42, def: 55, mid: 55, fk: 38, pen: 44 } },
  { id: 'p33', name: 'Baris Demirel',     pos: 'OS', price: 0.3, ratings: { atk: 38, def: 45, mid: 50, fk: 32, pen: 40 } },

  // ── FORVETLER (F) - 11 Oyuncu ─────────────────────────────
  // Forvetlerin atk yüksek. Bazılarının pen özelliği de güçlü.
  { id: 'p34', name: 'Edin Benzema',      pos: 'F',  price: 3.2, ratings: { atk: 95, def: 22, mid: 55, fk: 68, pen: 92 } }, // Elit golcü + penaltı
  { id: 'p35', name: 'Kylian Seferovic',  pos: 'F',  price: 2.8, ratings: { atk: 88, def: 28, mid: 50, fk: 55, pen: 80 } },
  { id: 'p36', name: 'Romelu Dzeko',      pos: 'F',  price: 2.4, ratings: { atk: 85, def: 32, mid: 48, fk: 45, pen: 85 } }, // Güçlü penaltıcı
  { id: 'p37', name: 'Lamine İcardi',     pos: 'F',  price: 2.0, ratings: { atk: 86, def: 18, mid: 45, fk: 60, pen: 88 } }, // Penaltı specialisti
  { id: 'p38', name: 'Pedro Batshuayi',   pos: 'F',  price: 1.7, ratings: { atk: 82, def: 22, mid: 44, fk: 52, pen: 75 } },
  { id: 'p39', name: 'Burak Rodrigues',   pos: 'F',  price: 1.5, ratings: { atk: 86, def: 28, mid: 42, fk: 48, pen: 78 } },
  { id: 'p40', name: 'Umut Dabbur',       pos: 'F',  price: 1.2, ratings: { atk: 74, def: 38, mid: 48, fk: 42, pen: 70 } },
  { id: 'p41', name: 'Vinícius Uzun',     pos: 'F',  price: 1.0, ratings: { atk: 72, def: 32, mid: 45, fk: 38, pen: 65 } },
  { id: 'p42', name: 'Haris Güler',       pos: 'F',  price: 0.8, ratings: { atk: 70, def: 22, mid: 40, fk: 35, pen: 62 } },
  { id: 'p43', name: 'Bafétimbi Yılmaz',  pos: 'F',  price: 0.6, ratings: { atk: 65, def: 28, mid: 38, fk: 30, pen: 58 } },
  { id: 'p44', name: 'Sinan Thauvin',     pos: 'F',  price: 0.3, ratings: { atk: 55, def: 18, mid: 32, fk: 28, pen: 50 } },
]