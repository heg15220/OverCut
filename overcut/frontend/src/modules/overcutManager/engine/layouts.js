/**
 * Every venue Formula 1 has raced at, sketched from memory.
 *
 * These are not track maps. Each circuit is a loop of corner points drawn on a
 * 100 x 100 sheet - roughly where each corner is, in the order a car meets
 * them, with the corner's radius in metres - the way a fan would sketch it on a
 * napkin. `trackGeometry.js` rounds the corners, scales the loop to the real lap
 * length and simulates a lap on it. The result looks and races like the place
 * (Monaco's hairpin, Monza's straights, Suzuka's crossover) without being a
 * copy of anyone's drawing of it.
 *
 *   key       f1db circuit reference, as the generated reference tables carry.
 *   km        lap length of that version, in kilometres.
 *   sketch    "x y r; x y r; ..." - corner points in driving order. The first
 *             leg (point 0 to point 1) is the start/finish straight.
 *   start     how far along that first leg the line sits (default 0.62).
 *   from/to   years a version was used, where a circuit changed shape enough
 *             to matter. The newest version is the fallback.
 *   names     corner names by number, where the corner has one everybody uses.
 *
 * Radii: ~10 a hairpin, 20-30 slow, 40-80 medium, 100-200 fast, 300+ a kink.
 */

const L = (km, sketch, extra = {}) => ({ km, sketch, ...extra });

export const LAYOUTS = {
  monza: [
    L(5.75, "22 90 110; 26 14 260; 45 10 260; 64 16 200; 78 30 55; 82 41 50; 70 58 500; 56 68 220; 36 86 300; 30 96 70", {
      to: 1971, names: { 1: "Curva Grande", 2: "Lesmo", 4: "Vialone", 5: "Parabolica" },
    }),
    L(5.793, "22 90 110; 25 18 14; 29 14 14; 42 11 300; 62 16 200; 66 22 14; 69 25 14; 78 31 55; 82 41 50; 70 58 500; 58 66 22; 55 70 35; 50 72 60; 36 86 300; 30 96 70", {
      from: 1972, names: { 1: "Rettifilo", 3: "Curva Grande", 4: "Roggia", 6: "Lesmo 1", 7: "Lesmo 2", 9: "Ascari", 12: "Parabolica" },
    }),
  ],
  monaco: [
    L(3.337, "16 81 16; 22 40 16; 45 22 160; 58 12 45; 66 13 28; 74 24 16; 82 30 7; 80 38 16; 90 44 18; 70 66 130; 52 72 14; 47 70 14; 38 74 35; 33 70 20; 30 75 20; 26 73 18; 23 84 10", {
      start: 0.45, names: { 1: "Sainte Dévote", 3: "Massenet", 4: "Casino", 5: "Mirabeau", 6: "Fairmont", 8: "Portier", 9: "Túnel", 10: "Nouvelle Chicane", 12: "Tabac", 13: "Piscina", 17: "Rascasse" },
    }),
  ],
  silverstone: [
    L(4.719, "18 72 90; 33 30 75; 44 24 160; 52 19 60; 58 24 120; 88 54 75; 72 82 65; 52 89 160", {
      to: 1990, names: { 1: "Woodcote", 2: "Copse", 3: "Maggotts", 4: "Becketts", 5: "Chapel", 6: "Stowe", 7: "Club", 8: "Abbey" },
    }),
    L(5.14, "16 74 90; 32 30 75; 43 24 160; 51 19 55; 58 24 120; 88 54 75; 74 80 50; 54 88 120; 42 92 160; 34 89 28; 28 94 25; 18 90 32", {
      from: 1991, to: 2009, names: { 1: "Woodcote", 2: "Copse", 3: "Maggotts", 4: "Becketts", 5: "Chapel", 6: "Stowe", 7: "Club", 8: "Abbey", 9: "Bridge", 10: "Priory", 11: "Brooklands", 12: "Luffield" },
    }),
    L(5.891, "78 80 35; 60 92 130; 52 92 220; 44 95 26; 36 90 14; 30 83 60; 16 90 28; 9 82 30; 13 68 100; 29 32 70; 41 26 160; 49 20 55; 56 24 110; 88 52 75; 84 68 18", {
      from: 2010, start: 0.4, names: { 1: "Abbey", 2: "Farm", 3: "Village", 4: "The Loop", 5: "Aintree", 6: "Brooklands", 7: "Luffield", 8: "Woodcote", 9: "Copse", 10: "Maggotts", 11: "Becketts", 12: "Chapel", 13: "Stowe", 14: "Vale", 15: "Club" },
    }),
  ],
  spa: [
    L(14.1, "32 46 250; 20 22 14; 28 38 80; 33 31 100; 62 10 150; 80 20 160; 86 38 90; 90 62 120; 92 67 120; 88 88 45; 60 78 500", {
      to: 1970, start: 0.55, names: { 1: "La Source", 2: "Eau Rouge", 4: "Les Combes", 5: "Burnenville", 6: "Malmedy", 7: "Masta", 9: "Stavelot", 10: "Blanchimont" },
    }),
    L(7.004, "24 40 14; 20 22 14; 28 36 80; 32 30 100; 60 10 25; 64 12 25; 68 20 40; 72 32 16; 64 40 70; 62 56 90; 70 64 90; 80 68 40; 84 74 40; 82 86 60; 60 84 400; 40 70 280; 30 48 12", {
      from: 1983, start: 0.5, names: { 1: "La Source", 2: "Eau Rouge", 3: "Raidillon", 4: "Les Combes", 7: "Rivage", 9: "Pouhon", 11: "Fagnes", 13: "Stavelot", 15: "Blanchimont", 16: "Chicane" },
    }),
  ],
  villeneuve: [
    L(4.361, "61 49 13; 10 36 25; 6 44 16; 16 58 200; 28 64 22; 32 60 22; 46 66 250; 56 72 24; 60 68 24; 80 74 400; 95 70 9; 66 53 13", {
      names: { 1: "Senna", 6: "Chicane", 9: "Épingle", 10: "Mur des Champions" },
    }),
  ],
  nurburgring: [
    L(22.8, "30 40 60; 44 34 120; 52 26 40; 60 22 80; 68 14 30; 78 12 60; 88 18 40; 92 28 80; 86 36 25; 90 44 60; 84 52 40; 88 60 20; 80 66 70; 72 62 40; 66 70 10; 60 78 60; 52 74 40; 46 82 30; 38 88 120; 28 84 40; 22 90 60; 12 84 30; 8 72 80; 14 62 40; 10 52 60; 18 44 30", {
      to: 1976, start: 0.5, names: { 1: "Südkehre", 5: "Flugplatz", 9: "Bergwerk", 15: "Karussell", 21: "Brünnchen", 24: "Döttinger Höhe" },
    }),
    L(5.148, "14 52 30; 78 30 18; 84 38 30; 76 44 22; 82 52 40; 78 62 80; 88 84 14; 70 82 120; 60 72 80; 54 62 80; 40 64 200; 30 58 18; 26 54 18", {
      from: 1984, start: 0.45, names: { 1: "Castrol-S", 3: "Mercedes Arena", 6: "Dunlop", 8: "Schumacher-S", 11: "Veedol" },
    }),
  ],
  interlagos: [
    L(7.96, "84 64 250; 76 26 120; 60 12 20; 50 18 25; 30 16 200; 10 30 90; 8 50 60; 18 62 40; 30 56 40; 40 66 30; 32 78 15; 46 86 60; 58 76 35; 62 62 50; 72 76 45", {
      to: 1980, start: 0.4, names: { 1: "Curva 1", 3: "Curva 3", 5: "Retão", 6: "Ferradura", 10: "Bico de Pato", 12: "Mergulho", 14: "Junção" },
    }),
    L(4.309, "80 66 250; 70 30 250; 58 22 16; 52 30 22; 40 40 120; 12 64 30; 16 74 40; 30 72 60; 38 66 60; 48 58 40; 52 70 22; 44 82 13; 58 88 50; 76 80 30", {
      from: 1990, start: 0.35, names: { 1: "S do Senna", 3: "Curva do Sol", 4: "Descida do Lago", 6: "Ferradura", 8: "Laranjinha", 9: "Pinheirinho", 10: "Bico de Pato", 11: "Mergulho", 12: "Junção" },
    }),
  ],
  hungaroring: [
    L(4.381, "14 70 40; 80 72 18; 84 54 30; 74 44 40; 60 36 300; 48 30 80; 40 40 30; 44 52 14; 40 56 14; 30 50 30; 26 40 30; 22 26 60; 14 30 25; 8 46 28; 10 60 35", {
      names: { 1: "Curva 1", 2: "Curva 2", 4: "Curva 4", 14: "Curva 14" },
    }),
  ],
  red_bull_ring: [
    L(5.91, "20 74 150; 60 82 200; 82 60 25; 88 30 120; 76 12 90; 50 10 200; 34 18 60; 22 30 300; 12 50 120", {
      to: 1987, start: 0.5, names: { 1: "Hella-Licht", 3: "Dr. Tiroch", 5: "Bosch", 7: "Texaco", 9: "Jochen Rindt" },
    }),
    L(4.318, "14 76 50; 56 82 40; 80 50 300; 92 14 15; 60 30 20; 52 46 70; 40 52 70; 34 40 40; 22 46 40; 16 60 60", {
      from: 1997, names: { 1: "Niki Lauda", 2: "Remus", 3: "Schlossgold", 6: "Rauch", 7: "Würth", 9: "Rindt" },
    }),
  ],
  hockenheimring: [
    L(6.823, "16 62 30; 18 40 30; 55 22 800; 60 20 14; 64 22 14; 90 30 500; 96 44 90; 90 56 80; 70 66 500; 64 64 14; 60 67 14; 34 74 600; 28 76 40; 22 70 35; 16 78 25", {
      to: 2001, start: 0.5, names: { 1: "Nordkurve", 3: "Jim Clark", 5: "Ostkurve", 7: "Senna", 9: "Agip", 10: "Sachs", 11: "Südkurve" },
    }),
    L(4.574, "16 64 30; 18 42 30; 30 34 60; 70 20 400; 86 26 14; 72 40 40; 60 46 40; 54 58 30; 40 62 60; 32 72 30; 24 66 30; 18 74 25", {
      from: 2002, start: 0.5, names: { 1: "Nordkurve", 3: "Parabolika", 4: "Spitzkehre", 6: "Mobil 1", 8: "Sachs", 10: "Südkurve" },
    }),
  ],
  zandvoort: [
    L(4.259, "18 64 80; 70 72 18; 60 60 60; 54 48 25; 70 40 100; 80 26 40; 70 18 90; 52 22 200; 40 28 40; 30 36 30; 22 30 40; 10 40 60; 12 52 60", {
      names: { 1: "Tarzan", 2: "Gerlach", 3: "Hugenholtz", 4: "Hunserug", 5: "Slotemaker", 6: "Scheivlak", 9: "Hans Ernst", 13: "Arie Luyendyk" },
    }),
  ],
  suzuka: [
    L(5.807, "82 72 50; 24 74 70; 12 62 30; 20 52 60; 14 44 60; 22 36 60; 18 26 80; 34 18 60; 40 22 25; 54 48 300; 62 58 12; 66 46 150; 88 22 40; 92 32 40; 36 52 130; 40 64 12; 46 66 12", {
      start: 0.55, names: { 1: "Curva 1", 3: "Eses", 6: "Dunlop", 7: "Degner", 9: "Horquilla", 11: "Spoon", 13: "130R", 14: "Chicane Casio" },
    }),
  ],
  catalunya: [
    L(4.675, "16 70 60; 80 74 30; 84 66 40; 70 50 120; 82 36 20; 70 24 40; 52 30 60; 40 22 50; 28 14 100; 14 22 40; 20 40 300; 34 52 18; 44 50 40; 40 60 20; 32 62 14; 26 66 14", {
      start: 0.55, names: { 1: "Elf", 3: "Renault", 4: "Repsol", 5: "Seat", 8: "Campsa", 9: "La Caixa", 11: "Banc Sabadell", 13: "Chicane" },
    }),
  ],
  imola: [
    L(4.909, "80 70 300; 24 74 22; 20 70 22; 10 60 160; 8 40 18; 20 24 50; 34 22 40; 44 30 60; 60 20 30; 66 26 30; 80 18 60; 90 30 20; 92 42 20; 86 52 60", {
      start: 0.45, names: { 1: "Tamburello", 3: "Villeneuve", 4: "Tosa", 5: "Piratella", 7: "Acque Minerali", 9: "Variante Alta", 11: "Rivazza" },
    }),
  ],
  albert_park: [
    L(5.278, "24 70 30; 60 74 20; 64 68 30; 82 62 18; 86 54 20; 80 40 200; 84 28 40; 70 16 200; 52 10 40; 44 14 40; 30 20 300; 24 28 60; 20 34 60; 10 44 30; 14 58 30", {
      names: { 1: "Brabham", 3: "Whiteford", 6: "Lauda", 9: "Clark", 11: "Waite", 13: "Ascari", 14: "Prost" },
    }),
  ],
  rodriguez: [
    L(4.421, "8 30 300; 80 24 18; 84 30 18; 78 38 30; 60 44 20; 54 52 20; 60 60 40; 52 66 60; 44 60 60; 36 66 60; 28 60 60; 14 70 80; 8 52 80", {
      to: 1992, start: 0.5, names: { 1: "Curva 1", 4: "Curva 4", 7: "Eses", 11: "Peraltada" },
    }),
    L(4.304, "8 30 300; 80 24 18; 84 30 18; 78 38 30; 60 44 20; 54 52 20; 60 60 40; 52 66 60; 44 60 60; 36 66 60; 28 60 60; 20 72 15; 14 78 15; 6 70 20; 6 48 70", {
      from: 1993, start: 0.5, names: { 1: "Curva 1", 4: "Curva 4", 7: "Eses", 11: "Foro Sol", 14: "Peraltada" },
    }),
  ],
  bahrain: [
    L(5.412, "14 70 35; 80 74 14; 86 64 30; 80 54 60; 88 40 25; 78 30 60; 66 36 60; 56 26 14; 48 36 30; 44 48 18; 32 52 40; 22 40 150; 36 22 20; 8 14 18; 6 40 200", {
      start: 0.5, names: { 1: "Curva 1", 4: "Curva 4", 8: "Curva 8", 10: "Curva 10", 13: "Curva 13", 14: "Curva 14" },
    }),
  ],
  galvez: [
    L(3.91, "14 30 60; 80 26 20; 88 38 40; 78 50 30; 60 46 60; 50 58 25; 60 70 60; 46 80 30; 30 74 40; 20 60 30; 10 48 50", {
      names: { 1: "Ascari", 3: "Ombú", 6: "Horquilla", 9: "Senna" },
    }),
  ],
  watkins_glen: [
    L(5.435, "30 80 40; 22 30 30; 40 16 120; 60 14 160; 78 24 40; 88 40 30; 76 50 30; 84 64 60; 72 82 30; 58 70 30; 46 84 40", {
      names: { 1: "The 90", 2: "Esses", 5: "The Boot", 9: "Toe", 10: "Heel" },
    }),
  ],
  kyalami: [
    L(4.104, "10 40 150; 76 30 70; 88 44 40; 80 60 90; 66 70 30; 50 64 60; 40 74 80; 24 70 40; 14 58 60", {
      to: 1985, names: { 1: "Crowthorne", 2: "Barbecue", 3: "Jukskei", 4: "Sunset", 5: "Clubhouse", 7: "Leeukop" },
    }),
    L(4.261, "10 40 60; 72 34 18; 80 44 30; 72 56 40; 60 50 30; 50 62 30; 58 72 60; 40 78 30; 30 66 40; 20 72 40; 12 58 50", {
      from: 1992, names: { 1: "Curva 1", 3: "Curva 3" },
    }),
  ],
  indianapolis: [
    L(4.023, "10 70 120; 10 30 120; 90 30 120; 90 70 120", {
      to: 1960, start: 0.5, names: { 1: "Turn 1", 2: "Turn 2", 3: "Turn 3", 4: "Turn 4" },
    }),
    L(4.192, "86 70 220; 86 30 220; 30 30 18; 34 40 18; 22 50 20; 40 56 30; 52 48 40; 62 56 25; 56 66 30; 40 70 35; 16 64 25; 12 70 220", {
      from: 2000, start: 0.5, names: { 1: "Turn 13", 3: "Turn 1", 7: "Turn 7", 11: "Turn 12" },
    }),
  ],
  sepang: [
    L(5.543, "16 64 12; 88 76 14; 94 66 30; 96 30 150; 84 18 25; 70 26 80; 60 18 80; 48 26 50; 40 20 50; 28 24 14; 36 34 40; 50 38 60; 62 34 150; 74 42 150; 84 54 14", {
      start: 0.5, names: { 1: "Curva 1", 4: "Curva 4", 6: "Curva 5-6", 9: "Curva 9", 14: "Horquilla" },
    }),
  ],
  ricard: [
    L(5.81, "18 70 60; 30 76 30; 46 74 60; 60 80 30; 74 72 60; 90 40 2000; 92 24 30; 78 14 60; 50 12 300; 30 18 60; 16 30 40; 12 50 60", {
      start: 0.4, names: { 2: "S de la Verrerie", 5: "Mistral", 7: "Signes", 8: "Beausset", 11: "Pont" },
    }),
  ],
  magny_cours: [
    L(4.411, "16 62 60; 70 66 300; 82 60 60; 88 48 18; 76 38 120; 60 30 600; 86 18 12; 70 22 40; 52 20 40; 40 16 50; 28 24 25; 18 32 25; 12 44 40", {
      start: 0.45, names: { 1: "Grande Courbe", 3: "Estoril", 5: "Golf", 6: "Adelaide", 8: "Nürburgring", 10: "Château d'Eau", 12: "Lycée" },
    }),
  ],
  shanghai: [
    L(5.451, "6 60 40; 62 74 60; 74 66 35; 70 56 16; 60 56 20; 52 46 60; 40 40 14; 54 32 120; 66 30 120; 74 38 25; 84 36 25; 90 26 30; 82 14 90; 10 10 12; 20 24 40", {
      start: 0.5, names: { 1: "Curva 1", 6: "Curva 6", 9: "Curva 9", 12: "Curva 13", 14: "Horquilla" },
    }),
  ],
  yas_marina: [
    L(5.554, "10 66 30; 64 72 25; 76 64 60; 82 48 150; 88 34 30; 92 14 14; 12 10 14; 52 34 20; 60 40 20; 56 50 25; 46 46 30; 40 54 25; 30 48 25; 22 56 25; 16 48 30", {
      start: 0.4, names: { 1: "Curva 1", 4: "Curva 5", 6: "Horquilla", 9: "Curva 9", 13: "Hotel" },
    }),
  ],
  marina_bay: [
    L(4.94, "10 70 30; 14 40 30; 24 36 20; 28 26 20; 50 24 300; 60 30 18; 70 18 20; 90 16 20; 90 30 18; 78 40 18; 82 54 20; 66 60 18; 60 72 18; 44 66 30; 36 78 20; 22 80 20", {
      start: 0.45, names: { 1: "Sheares", 4: "Memorial", 7: "Raffles", 11: "Anderson Bridge", 14: "Esplanade" },
    }),
  ],
  brands_hatch: [
    L(4.207, "20 62 60; 30 34 40; 24 24 12; 36 20 60; 56 14 300; 78 18 40; 90 34 60; 80 52 30; 70 58 70; 52 70 40; 36 76 50", {
      names: { 1: "Paddock Hill", 2: "Druids", 4: "Hawthorn", 6: "Westfield", 7: "Dingle Dell", 9: "Stirling's", 10: "Clearways" },
    }),
  ],
  estoril: [
    L(4.36, "84 72 350; 18 70 30; 10 54 25; 22 46 60; 30 30 30; 50 22 40; 62 30 20; 72 22 20; 86 20 50; 92 34 20; 80 42 20; 76 52 60; 92 62 180", {
      start: 0.5, names: { 1: "Curva 1", 2: "Curva 2", 5: "Orelha", 9: "Lagoa", 11: "Chicane", 13: "Parabólica" },
    }),
  ],
  americas: [
    L(5.513, "24 86 25; 18 12 14; 28 22 120; 36 16 90; 44 24 90; 52 16 90; 60 22 40; 72 18 60; 92 24 12; 30 36 16; 36 46 25; 44 44 25; 50 54 25; 66 58 70; 74 66 70; 70 76 60; 56 80 40", {
      start: 0.5, names: { 1: "Curva 1", 3: "Eses", 9: "Curva 11", 12: "Curva 12", 15: "Estadio", 19: "Curva 19" },
    }),
  ],
  reims: [
    L(8.302, "14 66 120; 84 76 150; 92 70 20; 70 30 1500; 58 14 18; 36 30 1200", {
      start: 0.45, names: { 1: "Gueux", 3: "Muizon", 5: "Thillois" },
    }),
  ],
  adelaide: [
    L(3.78, "18 74 18; 22 56 20; 30 50 20; 50 46 200; 62 32 20; 72 30 20; 80 18 25; 88 22 20; 90 40 25; 86 62 300; 90 86 12; 60 78 400; 40 84 25; 30 78 20", {
      start: 0.5, names: { 1: "Senna Chicane", 7: "Wakefield", 11: "Hairpin", 13: "Brewery" },
    }),
  ],
  zolder: [
    L(4.262, "22 72 60; 74 70 30; 82 56 40; 70 48 15; 66 42 15; 76 30 60; 70 16 40; 50 12 60; 40 22 15; 36 26 15; 24 22 40; 12 38 60; 14 56 50", {
      names: { 1: "Earste Links", 3: "Sterrewachtbocht", 7: "Kanaalbocht", 9: "Bolderberg", 11: "Terlamenbocht" },
    }),
  ],
  jacarepagua: [
    L(5.031, "16 70 70; 84 74 70; 90 58 30; 78 46 30; 82 34 60; 70 22 30; 40 18 150; 20 24 50; 10 40 80; 12 56 80", {
      names: { 1: "Curva Sul", 3: "Curva do Lago", 6: "Curva Norte" },
    }),
  ],
  jarama: [
    L(3.404, "18 66 40; 72 72 16; 84 62 30; 74 50 40; 82 38 25; 66 30 25; 56 40 40; 46 30 30; 40 18 25; 26 22 25; 18 36 40; 26 48 25; 14 54 30", {
      names: { 1: "Fangio", 3: "Varzi", 5: "Ascari", 8: "Bugatti", 10: "Portago" },
    }),
  ],
  istanbul: [
    L(5.338, "80 80 60; 24 84 20; 14 72 40; 22 62 60; 14 50 25; 24 40 120; 40 30 18; 52 34 25; 66 26 30; 82 20 140; 90 30 140; 84 42 140; 70 44 30; 60 56 25; 74 62 300; 92 66 14; 88 76 30", {
      start: 0.5, names: { 1: "Curva 1", 4: "Curva 4", 8: "Curva 8", 11: "Curva 12" },
    }),
  ],
  mosport: [
    L(3.957, "20 70 60; 70 76 60; 86 64 120; 90 44 60; 78 30 50; 60 34 40; 50 22 120; 30 16 60; 16 26 50; 10 46 60", {
      names: { 1: "Turn 1", 2: "Turn 2", 5: "Moss", 8: "Turn 8" },
    }),
  ],
  long_beach: [
    L(3.275, "60 76 300; 12 74 25; 10 60 25; 24 54 20; 28 40 20; 44 38 20; 48 26 20; 70 22 12; 76 32 20; 90 40 20; 86 60 14; 72 64 20", {
      start: 0.5, names: { 1: "Queens Hairpin", 7: "Pine Avenue", 11: "Horquilla" },
    }),
  ],
  sochi: [
    L(5.848, "16 80 300; 70 84 25; 80 76 18; 84 40 250; 76 24 30; 62 20 25; 54 30 25; 40 26 40; 34 16 25; 20 18 25; 16 30 30; 24 44 30; 14 56 25; 8 68 40", {
      start: 0.5, names: { 1: "Curva 2", 3: "Curva 3", 4: "Curva 4", 8: "Curva 8" },
    }),
  ],
  baku: [
    L(6.003, "84 78 300; 12 76 16; 14 64 16; 30 60 16; 34 48 16; 22 44 16; 20 36 14; 32 30 12; 40 34 12; 50 26 18; 62 26 16; 70 18 30; 84 16 300; 92 26 300; 92 60 600; 90 72 20", {
      start: 0.45, names: { 1: "Curva 1", 2: "Curva 2", 6: "Castillo", 12: "Curva 15", 16: "Curva 16" },
    }),
  ],
  detroit: [
    L(4.023, "14 70 20; 14 30 18; 38 28 18; 40 16 18; 70 16 20; 70 30 18; 90 32 18; 90 64 20; 66 66 18; 64 80 18; 40 80 18; 38 70 18", {
      start: 0.5, names: { 1: "Turn 1", 5: "Atwater", 8: "Turn 8" },
    }),
  ],
  jerez: [
    L(4.428, "16 70 30; 74 74 40; 86 60 60; 80 46 18; 64 44 60; 56 32 25; 66 18 40; 50 12 40; 36 22 50; 30 36 14; 22 34 20; 12 46 60", {
      names: { 1: "Expo 92", 4: "Ángel Nieto", 7: "Sito Pons", 10: "Dry Sack", 12: "Ayrton Senna" },
    }),
  ],
  anderstorp: [
    L(4.031, "80 70 60; 14 72 30; 10 52 60; 20 40 40; 16 26 30; 30 16 30; 60 12 1500; 90 18 20; 88 34 60; 76 46 40; 88 58 50", {
      start: 0.5, names: { 1: "Karusellen", 6: "Flight", 7: "Norra", 10: "Södra" },
    }),
  ],
  dijon: [
    L(3.801, "20 70 120; 70 74 40; 84 62 20; 76 50 70; 84 36 40; 70 24 30; 50 30 60; 36 20 30; 22 26 40; 12 44 60; 14 58 80", {
      names: { 1: "Villeroy", 3: "Sabelières", 5: "Pouas", 8: "Bretelle", 10: "Courbe de Pouas" },
    }),
  ],
  bremgarten: [
    L(7.28, "20 74 300; 66 82 150; 86 66 200; 92 40 120; 80 22 300; 56 12 150; 36 18 200; 18 30 100; 10 50 200", {
      names: { 3: "Eymatt", 5: "Forsthaus", 8: "Jordenrampe" },
    }),
  ],
  essarts: [
    L(6.542, "16 50 200; 40 26 150; 64 14 120; 84 22 90; 88 40 14; 76 52 120; 62 70 90; 40 84 60; 22 80 120", {
      names: { 1: "Six Frères", 4: "Nouveau Monde", 6: "Virage du Paradis" },
    }),
  ],
  aintree: [
    L(4.828, "14 66 80; 80 74 60; 90 60 50; 84 40 60; 70 30 120; 46 22 150; 26 22 40; 10 36 60", {
      names: { 1: "Waterway", 3: "Anchor Crossing", 5: "Melling Crossing", 7: "Tatts" },
    }),
  ],
  valencia: [
    L(5.419, "14 70 30; 30 74 20; 34 66 20; 50 60 25; 60 70 200; 82 76 20; 90 64 20; 84 46 300; 92 30 14; 70 26 300; 50 14 20; 36 20 20; 30 34 25; 18 40 30; 10 56 30", {
      start: 0.5, names: { 1: "Curva 1", 6: "Puente", 9: "Curva 12", 12: "Curva 17" },
    }),
  ],
  charade: [
    L(8.055, "20 70 60; 46 80 40; 60 70 30; 72 82 50; 88 72 40; 84 54 30; 92 40 50; 80 24 40; 64 30 30; 52 16 40; 34 22 30; 22 36 50; 10 50 40", {
      names: { 1: "Courbe de Thèdes", 5: "Virage de Gravenoire", 9: "Rochefort" },
    }),
  ],
  montjuic: [
    L(3.79, "16 66 100; 70 76 40; 86 60 30; 80 42 50; 66 34 20; 70 22 60; 50 14 40; 30 22 30; 22 36 20; 10 46 60", {
      names: { 1: "Rasante", 5: "Horquilla", 7: "Ángel", 9: "Pueblo Español" },
    }),
  ],
  fuji: [
    L(4.563, "88 70 300; 14 72 40; 10 56 70; 22 46 30; 30 32 60; 48 24 40; 58 32 25; 72 26 40; 84 34 20; 76 46 25; 90 54 50", {
      start: 0.5, names: { 1: "Curva 1", 4: "Coca-Cola", 6: "100R", 8: "Horquilla", 10: "Dunlop" },
    }),
  ],
  yeongam: [
    L(5.615, "14 70 30; 60 72 18; 66 62 25; 92 10 14; 60 14 30; 50 24 40; 56 36 25; 44 46 25; 34 40 40; 24 48 30; 32 58 25; 20 60 30", {
      start: 0.5, names: { 1: "Curva 1", 3: "Curva 3", 5: "Curva 4" },
    }),
  ],
  jeddah: [
    L(6.174, "86 80 22; 80 74 22; 74 66 150; 70 56 120; 74 46 120; 68 36 120; 72 26 120; 66 16 25; 60 8 25; 54 18 200; 40 22 22; 30 18 200; 20 26 150; 16 44 200; 22 60 150; 18 76 150; 24 88 14; 30 80 200; 36 50 600; 44 40 30; 50 48 300; 60 88 300", {
      start: 0.5, names: { 1: "Curva 1", 10: "Curva 13", 17: "Curva 27" },
    }),
  ],
  george: [
    L(3.92, "20 70 120; 70 76 30; 86 60 80; 80 40 40; 64 30 120; 40 20 30; 24 30 40; 12 50 80", {
      names: { 1: "Potters Pass", 3: "Beacon Bend", 6: "Cocobana" },
    }),
  ],
  phoenix: [
    L(3.798, "20 70 20; 20 30 20; 50 30 20; 50 20 20; 80 20 20; 80 50 20; 66 50 20; 66 70 20", {
      start: 0.5, names: { 1: "Turn 1", 4: "Turn 4", 7: "Turn 7" },
    }),
  ],
  buddh: [
    L(5.125, "14 70 30; 70 72 14; 84 64 25; 90 14 2000; 94 8 12; 80 18 40; 66 22 40; 54 30 25; 42 24 30; 30 32 90; 22 42 200; 30 54 200; 20 60 30", {
      start: 0.5, names: { 1: "Curva 1", 3: "Curva 3", 5: "Curva 4", 10: "Curva 10" },
    }),
  ],
  losail: [
    L(5.419, "12 70 300; 84 74 40; 92 62 60; 84 50 60; 70 46 120; 62 34 60; 72 22 40; 60 12 60; 44 18 120; 34 30 60; 22 22 40; 12 34 60; 20 46 120; 8 56 60", {
      start: 0.5, names: { 1: "Curva 1", 6: "Curva 6", 10: "Curva 10", 14: "Curva 16" },
    }),
  ],
  miami: [
    L(5.412, "80 76 300; 14 74 18; 10 60 20; 22 50 120; 30 40 120; 20 30 120; 26 20 25; 60 18 2000; 86 12 14; 90 26 18; 72 34 20; 66 44 12; 60 40 12; 54 52 200; 70 56 300; 90 62 20", {
      start: 0.5, names: { 1: "Curva 1", 3: "Curva 4", 7: "Curva 11", 11: "Chicane 14-15", 15: "Curva 17" },
    }),
  ],
  pedralbes: [
    L(6.316, "16 70 200; 88 64 40; 90 30 60; 70 16 120; 34 20 60; 14 34 120", {
      names: { 2: "Curva de los Tres Pinos", 4: "Avenida", 6: "Paseo" },
    }),
  ],
  boavista: [
    L(7.407, "14 70 60; 70 80 40; 90 62 30; 86 36 60; 70 22 40; 50 30 30; 40 18 50; 20 24 40; 10 44 60", {
      names: { 1: "Avenida da Boavista", 4: "Circunvalação" },
    }),
  ],
  tremblant: [
    L(4.265, "20 70 80; 66 80 40; 84 66 60; 80 46 30; 88 30 60; 70 16 40; 50 22 60; 32 16 40; 16 30 60; 12 52 80", {
      names: { 1: "Namerow", 5: "The Hairpin", 8: "Paddock Bend" },
    }),
  ],
  nivelles: [
    L(3.724, "18 70 60; 76 74 40; 88 58 30; 80 40 60; 62 34 40; 50 20 40; 30 22 40; 14 38 60", {
      names: { 1: "Curva 1", 4: "Curva 4" },
    }),
  ],
  las_vegas: [
    L(3.65, "14 70 16; 14 30 16; 30 30 14; 30 50 14; 46 50 14; 46 30 14; 62 30 14; 62 50 14; 80 50 14; 80 30 16; 90 30 16; 90 70 16", {
      start: 0.5, names: { 1: "Turn 1", 12: "Turn 14" },
    }),
  ],
  okayama: [
    L(3.703, "14 70 40; 70 74 18; 82 62 25; 76 50 40; 84 36 20; 70 28 25; 56 36 30; 48 22 25; 34 28 30; 26 40 20; 16 34 25; 8 50 40", {
      names: { 1: "First", 3: "Attwood", 5: "Hairpin", 9: "Revolver", 12: "Double Hairpin" },
    }),
  ],
  portimao: [
    L(4.653, "14 70 50; 70 74 25; 80 64 30; 74 54 18; 86 44 60; 90 24 30; 74 14 50; 58 22 40; 48 34 20; 36 26 50; 24 34 60; 30 50 40; 16 54 50", {
      names: { 1: "Primeira", 5: "Torre VIP", 8: "Horquilla", 13: "Galp" },
    }),
  ],
  vegas: [
    L(6.201, "84 82 14; 74 74 14; 66 80 14; 40 82 25; 30 72 25; 34 60 20; 26 54 20; 22 40 25; 14 26 20; 22 10 1500; 80 12 300; 90 18 14; 90 40 14; 82 44 20; 90 60 14", {
      start: 0.5, names: { 1: "Curva 1", 5: "Esfera", 9: "Curva 12", 10: "The Strip", 12: "Curva 14" },
    }),
  ],
  pescara: [
    L(25.8, "14 80 80; 30 34 40; 40 20 60; 50 30 30; 56 14 40; 66 22 50; 90 12 80; 88 86 120; 70 88 60", {
      names: { 2: "Montesilvano", 7: "Capo Rosso" },
    }),
  ],
  "ain-diab": [
    L(7.618, "14 70 80; 72 84 50; 88 64 40; 84 30 60; 60 14 80; 30 18 50; 12 36 60", {
      names: { 1: "Bouskoura" },
    }),
  ],
  avus: [
    L(8.3, "8 50 30; 92 46 10; 8 54 30", {
      start: 0.5, names: { 1: "Nordkurve", 2: "Südkehre" },
    }),
  ],
  monsanto: [
    L(5.44, "16 70 60; 50 82 30; 74 72 40; 90 56 30; 78 40 50; 84 22 40; 60 14 40; 46 28 30; 30 18 40; 12 36 50", {
      names: { 1: "Curva da Pedreira" },
    }),
  ],
  sebring: [
    L(8.36, "14 72 30; 60 80 30; 66 64 40; 90 70 30; 92 30 40; 72 18 30; 70 40 30; 46 36 30; 40 18 30; 16 22 30; 10 46 40", {
      names: { 1: "Turn 1", 7: "Hairpin", 10: "Webster" },
    }),
  ],
  riverside: [
    L(5.271, "50 80 300; 14 76 40; 10 58 60; 22 46 40; 16 34 40; 28 20 40; 44 26 40; 60 14 40; 80 22 30; 92 44 30; 88 68 60", {
      start: 0.5, names: { 1: "Turn 9", 4: "Esses", 9: "Turn 6" },
    }),
  ],
  zeltweg: [
    L(3.2, "14 70 30; 86 70 30; 86 56 30; 40 50 40; 40 22 30; 14 22 30", {
      names: { 1: "Turn 1" },
    }),
  ],
  lemans: [
    L(4.422, "14 66 40; 72 74 30; 88 58 30; 76 40 20; 56 34 40; 40 18 30; 22 24 30; 10 44 50", {
      names: { 1: "Dunlop", 5: "Garage Vert" },
    }),
  ],
  dallas: [
    L(3.901, "14 70 16; 14 40 16; 30 34 16; 30 20 16; 60 20 16; 66 32 16; 86 32 16; 86 64 16; 60 70 16; 50 60 16; 36 70 16", {
      start: 0.5, names: { 1: "Turn 1" },
    }),
  ],
  donington: [
    L(4.023, "16 66 60; 50 78 60; 70 72 120; 86 56 50; 80 40 30; 88 24 40; 70 14 15; 50 20 60; 40 34 14; 24 26 14; 12 44 50", {
      names: { 1: "Redgate", 2: "Craner Curves", 4: "Old Hairpin", 6: "McLeans", 7: "Coppice", 9: "Melbourne Hairpin", 10: "Goddards" },
    }),
  ],
  mugello: [
    L(5.245, "14 70 80; 74 74 30; 84 64 60; 78 50 60; 88 36 60; 76 24 40; 60 30 60; 48 18 60; 30 22 60; 22 34 90; 30 46 120; 18 56 60", {
      names: { 1: "San Donato", 3: "Luco", 4: "Poggio Secco", 6: "Materassi", 7: "Borgo San Lorenzo", 8: "Casanova", 9: "Savelli", 10: "Arrabbiata", 12: "Bucine" },
    }),
  ],
};

/** The version of a circuit that was in use in a given year. */
export const layoutFor = (ref, year) => {
  const versions = LAYOUTS[ref];
  if (!versions) return null;
  const match = versions.find((version) => (version.from ?? 0) <= year && year <= (version.to ?? 9999));
  const chosen = match || versions[versions.length - 1];
  const index = versions.indexOf(chosen);
  return { id: `${ref}#${index}`, ...chosen };
};

/** Circuit references, for tests and tools. */
export const LAYOUT_REFS = Object.keys(LAYOUTS);
