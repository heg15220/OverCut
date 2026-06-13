// Grand Prix names arrive from the backend in English (f1db `gp` field). The
// engine keeps using that English string for circuit matching (lap counts,
// corners, track profile), so this module only localises names for DISPLAY.
//
// localizeRaceName(name, "en") returns the original; "es" returns the Spanish
// name, falling back to "Gran Premio de <lugar>" for any GP not in the table.

const GP_ES = {
  "Australian Grand Prix": "Gran Premio de Australia",
  "Bahrain Grand Prix": "Gran Premio de Baréin",
  "Chinese Grand Prix": "Gran Premio de China",
  "Azerbaijan Grand Prix": "Gran Premio de Azerbaiyán",
  "Spanish Grand Prix": "Gran Premio de España",
  "Monaco Grand Prix": "Gran Premio de Mónaco",
  "Canadian Grand Prix": "Gran Premio de Canadá",
  "Austrian Grand Prix": "Gran Premio de Austria",
  "Styrian Grand Prix": "Gran Premio de Estiria",
  "British Grand Prix": "Gran Premio de Gran Bretaña",
  "70th Anniversary Grand Prix": "Gran Premio del 70 Aniversario",
  "Hungarian Grand Prix": "Gran Premio de Hungría",
  "Belgian Grand Prix": "Gran Premio de Bélgica",
  "Dutch Grand Prix": "Gran Premio de los Países Bajos",
  "Italian Grand Prix": "Gran Premio de Italia",
  "Tuscan Grand Prix": "Gran Premio de la Toscana",
  "San Marino Grand Prix": "Gran Premio de San Marino",
  "Emilia Romagna Grand Prix": "Gran Premio de Emilia-Romaña",
  "Singapore Grand Prix": "Gran Premio de Singapur",
  "Russian Grand Prix": "Gran Premio de Rusia",
  "Japanese Grand Prix": "Gran Premio de Japón",
  "United States Grand Prix": "Gran Premio de Estados Unidos",
  "United States Grand Prix West": "Gran Premio del Oeste de Estados Unidos",
  "Mexican Grand Prix": "Gran Premio de México",
  "Mexico City Grand Prix": "Gran Premio de Ciudad de México",
  "Brazilian Grand Prix": "Gran Premio de Brasil",
  "São Paulo Grand Prix": "Gran Premio de São Paulo",
  "Sao Paulo Grand Prix": "Gran Premio de São Paulo",
  "Abu Dhabi Grand Prix": "Gran Premio de Abu Dabi",
  "Qatar Grand Prix": "Gran Premio de Catar",
  "Saudi Arabian Grand Prix": "Gran Premio de Arabia Saudí",
  "Miami Grand Prix": "Gran Premio de Miami",
  "Las Vegas Grand Prix": "Gran Premio de Las Vegas",
  "Sakhir Grand Prix": "Gran Premio de Sakhir",
  "Eifel Grand Prix": "Gran Premio de Eifel",
  "Portuguese Grand Prix": "Gran Premio de Portugal",
  "Turkish Grand Prix": "Gran Premio de Turquía",
  "French Grand Prix": "Gran Premio de Francia",
  "German Grand Prix": "Gran Premio de Alemania",
  "European Grand Prix": "Gran Premio de Europa",
  "Luxembourg Grand Prix": "Gran Premio de Luxemburgo",
  "Pacific Grand Prix": "Gran Premio del Pacífico",
  "Malaysian Grand Prix": "Gran Premio de Malasia",
  "Indian Grand Prix": "Gran Premio de la India",
  "Korean Grand Prix": "Gran Premio de Corea",
  "Argentine Grand Prix": "Gran Premio de Argentina",
  "South African Grand Prix": "Gran Premio de Sudáfrica",
  "Swiss Grand Prix": "Gran Premio de Suiza",
  "Moroccan Grand Prix": "Gran Premio de Marruecos",
  "Pescara Grand Prix": "Gran Premio de Pescara",
  "Caesars Palace Grand Prix": "Gran Premio de Caesars Palace",
  "Detroit Grand Prix": "Gran Premio de Detroit",
  "Dallas Grand Prix": "Gran Premio de Dallas",
  "Indianapolis 500": "500 Millas de Indianápolis",
};

export const localizeRaceName = (name, lang = "es") => {
  if (!name) return name;
  if (lang === "en") return name;
  if (GP_ES[name]) return GP_ES[name];
  const place = name.replace(/\s*Grand Prix$/i, "").trim();
  return place && place !== name ? `Gran Premio de ${place}` : name;
};
