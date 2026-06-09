import { locale } from "./i18n";

const GRAND_PRIX_ES = {
  "70th Anniversary Grand Prix": "Gran Premio del 70 Aniversario",
  "Abu Dhabi Grand Prix": "Gran Premio de Abu Dabi",
  "Argentine Grand Prix": "Gran Premio de Argentina",
  "Australian Grand Prix": "Gran Premio de Australia",
  "Austrian Grand Prix": "Gran Premio de Austria",
  "Azerbaijan Grand Prix": "Gran Premio de Azerbaiyán",
  "Bahrain Grand Prix": "Gran Premio de Baréin",
  "Belgian Grand Prix": "Gran Premio de Bélgica",
  "Brazilian Grand Prix": "Gran Premio de Brasil",
  "British Grand Prix": "Gran Premio de Gran Bretaña",
  "Caesars Palace Grand Prix": "Gran Premio de Caesars Palace",
  "Canadian Grand Prix": "Gran Premio de Canadá",
  "Chinese Grand Prix": "Gran Premio de China",
  "Dallas Grand Prix": "Gran Premio de Dallas",
  "Detroit Grand Prix": "Gran Premio de Detroit",
  "Dutch Grand Prix": "Gran Premio de los Países Bajos",
  "Eifel Grand Prix": "Gran Premio de Eifel",
  "Emilia Romagna Grand Prix": "Gran Premio de Emilia-Romaña",
  "European Grand Prix": "Gran Premio de Europa",
  "French Grand Prix": "Gran Premio de Francia",
  "German Grand Prix": "Gran Premio de Alemania",
  "Hungarian Grand Prix": "Gran Premio de Hungría",
  "Indian Grand Prix": "Gran Premio de India",
  "Indianapolis 500": "500 Millas de Indianápolis",
  "Italian Grand Prix": "Gran Premio de Italia",
  "Japanese Grand Prix": "Gran Premio de Japón",
  "Korean Grand Prix": "Gran Premio de Corea",
  "Las Vegas Grand Prix": "Gran Premio de Las Vegas",
  "Luxembourg Grand Prix": "Gran Premio de Luxemburgo",
  "Malaysian Grand Prix": "Gran Premio de Malasia",
  "Mexican Grand Prix": "Gran Premio de México",
  "Mexico City Grand Prix": "Gran Premio de la Ciudad de México",
  "Miami Grand Prix": "Gran Premio de Miami",
  "Monaco Grand Prix": "Gran Premio de Mónaco",
  "Moroccan Grand Prix": "Gran Premio de Marruecos",
  "Pacific Grand Prix": "Gran Premio del Pacífico",
  "Pescara Grand Prix": "Gran Premio de Pescara",
  "Portuguese Grand Prix": "Gran Premio de Portugal",
  "Qatar Grand Prix": "Gran Premio de Catar",
  "Russian Grand Prix": "Gran Premio de Rusia",
  "Sakhir Grand Prix": "Gran Premio de Sakhir",
  "San Marino Grand Prix": "Gran Premio de San Marino",
  "Sao Paulo Grand Prix": "Gran Premio de São Paulo",
  "São Paulo Grand Prix": "Gran Premio de São Paulo",
  "Saudi Arabian Grand Prix": "Gran Premio de Arabia Saudí",
  "Singapore Grand Prix": "Gran Premio de Singapur",
  "South African Grand Prix": "Gran Premio de Sudáfrica",
  "Spanish Grand Prix": "Gran Premio de España",
  "Styrian Grand Prix": "Gran Premio de Estiria",
  "Swedish Grand Prix": "Gran Premio de Suecia",
  "Swiss Grand Prix": "Gran Premio de Suiza",
  "Turkish Grand Prix": "Gran Premio de Turquía",
  "Tuscan Grand Prix": "Gran Premio de la Toscana",
  "United States Grand Prix": "Gran Premio de Estados Unidos",
  "United States Grand Prix West": "Gran Premio de Estados Unidos Oeste",
  "Barcelona-Catalunya Grand Prix": "Gran Premio de Barcelona-Catalunya",
};

export const translateGrandPrixName = (name) => {
  if (locale !== "es" || !name) {
    return name;
  }
  return GRAND_PRIX_ES[name] || name;
};

export const grandPrixSpanishTranslations = GRAND_PRIX_ES;
