/* ===========================
   CHRONOBALL - app.js
   =========================== */

// === AKSİYON TABLOSU ===
const ACTIONS = {
  0: { name: 'Serbest Vuruş', icon: '🚩', type: 'normal'   },
  1: { name: 'Faul',          icon: '🦵', type: 'normal'   },
  2: { name: 'Sarı Kart',     icon: '🟨', type: 'sari'     },
  3: { name: 'Penaltı',       icon: '🎯', type: 'penalty'  },
  4: { name: 'Serbest Vuruş', icon: '🚩', type: 'normal'   },
  5: { name: 'Serbest Vuruş+',icon: '⚡', type: 'freekick' },
  6: { name: 'Korner',        icon: '📐', type: 'corner'   },
  7: { name: 'GOL!',          icon: '⚽', type: 'gol'      },
  8: { name: 'Kırmızı Kart',  icon: '🟥', type: 'kirmizi' },
  9: { name: 'Ofsayt',        icon: '🚫', type: 'normal'   }
};

const RANDOM_NAMES = [
  'Altay', 'Djiku', 'Rodrigues', 'Tadic', 'Sanchez',
  'Kahveci', 'Szymanski', 'Bazoer', 'Krunic', 'Valencia',
  'Muslera', 'Nelsson', 'Bardakci', 'Torreira', 'Oliveira',
  'Mertens', 'Zaniolo', 'Aktürkoğlu', 'Seferovic', 'Yılmaz',
  'Livakovic', 'Osayi', 'Zajc', 'Ozan', 'King',
  'Uzun', 'Güler', 'İrfan Can', 'Dzeko', 'İcardi',
  'Crespo', 'Hakim', 'Kenan', 'Batshuayi', 'Angelino',
  'Samet', 'Demirel', 'Babel', 'Slimani', 'Ferdi'
];

// === OYUN DURUMU ===
let gameState = null;

/*
  pullPhase:
    'player'  → 1. çekim bekleniyor (oyuncu belirleme)
    'action'  → 2. çekim bekleniyor (aksiyon belirleme)
    'third'   → 3. çekim bekleniyor (freekick/corner/penalty sonucu)
    'waiting' → aksiyon gösteriliyor, devam bekleniyor
*/
let pullPhase        = 'player';
let selectedPlayer   = null; // { digit, name }
let selectedAction   = null; // { digit, ...ACTIONS[digit] }
let currentPullMinute = 1;   // kronometre saniyesinden hesaplanan görüntü dakikası

// === KRONOMETİR ===
let chronoInterval  = null;
let chronoStartTime = null;
let chronoElapsed   = 0;
let chronoRunning   = false;

// =============================
//   INIT — Config ekranını kur
// =============================
function init() {
  for (let t = 0; t < 2; t++) {
    const container = document.getElementById(`team${t}-players`);
    container.innerHTML = '';
    for (let i = 0; i < 10; i++) {
      const row = document.createElement('div');
      row.className = 'player-row';
      row.innerHTML = `
        <div class="player-number">${i}</div>
        <input type="text" class="player-name-input"
               id="team${t}-player${i}"
               placeholder="Oyuncu ${i}"
               maxlength="20" />
      `;
      container.appendChild(row);
    }
  }
}

// =============================
//   RASTGELE DOLDUR
// =============================
function randomFill(teamIdx) {
  const shuffled = [...RANDOM_NAMES].sort(() => Math.random() - 0.5);
  for (let i = 0; i < 10; i++) {
    const input = document.getElementById(`team${teamIdx}-player${i}`);
    if (input) input.value = shuffled[i] || `Oyuncu ${i}`;
  }
}

// =============================
//   MAÇI BAŞLAT
// =============================
function startMatch() {
  const team0Name = document.getElementById('team0-name').value.trim() || 'Takım 1';
  const team1Name = document.getElementById('team1-name').value.trim() || 'Takım 2';
  const team0Goal = parseInt(document.getElementById('team0-goal-digit').value);
  const team1Goal = parseInt(document.getElementById('team1-goal-digit').value);

  const buildTeam = (t, name, goalDigit) => {
    const players = [];
    for (let i = 0; i < 10; i++) {
      const inp = document.getElementById(`team${t}-player${i}`);
      players.push({
        name:        inp && inp.value.trim() ? inp.value.trim() : `Oyuncu ${i}`,
        yellowCards: 0,
        redCard:     false
      });
    }
    return { name, goalDigit, players, score: 0 };
  };

  gameState = {
    phase:      'first-half',
    minute:     1,
    activeTeam: 0,
    teams: [
      buildTeam(0, team0Name, team0Goal),
      buildTeam(1, team1Name, team1Goal)
    ],
    log: [],
    stats: {
      0: { goals: 0, yellowCards: 0, redCards: 0, penalties: 0 },
      1: { goals: 0, yellowCards: 0, redCards: 0, penalties: 0 }
    }
  };

  pullPhase      = 'player';
  selectedPlayer = null;
  selectedAction = null;

  resetChrono();
  showScreen('match');
  updateMatchUI();
  renderPlayersStatus();
  setChronoHint('player');
}

// =============================
//   EKRAN YÖNETİMİ
// =============================
function showScreen(name) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(`screen-${name}`).classList.add('active');
}

// =============================
//   KRONOMETİR
// =============================
function startChrono() {
  chronoStartTime = Date.now() - chronoElapsed;
  chronoRunning   = true;
  chronoInterval  = setInterval(tickChrono, 10);
  document.getElementById('chrono-display').classList.add('running');
  document.getElementById('btn-pull-text').textContent = '🛑 DURDUR!';
}

function stopChrono() {
  clearInterval(chronoInterval);
  chronoRunning = false;
  chronoElapsed = Date.now() - chronoStartTime;

  // Önce tickChrono'yu manuel tetikle — en güncel değeri yaz
  tickChrono();

  document.getElementById('chrono-display').classList.remove('running');

  // Dakikayı ekrandaki SS.CC değerinden hesapla
  const display    = document.getElementById('chrono-display').textContent; // "SS.CC"
  const dispSecs   = parseInt(display.split('.')[0], 10);
  if (gameState && gameState.phase === 'second-half') {
    currentPullMinute = Math.min(45 + dispSecs + 1, 90);
  } else {
    currentPullMinute = Math.min(dispSecs + 1, 45);
  }

  return getLastDigit();
}

function resetChrono() {
  clearInterval(chronoInterval);
  chronoRunning = false;
  chronoElapsed = 0;
  const disp = document.getElementById('chrono-display');
  if (disp) {
    disp.textContent = '00.00';
    disp.classList.remove('running');
  }
  const btn = document.getElementById('btn-pull');
  if (btn) {
    btn.disabled = false;
    btn.classList.remove('second-pull');
  }
}

function tickChrono() {
  chronoElapsed = Date.now() - chronoStartTime;
  const totalCs = Math.floor(chronoElapsed / 10);
  const secs    = Math.floor(totalCs / 100) % 100;
  const cs      = totalCs % 100;
  document.getElementById('chrono-display').textContent =
    String(secs).padStart(2, '0') + '.' + String(cs).padStart(2, '0');
}

function getLastDigit() {
  const txt = document.getElementById('chrono-display').textContent;
  return parseInt(txt.charAt(txt.length - 1));
}

// İpucu ve buton metnini güncelle
function setChronoHint(phase) {
  const hint   = document.getElementById('chrono-hint');
  const btnTxt = document.getElementById('btn-pull-text');
  const btn    = document.getElementById('btn-pull');

  btn.classList.remove('second-pull');

  if (phase === 'player') {
    hint.textContent    = '1. Çekim: Oyuncuyu belirle (son basamak = oyuncu no)';
    btnTxt.textContent  = '⚽ ÇEK! (Oyuncu)';
  } else if (phase === 'action') {
    hint.textContent    = '2. Çekim: Aksiyonu belirle (son basamak = aksiyon)';
    btnTxt.textContent  = '⚡ ÇEK! (Aksiyon)';
    btn.classList.add('second-pull');
  } else if (phase === 'third') {
    hint.textContent    = '3. Çekim: Gol/Sonuç belirle!';
    btnTxt.textContent  = '🎯 ÇEK! (Sonuç)';
    btn.classList.add('second-pull');
  } else if (phase === 'waiting') {
    hint.textContent    = 'Devam etmek için butona bas';
  }
}

// =============================
//   ANA ÇEKİM HANDLER
// =============================
function handlePull() {
  if (pullPhase === 'waiting') return;

  if (chronoRunning) {
    const digit = stopChrono();
    processDigit(digit);
  } else {
    document.getElementById('action-panel').style.display = 'none';
    startChrono();
  }
}

// =============================
//   DİJİT İŞLEME (3 AŞAMA)
// =============================
function processDigit(digit) {
  if (pullPhase === 'player') {
    processPlayerPull(digit);
  } else if (pullPhase === 'action') {
    processActionPull(digit);
  } else if (pullPhase === 'third') {
    processThirdPull(digit);
  }
}

// --- AŞAMA 1: OYUNCU ---
function processPlayerPull(digit) {
  const teamIdx = gameState.activeTeam;
  const team    = gameState.teams[teamIdx];
  const player  = team.players[digit];

  // Kırmızı kartlı oyuncu geldi → sıra rakibe geçer
  if (player.redCard) {
    showAction(
      `❌ Kırmızı Kartlı Oyuncu!`,
      `${player.name} (${digit}) sahada değil — Sıra ${gameState.teams[1 - teamIdx].name}'a geçti`,
      'normal',
      true
    );
    addLog(currentPullMinute, teamIdx, digit, 'skip', `${player.name} (${digit}) sahada yok`);
    pullPhase = 'waiting';
    return;
  }

  // Oyuncu seçildi, 2. çekime geç
  selectedPlayer = { digit, name: player.name };
  pullPhase = 'action';

  // Bilgi panelinde oyuncuyu göster, devam butonu yok
  showAction(
    `👤 ${player.name} (${digit})`,
    `${team.name} oyuncusu seçildi — Aksiyonu belirlemek için tekrar çek!`,
    'normal',
    false
  );

  setChronoHint('action');
}

// --- AŞAMA 2: AKSİYON ---
function processActionPull(digit) {
  const teamIdx = gameState.activeTeam;
  const team    = gameState.teams[teamIdx];
  const action  = ACTIONS[digit];
  const player  = team.players[selectedPlayer.digit];

  selectedAction = { digit, ...action };

  switch (action.type) {

    case 'gol':
      scoreGoal(teamIdx, selectedPlayer.digit, 'direct');
      break;

    case 'sari':
      giveYellowCard(teamIdx, selectedPlayer.digit);
      break;

    case 'kirmizi':
      giveRedCard(teamIdx, selectedPlayer.digit);
      break;

    case 'penalty':
      showAction(
        `🎯 Penaltı! — ${selectedPlayer.name} (${selectedPlayer.digit})`,
        `0-4 → Gol  |  5-9 → Kaçtı  →  Tekrar çek!`,
        'normal',
        false
      );
      pullPhase = 'third';
      setChronoHint('third');
      break;

    case 'freekick':
      showAction(
        `⚡ Serbest Vuruş! — ${selectedPlayer.name} (${selectedPlayer.digit})`,
        `Gol rakamı: ${team.goalDigit}  →  Tekrar çek!`,
        'normal',
        false
      );
      pullPhase = 'third';
      setChronoHint('third');
      break;

    case 'corner':
      showAction(
        `📐 Korner! — ${selectedPlayer.name} (${selectedPlayer.digit})`,
        `Gol rakamı: ${team.goalDigit}  →  Tekrar çek!`,
        'normal',
        false
      );
      pullPhase = 'third';
      setChronoHint('third');
      break;

    default:
      // Taç, Faul, Ofsayt
      showAction(
        `${action.icon} ${action.name}`,
        `${selectedPlayer.name} (${selectedPlayer.digit})`,
        'normal',
        true
      );
      addLog(currentPullMinute, teamIdx, selectedPlayer.digit, 'normal',
             `${action.name} — ${selectedPlayer.name} (${selectedPlayer.digit})`);
      pullPhase = 'waiting';
      break;
  }
}

// --- AŞAMA 3: SONUÇ (Penaltı / Serbest / Korner) ---
function processThirdPull(digit) {
  const teamIdx = gameState.activeTeam;
  const team    = gameState.teams[teamIdx];
  const aType   = selectedAction.type;

  if (aType === 'penalty') {
    if (digit <= 4) {
      team.score++;
      gameState.stats[teamIdx].goals++;
      gameState.stats[teamIdx].penalties++;
      showAction(
        `⚽🥅 Penaltıdan GOL!`,
        `${selectedPlayer.name} (${selectedPlayer.digit}) — ${currentPullMinute}. dakika`,
        'gol',
        true
      );
      addLog(currentPullMinute, teamIdx, selectedPlayer.digit, 'gol',
             `Penaltıdan GOL! — ${selectedPlayer.name} (${digit})`);
      updateScoreboard();
    } else {
      showAction(
        `🥅 Penaltı Kaçtı!`,
        `${selectedPlayer.name} — ${digit} geldi, kurtarıldı`,
        'normal',
        true
      );
      addLog(currentPullMinute, teamIdx, selectedPlayer.digit, 'normal',
             `Penaltı kaçtı — ${selectedPlayer.name} (${digit})`);
    }

  } else if (aType === 'freekick' || aType === 'corner') {
    const label = aType === 'freekick' ? 'Serbest Vuruştan' : 'Kornerden';
    const icon  = aType === 'freekick' ? '⚡' : '📐';

    if (digit === team.goalDigit) {
      team.score++;
      gameState.stats[teamIdx].goals++;
      showAction(
        `⚽🥅 ${label} GOL!`,
        `${selectedPlayer.name} (${selectedPlayer.digit}) — ${currentPullMinute}. dakika`,
        'gol',
        true
      );
      addLog(currentPullMinute, teamIdx, selectedPlayer.digit, 'gol',
             `${label} GOL! — ${selectedPlayer.name}`);
      updateScoreboard();
    } else {
      showAction(
        `${icon} ${label.replace('tan','').replace('den','')} — Gol Yok`,
        `${digit} geldi, gol rakamı ${team.goalDigit}`,
        'normal',
        true
      );
      addLog(currentPullMinute, teamIdx, selectedPlayer.digit, 'normal',
             `${label.replace('tan','').replace('den','')} gol yok — ${selectedPlayer.name} (${digit})`);
    }
  }

  pullPhase = 'waiting';
}

// =============================
//   GOL
// =============================
function scoreGoal(teamIdx, playerDigit, source) {
  const team   = gameState.teams[teamIdx];
  const player = team.players[playerDigit];

  team.score++;
  gameState.stats[teamIdx].goals++;

  showAction(
    `⚽🥅 GOL!`,
    `${player.name} (${playerDigit}) — ${currentPullMinute}. dakika`,
    'gol',
    true
  );
  addLog(currentPullMinute, teamIdx, playerDigit, 'gol',
         `GOL! — ${player.name} (${playerDigit})`);
  updateScoreboard();
  pullPhase = 'waiting';
}

// =============================
//   KARTLAR
// =============================
function giveYellowCard(teamIdx, playerDigit) {
  const team   = gameState.teams[teamIdx];
  const player = team.players[playerDigit];

  player.yellowCards++;
  gameState.stats[teamIdx].yellowCards++;

  if (player.yellowCards >= 2 && !player.redCard) {
    player.redCard = true;
    gameState.stats[teamIdx].redCards++;
    showAction(
      `🟨🟥 İkinci Sarı = Kırmızı!`,
      `${player.name} (${playerDigit}) oyun dışı!`,
      'kart',
      true
    );
    addLog(currentPullMinute, teamIdx, playerDigit, 'kart',
           `2. Sarı → Kırmızı Kart — ${player.name} (${playerDigit})`);
  } else {
    showAction(
      `🟨 Sarı Kart`,
      `${player.name} (${playerDigit})`,
      'sari',
      true
    );
    addLog(currentPullMinute, teamIdx, playerDigit, 'sari',
           `Sarı Kart — ${player.name} (${playerDigit})`);
  }
  renderPlayersStatus();
  pullPhase = 'waiting';
}

function giveRedCard(teamIdx, playerDigit) {
  const team   = gameState.teams[teamIdx];
  const player = team.players[playerDigit];

  player.redCard = true;
  gameState.stats[teamIdx].redCards++;

  showAction(
    `🟥 Kırmızı Kart!`,
    `${player.name} (${playerDigit}) oyun dışı! Sıra rakibe geçer.`,
    'kart',
    true
  );
  addLog(currentPullMinute, teamIdx, playerDigit, 'kart',
         `Kırmızı Kart — ${player.name} (${playerDigit})`);
  renderPlayersStatus();
  pullPhase = 'waiting';
}

// =============================
//   AKSİYON PANELİ
// =============================
function showAction(title, subtitle, cssType, showContinue) {
  const panel    = document.getElementById('action-panel');
  const result   = document.getElementById('action-result');
  const playerEl = document.getElementById('action-player');
  const btnCont  = document.getElementById('btn-continue');

  result.textContent   = title;
  result.className     = `action-result ${cssType}`;
  playerEl.textContent = subtitle;
  btnCont.style.display = showContinue ? 'inline-block' : 'none';
  panel.style.display  = 'block';
}

// =============================
//   DEVAM BUTONU
// =============================
function continueAction() {
  document.getElementById('action-panel').style.display = 'none';

  // Sıra değişimi
  gameState.activeTeam = 1 - gameState.activeTeam;
  gameState.minute++;

  // Devre / maç sonu kontrolü — currentPullMinute kronometreye dayalı
  if (gameState.phase === 'first-half' && currentPullMinute >= 45) {
    goToHalftime();
    return;
  }
  if (gameState.phase === 'second-half' && currentPullMinute >= 90) {
    goToFulltime();
    return;
  }

  // Bir sonraki tura hazırlan
  pullPhase      = 'player';
  selectedPlayer = null;
  selectedAction = null;

  setChronoHint('player');
  updateMatchUI();
}

// =============================
//   LOG
// =============================
function addLog(minute, teamIdx, playerDigit, type, text) {
  const entry = { minute, teamIdx, playerDigit, type, text };
  gameState.log.push(entry);

  const logEl = document.getElementById('match-log');
  logEl.prepend(buildLogItem(entry));
}

function buildLogItem(entry) {
  const typeClass = {
    gol:    'log-gol',
    kart:   'log-kart',
    sari:   'log-sari',
    skip:   'log-skip',
    normal: ''
  }[entry.type] || '';

  const icon = {
    gol:    '⚽',
    kart:   '🟥',
    sari:   '🟨',
    skip:   '❌',
    normal: '▸'
  }[entry.type] || '▸';

  const teamName = gameState.teams[entry.teamIdx].name;

  const div = document.createElement('div');
  div.className = `log-item ${typeClass}`;
  div.innerHTML = `
    <span class="log-minute">${entry.minute}'</span>
    <span class="log-icon">${icon}</span>
    <span class="log-text"><strong>${teamName}</strong> — ${entry.text}</span>
  `;
  return div;
}

// =============================
//   UI GÜNCELLEME
// =============================
function updateMatchUI() {
  const isFirst   = gameState.phase === 'first-half';
  const halfLabel = isFirst ? '1. Yarı' : '2. Yarı';

  document.getElementById('match-minute').textContent     = `${currentPullMinute}. Dakika`;
  document.getElementById('match-half').textContent       = halfLabel;
  document.getElementById('match-team0-name').textContent = gameState.teams[0].name;
  document.getElementById('match-team1-name').textContent = gameState.teams[1].name;
  document.getElementById('active-team-name').textContent = gameState.teams[gameState.activeTeam].name;

  // Sütun başlıkları
  const pt0 = document.getElementById('panel-title-0');
  const pt1 = document.getElementById('panel-title-1');
  if (pt0) pt0.textContent = gameState.teams[0].name;
  if (pt1) pt1.textContent = gameState.teams[1].name;

  updateScoreboard();
}

function updateScoreboard() {
  document.getElementById('score0').textContent = gameState.teams[0].score;
  document.getElementById('score1').textContent = gameState.teams[1].score;
}

function renderPlayersStatus() {
  for (let t = 0; t < 2; t++) {
    const container = document.getElementById(`players-status-${t}`);
    const team      = gameState.teams[t];
    container.innerHTML = `<div class="players-status-title">${team.name}</div>`;

    for (let i = 0; i < 10; i++) {
      const p     = team.players[i];
      const badge = document.createElement('span');
      badge.className = 'player-badge';

      if (p.redCard) {
        badge.classList.add('red-card');
        badge.innerHTML = `<span class="pnum">${i}</span> ${p.name} 🟥`;
      } else if (p.yellowCards === 1) {
        badge.classList.add('yellow-card');
        badge.innerHTML = `<span class="pnum">${i}</span> ${p.name} 🟨`;
      } else {
        badge.innerHTML = `<span class="pnum">${i}</span> ${p.name}`;
      }
      container.appendChild(badge);
    }
  }
}

// =============================
//   DEVRE ARASI
// =============================
function goToHalftime() {
  clearInterval(chronoInterval);
  gameState.phase = 'halftime';

  document.getElementById('ht-team0-name').textContent = gameState.teams[0].name;
  document.getElementById('ht-team1-name').textContent = gameState.teams[1].name;
  document.getElementById('ht-score0').textContent     = gameState.teams[0].score;
  document.getElementById('ht-score1').textContent     = gameState.teams[1].score;

  const logEl    = document.getElementById('halftime-log');
  const htEvents = gameState.log.filter(e => e.type !== 'normal' && e.type !== 'skip');

  if (htEvents.length === 0) {
    logEl.innerHTML = '<p style="color:rgba(255,255,255,0.4);font-size:0.85rem;text-align:center;">Kayda değer olay yok.</p>';
  } else {
    logEl.innerHTML = '';
    htEvents.forEach(e => logEl.appendChild(buildLogItem(e)));
  }

  showScreen('halftime');
}

function startSecondHalf() {
  gameState.phase      = 'second-half';
  gameState.minute     = 46;
  gameState.activeTeam = 1 - gameState.activeTeam; // Devre arasında taraf değişir

  pullPhase      = 'player';
  selectedPlayer = null;
  selectedAction = null;

  document.getElementById('match-log').innerHTML = '';
  resetChrono();
  showScreen('match');
  updateMatchUI();
  renderPlayersStatus();
  setChronoHint('player');
}

// =============================
//   MAÇ SONU
// =============================
function goToFulltime() {
  clearInterval(chronoInterval);
  gameState.phase = 'fulltime';

  const s0 = gameState.teams[0].score;
  const s1 = gameState.teams[1].score;
  const n0 = gameState.teams[0].name;
  const n1 = gameState.teams[1].name;

  document.getElementById('ft-team0-name').textContent = n0;
  document.getElementById('ft-team1-name').textContent = n1;
  document.getElementById('ft-score0').textContent     = s0;
  document.getElementById('ft-score1').textContent     = s1;

  let resultText;
  if (s0 > s1)      resultText = `🏆 ${n0} Kazandı!`;
  else if (s1 > s0) resultText = `🏆 ${n1} Kazandı!`;
  else               resultText = `🤝 Beraberlik!`;
  document.getElementById('fulltime-result-text').textContent = resultText;

  const st = gameState.stats;
  document.getElementById('fulltime-stats-content').innerHTML = `
    <div class="fulltime-stats-grid">
      <span class="stat-value stat-team0">${st[0].goals}</span>
      <span class="stat-label">Gol</span>
      <span class="stat-value stat-team1">${st[1].goals}</span>

      <span class="stat-value stat-team0">${st[0].yellowCards}</span>
      <span class="stat-label">Sarı Kart</span>
      <span class="stat-value stat-team1">${st[1].yellowCards}</span>

      <span class="stat-value stat-team0">${st[0].redCards}</span>
      <span class="stat-label">Kırmızı Kart</span>
      <span class="stat-value stat-team1">${st[1].redCards}</span>

      <span class="stat-value stat-team0">${st[0].penalties}</span>
      <span class="stat-label">Penaltı Golü</span>
      <span class="stat-value stat-team1">${st[1].penalties}</span>
    </div>
  `;

  const logEl     = document.getElementById('fulltime-log');
  const important = gameState.log.filter(e => e.type !== 'normal' && e.type !== 'skip');

  if (important.length === 0) {
    logEl.innerHTML = '<p style="color:rgba(255,255,255,0.4);font-size:0.85rem;text-align:center;">Kayda değer olay yok.</p>';
  } else {
    logEl.innerHTML = '';
    important.forEach(e => logEl.appendChild(buildLogItem(e)));
  }

  showScreen('fulltime');
}

// =============================
//   YENİ MAÇ
// =============================
function newMatch() {
  clearInterval(chronoInterval);
  chronoElapsed  = 0;
  chronoRunning  = false;
  gameState      = null;
  pullPhase      = 'player';
  selectedPlayer = null;
  selectedAction = null;

  document.getElementById('match-log').innerHTML        = '';
  document.getElementById('action-panel').style.display = 'none';

  showScreen('config');
  resetChrono();
}

// =============================
//   BAŞLAT
// =============================
init();