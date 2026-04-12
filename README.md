# ⚽ ChronoBall

Kronometreye dayalı futbol simülasyonu. Kronometreyi başlatıp durdur — son basamak oyuncuyu, aksiyonu ve golü belirler.

## Teknoloji

- **Vite 5** — build & dev server
- **Vanilla JS (ES Modules)** — framework yok, sıfır runtime dependency
- **Inter** — Google Fonts
- **Neo-Brutal** tasarım sistemi

---

## Geliştirme Ortamı

```bash
# Bağımlılıkları kur
npm install

# Dev server başlat (http://localhost:5173)
npm run dev

# Production build (dist/ klasörüne)
npm run build

# Build önizleme
npm run preview
```

---

## Coolify ile Deploy

### 1. Git Reposu Bağla

Coolify panelinde **New Resource → Public/Private Git Repository** seç.

### 2. Build Ayarları

| Alan | Değer |
|------|-------|
| Build Command | `npm run build` |
| Publish Directory | `dist` |
| Base Directory | *(boş bırak)* |
| Node Version | `20` veya üstü |

### 3. Static Site Seç

Resource tipi olarak **Static Site** seç (Node.js server gerekmez, tamamen statik).

### 4. Deploy

"Deploy" butonuna bas. Coolify `npm run build` çalıştırır ve `dist/` klasörünü serve eder.

### Ortam Değişkeni Gerekmez

Bu uygulama tamamen client-side çalışır. `.env` dosyası gerekmez.

---

## Proje Yapısı

```
chronoball/
├── src/
│   ├── index.html          # Ana HTML (Vite root)
│   ├── main.js             # Uygulama giriş noktası
│   ├── style.css           # Neo-Brutal CSS
│   ├── state/
│   │   └── gameState.js    # Tek gerçek kaynak
│   ├── engine/
│   │   ├── actions.js      # Aksiyon tablosu
│   │   ├── chrono.js       # Kronometre modülü
│   │   └── match.js        # Maç akış motoru
│   ├── ui/
│   │   ├── screens.js      # Ekran yönetimi
│   │   ├── scoreboard.js   # Skor & dakika
│   │   ├── players.js      # Oyuncu listesi
│   │   ├── log.js          # Maç log
│   │   ├── actionPanel.js  # Aksiyon kartı
│   │   ├── chronoHint.js   # İpucu & buton metni
│   │   └── resultScreens.js# Devre/maç sonu ekranları
│   └── utils/
│       ├── audio.js        # Web Audio API ses efektleri
│       └── storage.js      # localStorage maç geçmişi
├── package.json
├── vite.config.js
└── .gitignore
```

---

## Oyun Mekaniği

### 3 Aşamalı Çekim Sistemi

1. **1. Çekim (Oyuncu)** — Kronometreyi başlat ve durdur. Son basamak = oyuncu numarası (0-9)
2. **2. Çekim (Aksiyon)** — Tekrar çek. Son basamak:
   - 0, 4 → Serbest Vuruş
   - 1 → Faul
   - 2 → Sarı Kart
   - 3 → Penaltı *(3. çekim tetiklenir)*
   - 5 → Serbest Vuruş+ *(3. çekim tetiklenir)*
   - 6 → Korner *(3. çekim tetiklenir)*
   - 7 → **Direkt Gol!**
   - 8 → Kırmızı Kart
   - 9 → Ofsayt
3. **3. Çekim (Sonuç)** — Penaltı: 0-4 = Gol, 5-9 = Kaçtı. Serbest/Korner: gol rakamına eşitse Gol!

### Klavye Kısayolları

| Tuş | Eylem |
|-----|-------|
| `SPACE` | Kronometreyi başlat / durdur (ÇEK) |
| `ENTER` | Devam (aksiyon sonrası) |

---

## Lisans

MIT