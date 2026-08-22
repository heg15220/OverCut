/**
 * Circuit character.
 *
 * The calendar the game plays comes from f1db as bare Grand Prix names, and a
 * name is not enough to race on: Monza and Monaco reward completely different
 * cars and produce completely different races. This table gives each of the 54
 * Grands Prix that have ever been run a profile the race engine can use.
 *
 *   overtaking  0 = a procession (Monaco), 1 = a slipstream fight (Monza, Baku).
 *               Drives how far anyone can recover from a bad grid slot.
 *   power       how much straight-line speed matters.
 *   aero        how much downforce matters. power + aero need not sum to 1;
 *               a circuit can demand both (Suzuka) or neither in particular.
 *   attrition   multiplier on the era's baseline failure rate. Walls, kerbs,
 *               heat and long laps all push it above 1.
 *   rain        base probability of a wet or mixed race, from the real record
 *               of each venue - Spa and Interlagos really are that wet.
 *   prestige    0..1, how much the press cares. Feeds headlines, not results.
 *
 * Names are bilingual because the rest of the UI is.
 */

const GP = (en, es, country, profile) => ({ en, es, country, ...profile });

export const CIRCUITS = {
  "70th Anniversary Grand Prix": GP("70th Anniversary GP", "GP del 70 Aniversario", "gb", {
    overtaking: 0.62, power: 0.55, aero: 0.7, attrition: 0.95, rain: 0.18, prestige: 0.4,
  }),
  "Abu Dhabi Grand Prix": GP("Abu Dhabi GP", "GP de Abu Dabi", "ae", {
    overtaking: 0.5, power: 0.55, aero: 0.6, attrition: 0.85, rain: 0.02, prestige: 0.7,
  }),
  "Argentine Grand Prix": GP("Argentine GP", "GP de Argentina", "ar", {
    overtaking: 0.6, power: 0.5, aero: 0.45, attrition: 1.2, rain: 0.12, prestige: 0.55,
  }),
  "Australian Grand Prix": GP("Australian GP", "GP de Australia", "au", {
    overtaking: 0.42, power: 0.5, aero: 0.65, attrition: 1.1, rain: 0.14, prestige: 0.65,
  }),
  "Austrian Grand Prix": GP("Austrian GP", "GP de Austria", "at", {
    overtaking: 0.72, power: 0.72, aero: 0.42, attrition: 1.0, rain: 0.24, prestige: 0.6,
  }),
  "Azerbaijan Grand Prix": GP("Azerbaijan GP", "GP de Azerbaiyán", "az", {
    overtaking: 0.88, power: 0.85, aero: 0.35, attrition: 1.35, rain: 0.08, prestige: 0.55,
  }),
  "Bahrain Grand Prix": GP("Bahrain GP", "GP de Baréin", "bh", {
    overtaking: 0.7, power: 0.6, aero: 0.5, attrition: 1.05, rain: 0.02, prestige: 0.6,
  }),
  "Belgian Grand Prix": GP("Belgian GP", "GP de Bélgica", "be", {
    overtaking: 0.78, power: 0.82, aero: 0.55, attrition: 1.15, rain: 0.38, prestige: 0.95,
  }),
  "Brazilian Grand Prix": GP("Brazilian GP", "GP de Brasil", "br", {
    overtaking: 0.75, power: 0.66, aero: 0.5, attrition: 1.12, rain: 0.32, prestige: 0.85,
  }),
  "British Grand Prix": GP("British GP", "GP de Gran Bretaña", "gb", {
    overtaking: 0.62, power: 0.58, aero: 0.78, attrition: 1.0, rain: 0.3, prestige: 0.95,
  }),
  "Caesars Palace Grand Prix": GP("Caesars Palace GP", "GP de Caesars Palace", "us", {
    overtaking: 0.45, power: 0.42, aero: 0.5, attrition: 1.25, rain: 0.03, prestige: 0.3,
  }),
  "Canadian Grand Prix": GP("Canadian GP", "GP de Canadá", "ca", {
    overtaking: 0.8, power: 0.78, aero: 0.4, attrition: 1.3, rain: 0.22, prestige: 0.8,
  }),
  "Chinese Grand Prix": GP("Chinese GP", "GP de China", "cn", {
    overtaking: 0.72, power: 0.62, aero: 0.55, attrition: 0.95, rain: 0.18, prestige: 0.6,
  }),
  "Dallas Grand Prix": GP("Dallas GP", "GP de Dallas", "us", {
    overtaking: 0.3, power: 0.4, aero: 0.55, attrition: 1.6, rain: 0.05, prestige: 0.25,
  }),
  "Detroit Grand Prix": GP("Detroit GP", "GP de Detroit", "us", {
    overtaking: 0.28, power: 0.38, aero: 0.6, attrition: 1.5, rain: 0.1, prestige: 0.3,
  }),
  "Dutch Grand Prix": GP("Dutch GP", "GP de los Países Bajos", "nl", {
    overtaking: 0.32, power: 0.48, aero: 0.8, attrition: 1.05, rain: 0.2, prestige: 0.7,
  }),
  "Eifel Grand Prix": GP("Eifel GP", "GP de Eifel", "de", {
    overtaking: 0.55, power: 0.6, aero: 0.6, attrition: 1.05, rain: 0.35, prestige: 0.5,
  }),
  "Emilia Romagna Grand Prix": GP("Emilia Romagna GP", "GP de Emilia-Romaña", "it", {
    overtaking: 0.3, power: 0.6, aero: 0.7, attrition: 1.12, rain: 0.18, prestige: 0.7,
  }),
  "European Grand Prix": GP("European GP", "GP de Europa", "eu", {
    overtaking: 0.55, power: 0.6, aero: 0.6, attrition: 1.05, rain: 0.2, prestige: 0.5,
  }),
  "French Grand Prix": GP("French GP", "GP de Francia", "fr", {
    overtaking: 0.6, power: 0.68, aero: 0.55, attrition: 1.05, rain: 0.14, prestige: 0.75,
  }),
  "German Grand Prix": GP("German GP", "GP de Alemania", "de", {
    overtaking: 0.62, power: 0.68, aero: 0.55, attrition: 1.15, rain: 0.28, prestige: 0.8,
  }),
  "Hungarian Grand Prix": GP("Hungarian GP", "GP de Hungría", "hu", {
    overtaking: 0.22, power: 0.35, aero: 0.85, attrition: 1.0, rain: 0.16, prestige: 0.6,
  }),
  "Indian Grand Prix": GP("Indian GP", "GP de India", "in", {
    overtaking: 0.65, power: 0.6, aero: 0.58, attrition: 1.0, rain: 0.08, prestige: 0.4,
  }),
  "Indianapolis 500": GP("Indianapolis 500", "500 Millas de Indianápolis", "us", {
    overtaking: 0.7, power: 0.95, aero: 0.3, attrition: 1.7, rain: 0.12, prestige: 0.7,
  }),
  "Italian Grand Prix": GP("Italian GP", "GP de Italia", "it", {
    overtaking: 0.85, power: 0.95, aero: 0.2, attrition: 1.15, rain: 0.14, prestige: 0.95,
  }),
  "Japanese Grand Prix": GP("Japanese GP", "GP de Japón", "jp", {
    overtaking: 0.5, power: 0.6, aero: 0.8, attrition: 1.05, rain: 0.3, prestige: 0.85,
  }),
  "Korean Grand Prix": GP("Korean GP", "GP de Corea", "kr", {
    overtaking: 0.68, power: 0.68, aero: 0.5, attrition: 1.15, rain: 0.22, prestige: 0.35,
  }),
  "Las Vegas Grand Prix": GP("Las Vegas GP", "GP de Las Vegas", "us", {
    overtaking: 0.8, power: 0.88, aero: 0.28, attrition: 1.2, rain: 0.04, prestige: 0.55,
  }),
  "Luxembourg Grand Prix": GP("Luxembourg GP", "GP de Luxemburgo", "de", {
    overtaking: 0.55, power: 0.6, aero: 0.6, attrition: 1.08, rain: 0.3, prestige: 0.4,
  }),
  "Malaysian Grand Prix": GP("Malaysian GP", "GP de Malasia", "my", {
    overtaking: 0.72, power: 0.6, aero: 0.6, attrition: 1.1, rain: 0.4, prestige: 0.55,
  }),
  "Mexican Grand Prix": GP("Mexican GP", "GP de México", "mx", {
    overtaking: 0.7, power: 0.85, aero: 0.45, attrition: 1.2, rain: 0.1, prestige: 0.6,
  }),
  "Mexico City Grand Prix": GP("Mexico City GP", "GP de la Ciudad de México", "mx", {
    overtaking: 0.7, power: 0.85, aero: 0.45, attrition: 1.05, rain: 0.1, prestige: 0.6,
  }),
  "Miami Grand Prix": GP("Miami GP", "GP de Miami", "us", {
    overtaking: 0.6, power: 0.65, aero: 0.55, attrition: 1.05, rain: 0.12, prestige: 0.55,
  }),
  "Monaco Grand Prix": GP("Monaco GP", "GP de Mónaco", "mc", {
    overtaking: 0.05, power: 0.2, aero: 0.7, attrition: 1.45, rain: 0.16, prestige: 1.0,
  }),
  "Moroccan Grand Prix": GP("Moroccan GP", "GP de Marruecos", "ma", {
    overtaking: 0.65, power: 0.7, aero: 0.35, attrition: 1.3, rain: 0.05, prestige: 0.35,
  }),
  "Pacific Grand Prix": GP("Pacific GP", "GP del Pacífico", "jp", {
    overtaking: 0.35, power: 0.5, aero: 0.7, attrition: 1.1, rain: 0.18, prestige: 0.35,
  }),
  "Pescara Grand Prix": GP("Pescara GP", "GP de Pescara", "it", {
    overtaking: 0.7, power: 0.8, aero: 0.25, attrition: 1.8, rain: 0.1, prestige: 0.4,
  }),
  "Portuguese Grand Prix": GP("Portuguese GP", "GP de Portugal", "pt", {
    overtaking: 0.55, power: 0.58, aero: 0.62, attrition: 1.1, rain: 0.18, prestige: 0.55,
  }),
  "Qatar Grand Prix": GP("Qatar GP", "GP de Catar", "qa", {
    overtaking: 0.5, power: 0.55, aero: 0.75, attrition: 1.1, rain: 0.02, prestige: 0.45,
  }),
  "Russian Grand Prix": GP("Russian GP", "GP de Rusia", "ru", {
    overtaking: 0.45, power: 0.6, aero: 0.55, attrition: 0.9, rain: 0.14, prestige: 0.45,
  }),
  "Sakhir Grand Prix": GP("Sakhir GP", "GP de Sakhir", "bh", {
    overtaking: 0.82, power: 0.8, aero: 0.3, attrition: 1.05, rain: 0.02, prestige: 0.4,
  }),
  "San Marino Grand Prix": GP("San Marino GP", "GP de San Marino", "it", {
    overtaking: 0.32, power: 0.6, aero: 0.7, attrition: 1.2, rain: 0.16, prestige: 0.75,
  }),
  "Saudi Arabian Grand Prix": GP("Saudi Arabian GP", "GP de Arabia Saudí", "sa", {
    overtaking: 0.65, power: 0.85, aero: 0.4, attrition: 1.3, rain: 0.02, prestige: 0.55,
  }),
  "Singapore Grand Prix": GP("Singapore GP", "GP de Singapur", "sg", {
    overtaking: 0.3, power: 0.4, aero: 0.8, attrition: 1.35, rain: 0.25, prestige: 0.75,
  }),
  "South African Grand Prix": GP("South African GP", "GP de Sudáfrica", "za", {
    overtaking: 0.72, power: 0.8, aero: 0.4, attrition: 1.2, rain: 0.12, prestige: 0.7,
  }),
  "Spanish Grand Prix": GP("Spanish GP", "GP de España", "es", {
    overtaking: 0.35, power: 0.5, aero: 0.85, attrition: 1.0, rain: 0.12, prestige: 0.7,
  }),
  "Styrian Grand Prix": GP("Styrian GP", "GP de Estiria", "at", {
    overtaking: 0.72, power: 0.72, aero: 0.42, attrition: 1.0, rain: 0.28, prestige: 0.4,
  }),
  "Swedish Grand Prix": GP("Swedish GP", "GP de Suecia", "se", {
    overtaking: 0.5, power: 0.5, aero: 0.6, attrition: 1.15, rain: 0.2, prestige: 0.4,
  }),
  "Swiss Grand Prix": GP("Swiss GP", "GP de Suiza", "ch", {
    overtaking: 0.6, power: 0.65, aero: 0.4, attrition: 1.4, rain: 0.22, prestige: 0.5,
  }),
  "São Paulo Grand Prix": GP("São Paulo GP", "GP de São Paulo", "br", {
    overtaking: 0.75, power: 0.66, aero: 0.5, attrition: 1.12, rain: 0.32, prestige: 0.85,
  }),
  "Turkish Grand Prix": GP("Turkish GP", "GP de Turquía", "tr", {
    overtaking: 0.68, power: 0.62, aero: 0.6, attrition: 1.05, rain: 0.2, prestige: 0.55,
  }),
  "Tuscan Grand Prix": GP("Tuscan GP", "GP de la Toscana", "it", {
    overtaking: 0.3, power: 0.55, aero: 0.8, attrition: 1.25, rain: 0.14, prestige: 0.45,
  }),
  "United States Grand Prix": GP("United States GP", "GP de Estados Unidos", "us", {
    overtaking: 0.68, power: 0.62, aero: 0.6, attrition: 1.05, rain: 0.14, prestige: 0.75,
  }),
  "United States Grand Prix West": GP("United States GP West", "GP del Oeste de EE. UU.", "us", {
    overtaking: 0.35, power: 0.45, aero: 0.6, attrition: 1.35, rain: 0.06, prestige: 0.45,
  }),
};

/** Neutral profile for a Grand Prix the table has never seen. */
const DEFAULT_PROFILE = {
  overtaking: 0.55,
  power: 0.6,
  aero: 0.6,
  attrition: 1.05,
  rain: 0.15,
  prestige: 0.5,
};

export const circuitProfile = (raceName) => {
  const entry = CIRCUITS[raceName];
  if (!entry) {
    return { en: raceName, es: raceName, country: null, ...DEFAULT_PROFILE };
  }
  return entry;
};

export const localizeRaceName = (raceName, locale = "es") => {
  const entry = CIRCUITS[raceName];
  if (!entry) return raceName;
  return locale === "es" ? entry.es : entry.en;
};

/**
 * The country whose flag the race flies. The bootstrap resolves this too, but
 * a saved career or the offline fallback may carry a bare name, so the client
 * can always work it out on its own.
 */
export const countryOfRace = (race) => race?.country || circuitProfile(race?.name).country || null;
