// utils/getCountryCode.js

const nationalityToCountryCode = {
  // Europa
  GBR: "gb", ENG: "gb", UK: "gb",
  FRA: "fr", GER: "de", DEU: "de",
  ITA: "it", ESP: "es", POR: "pt",
  NLD: "nl", BEL: "be", SWE: "se",
  SUI: "ch", AUT: "at", FIN: "fi",
  DEN: "dk", NOR: "no", IRL: "ie",
  CZE: "cz", SVK: "sk", HUN: "hu",
  POL: "pl", RUS: "ru", EST: "ee",
  LAT: "lv", LTU: "lt", LUX: "lu",
  LIE: "li", MON: "mc", SMR: "sm",
  AND: "ad",

  // América
  USA: "us", CAN: "ca", MEX: "mx",
  BRA: "br", ARG: "ar", COL: "co",
  CHI: "cl", URU: "uy", VEN: "ve",
  ECU: "ec", PER: "pe", CUB: "cu",

  // Asia
  JPN: "jp", CHN: "cn", IND: "in",
  THA: "th", KOR: "kr", IDN: "id",
  MAS: "my", HKG: "hk", TUR: "tr",
  KAZ: "kz", QAT: "qa", UAE: "ae",

  // Oceanía
  AUS: "au", NZL: "nz",

  // África
  ZAF: "za", MAR: "ma", EGY: "eg",
  RHO: "zw", ZIM: "zw", MOZ: "mz",

  // Medio Oriente y otros
  LBN: "lb", ISR: "il", PAK: "pk",
  JAM: "jm", BAR: "bb", TRI: "tt",
};

export const getFlagCode = (nationalityCode) => {
  if (!nationalityCode) return "un";
  return nationalityToCountryCode[nationalityCode.toUpperCase()] || "un"; // fallback to 'un' (unknown)
};
