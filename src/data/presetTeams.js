// ============================================================
//  ChronoBall — Hazır Takım Kadroları
//  Her oyuncu: { name, pos }
//  pos: 'K' (Kaleci) | 'D' (Defans) | 'OS' (Orta Saha) | 'F' (Forvet)
// ============================================================

export const PRESET_TEAMS = {
  'Arsenal FC': {
    goalDigit: 7,
    players: [
      { name: 'David Raya',          pos: 'K'  },  // 0
      { name: 'William Saliba',      pos: 'D'  },  // 1
      { name: 'Gabriel Magalhães',   pos: 'D'  },  // 2
      { name: 'Jurriën Timber',      pos: 'D'  },  // 3
      { name: 'Riccardo Calafiori', pos: 'D'  },  // 4
      { name: 'Declan Rice',         pos: 'OS' },  // 5
      { name: 'Martin Ødegaard',     pos: 'OS' },  // 6
      { name: 'Bukayo Saka',         pos: 'OS' },  // 7
      { name: 'Gabriel Martinelli',  pos: 'F'  },  // 8
      { name: 'Viktor Györes',       pos: 'F'  },  // 9
    ],
  },

  'Manchester City': {
    goalDigit: 9,
    players: [
      { name: 'Donnarumma',       pos: 'K'  },  // 0
      { name: 'Joško Gvardiol',   pos: 'D'  },  // 1
      { name: 'Rúben Dias',       pos: 'D'  },  // 2
      { name: 'Marc Guehi',       pos: 'D'  },  // 3
      { name: 'Rayan Aït Nouri',  pos: 'D'  },  // 4
      { name: 'Bernardo Silva',   pos: 'OS' },  // 5
      { name: 'Ryan Cherki',      pos: 'OS' },  // 6
      { name: 'Phil Foden',       pos: 'OS' },  // 7
      { name: 'Omar Marmoush',    pos: 'F'  },  // 8
      { name: 'Erling Haaland',   pos: 'F'  },  // 9
    ],
  },

  'Manchester United': {
    goalDigit: 9,
    players: [
      { name: 'Senne Lammens',      pos: 'K'  },  // 0
      { name: 'Lisandro Martínez',  pos: 'D'  },  // 1
      { name: 'Matthijs de Ligt',   pos: 'D'  },  // 2
      { name: 'Harry Maguire',      pos: 'D'  },  // 3
      { name: 'Diogo Dalot',        pos: 'D'  },  // 4
      { name: 'Casemiro',           pos: 'OS' },  // 5
      { name: 'Kobbie Mainoo',      pos: 'OS' },  // 6
      { name: 'Bruno Fernandes',    pos: 'OS' },  // 7
      { name: 'Amad Diallo',        pos: 'F'  },  // 8
      { name: 'Benjamin Šeško',     pos: 'F'  },  // 9
    ],
  },

  'Galatasaray': {
    goalDigit: 9,
    players: [
      { name: 'Günay Güvenç',          pos: 'K'  },  // 0
      { name: 'Davinson Sánchez',      pos: 'D'  },  // 1
      { name: 'Abdülkerim Bardakcı',   pos: 'D'  },  // 2
      { name: 'Ismail Jakobs',         pos: 'D'  },  // 3
      { name: 'Eren Elmalı',           pos: 'D'  },  // 4
      { name: 'Lucas Torreira',        pos: 'OS' },  // 5
      { name: 'İlkay Gündoğan',        pos: 'OS' },  // 6
      { name: 'Barış Alper Yılmaz',    pos: 'OS' },  // 7
      { name: 'Victor Osimhen',        pos: 'F'  },  // 8
      { name: 'Mauro Icardi',          pos: 'F'  },  // 9
    ],
  },

  'Fenerbahçe': {
    goalDigit: 9,
    players: [
      { name: 'Ederson',               pos: 'K'  },  // 0
      { name: 'Milan Škriniar',        pos: 'D'  },  // 1
      { name: 'Jayden Oosterwolde',    pos: 'D'  },  // 2
      { name: 'Nélson Semedo',         pos: 'D'  },  // 3
      { name: 'Archie Brown',          pos: 'D'  },  // 4
      { name: "N'Golo Kanté",          pos: 'OS' },  // 5
      { name: 'Edson Álvarez',         pos: 'OS' },  // 6
      { name: 'Kerem Aktürkoğlu',      pos: 'OS' },  // 7
      { name: 'Marco Asensio',         pos: 'F'  },  // 8
      { name: 'Nene Dorgelès',         pos: 'F'  },  // 9
    ],
  },

  'Beşiktaş': {
    goalDigit: 9,
    players: [
      { name: 'Ersin Destanoğlu',  pos: 'K'  },  // 0
      { name: 'Gabriel Paulista',  pos: 'D'  },  // 1
      { name: 'Emmanuel Agbadou',  pos: 'D'  },  // 2
      { name: 'Michael Murillo',   pos: 'D'  },  // 3
      { name: 'Felix Uduokhai',    pos: 'D'  },  // 4
      { name: 'Wilfred Ndidi',     pos: 'OS' },  // 5
      { name: 'Orkun Kökçü',       pos: 'OS' },  // 6
      { name: 'Cengiz Ünder',      pos: 'OS' },  // 7
      { name: 'Tammy Abraham',     pos: 'F'  },  // 8
      { name: 'Hyun-Gyu Oh',       pos: 'F'  },  // 9
    ],
  },
}