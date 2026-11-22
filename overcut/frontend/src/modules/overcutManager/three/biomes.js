/**
 * The world around each circuit.
 *
 * A Grand Prix in Bahrain is sand, palms and a pale sky; Spa is pine forest on
 * Ardennes hills under cloud; Monaco is apartment blocks and a harbour; Fuji
 * has the volcano behind the grandstand. Each venue is given a setting:
 *
 *   ground      grass, dry grass, sand or tropical green, and what run-off is
 *               made of
 *   trees       which kinds grow there and how densely
 *   horizon     green hills, wooded hills, snow-capped mountains, dunes, a
 *               volcano, or none
 *   skyline     city blocks around street circuits and urban venues
 *   water       sea or harbour on one side, river or lake in the infield
 *   sky         gradient and haze; some races run at night under floodlights
 */

const B = (base, extra = {}) => ({ ...BIOMES[base], ...extra, base });

const BIOMES = {
  temperate: {
    ground: "#4a7a3a", groundAlt: "#5a8a44", runoff: "#b8a07a", trees: { pine: 0.35, broad: 0.65 }, density: 1,
    horizon: "hills", hillColor: "#5f8457", sky: ["#3f78bf", "#9cc2e4", "#dfe8ee"], haze: "#cdd9e2", sun: 2.6, warm: "#fff3dd",
  },
  forest: {
    ground: "#3f6e35", groundAlt: "#4c7d3f", runoff: "#a99572", trees: { pine: 0.8, broad: 0.2 }, density: 2.2,
    horizon: "woods", hillColor: "#35553a", sky: ["#5a7fa8", "#a9bccc", "#d6dde3"], haze: "#b9c6cf", sun: 1.8, warm: "#f4f1ea",
  },
  park: {
    ground: "#4c7c38", groundAlt: "#5b8b42", runoff: "#b9a27c", trees: { broad: 0.85, cypress: 0.15 }, density: 1.8,
    horizon: "hills", hillColor: "#6b8a5a", sky: ["#3c78c4", "#9fc5e6", "#e5ebe9"], haze: "#d3dde0", sun: 2.8, warm: "#fff1d6",
  },
  mediterranean: {
    ground: "#8d9a5a", groundAlt: "#9aa564", runoff: "#c9b48a", trees: { pine: 0.5, cypress: 0.2, shrub: 0.3 }, density: 0.9,
    horizon: "hills", hillColor: "#94896a", sky: ["#2f72c6", "#8fc0ea", "#eef0ea"], haze: "#e2e4dc", sun: 3, warm: "#fff0cf",
  },
  desert: {
    ground: "#d8c39a", groundAlt: "#cdb68a", runoff: "#e2cfa6", trees: { palm: 0.8, shrub: 0.2 }, density: 0.35, sand: true,
    horizon: "dunes", hillColor: "#d9bf8c", sky: ["#4f8fd0", "#c7dceb", "#f3e6cf"], haze: "#efe1c6", sun: 3.2, warm: "#fff0d0",
  },
  tropical: {
    ground: "#3d7a32", groundAlt: "#4a8a3a", runoff: "#c9b68e", trees: { palm: 0.45, broad: 0.55 }, density: 2.4,
    horizon: "hills", hillColor: "#3f6e3e", sky: ["#3f7fc8", "#a7cbe6", "#e8ecea"], haze: "#d6e2e0", sun: 2.6, warm: "#fff3dc",
  },
  alpine: {
    ground: "#4f8a3c", groundAlt: "#5d9846", runoff: "#b6a07a", trees: { pine: 0.95, broad: 0.05 }, density: 1.6,
    horizon: "mountains", hillColor: "#577a5c", sky: ["#2e6fc6", "#93c1ea", "#e4edf3"], haze: "#d2dfe9", sun: 2.8, warm: "#fff6e6",
  },
  dunes: {
    ground: "#7f9a5c", groundAlt: "#8ea768", runoff: "#e1cfa2", trees: { shrub: 0.8, pine: 0.2 }, density: 0.6,
    horizon: "dunes", hillColor: "#cdbb8c", sky: ["#4d7fb8", "#a6c4dd", "#e3e9ec"], haze: "#d8e1e6", sun: 2.3, warm: "#fff4e2",
  },
  steppe: {
    ground: "#a39a5e", groundAlt: "#b0a668", runoff: "#c9ac80", trees: { broad: 0.4, shrub: 0.6 }, density: 0.5,
    horizon: "hills", hillColor: "#9b8c66", sky: ["#3d7ccc", "#a8cbe8", "#efe9dc"], haze: "#e5ddca", sun: 3, warm: "#fff0d2",
  },
  urban: {
    ground: "#5e7a4c", groundAlt: "#6a8656", runoff: "#8b8f96", trees: { broad: 0.7, palm: 0.3 }, density: 0.4,
    horizon: "none", hillColor: "#6e7d74", sky: ["#4a7fbf", "#a9c6df", "#e6e9ea"], haze: "#d5dde3", sun: 2.6, warm: "#fff2dc", skyline: true,
  },
};

/** Night races: floodlit, a dark sky. */
const night = { night: true, sky: ["#05070f", "#141c33", "#2a3350"], haze: "#151b2c", sun: 0.25, warm: "#9fb2ff" };

const VENUES = {
  bahrain: (year) => B("desert", year >= 2014 ? night : {}),
  yas_marina: () => B("desert", { ...night, sky: ["#0d1530", "#3a3f6a", "#c98a5a"], haze: "#3a3550", water: "sea", skyline: true }),
  losail: () => B("desert", night),
  jeddah: () => B("desert", { ...night, water: "sea", skyline: true }),
  "ain-diab": () => B("desert", { water: "sea", density: 0.5 }),
  vegas: () => B("desert", { ...night, skyline: true, density: 0.1 }),
  las_vegas: () => B("desert", { skyline: true, density: 0.1 }),
  phoenix: () => B("desert", { skyline: true, density: 0.15 }),
  dallas: () => B("steppe", { skyline: true }),
  riverside: () => B("desert", { horizon: "hills", hillColor: "#a8916a" }),
  buddh: () => B("steppe", { density: 0.4 }),
  sepang: () => B("tropical"),
  marina_bay: () => B("urban", { ...night, water: "harbour", trees: { palm: 0.6, broad: 0.4 } }),
  miami: () => B("tropical", { skyline: true, water: "lake", trees: { palm: 0.9, broad: 0.1 }, density: 0.8 }),
  jacarepagua: () => B("tropical", { horizon: "mountains", hillColor: "#3d6640", snow: false, water: "lake" }),
  interlagos: () => B("tropical", { skyline: true, density: 1.2, water: "lake" }),
  rodriguez: () => B("steppe", { skyline: true, horizon: "mountains", snow: false }),
  galvez: () => B("steppe", { skyline: true, density: 0.8 }),
  kyalami: () => B("steppe"),
  george: () => B("mediterranean", { water: "sea" }),
  red_bull_ring: () => B("alpine", { snow: true }),
  zeltweg: () => B("alpine", { snow: true }),
  bremgarten: () => B("forest"),
  charade: () => B("forest", { horizon: "mountains", snow: false }),
  tremblant: () => B("forest", { horizon: "mountains", snow: false }),
  mosport: () => B("forest"),
  watkins_glen: () => B("forest"),
  spa: () => B("forest", { horizon: "woods" }),
  nurburgring: () => B("forest"),
  hockenheimring: () => B("forest", { horizon: "none", density: 2.6 }),
  monza: () => B("park"),
  imola: () => B("park", { water: "river" }),
  mugello: () => B("park", { trees: { cypress: 0.5, broad: 0.5 } }),
  pescara: () => B("mediterranean", { water: "sea" }),
  silverstone: () => B("temperate", { density: 0.5, horizon: "none" }),
  brands_hatch: () => B("temperate", { density: 1.4 }),
  donington: () => B("temperate"),
  aintree: () => B("temperate", { density: 0.4 }),
  catalunya: () => B("mediterranean"),
  ricard: () => B("mediterranean", { trees: { pine: 0.6, shrub: 0.4 } }),
  magny_cours: () => B("temperate"),
  reims: () => B("temperate", { ground: "#b9a65e", groundAlt: "#c5b26a", density: 0.2, horizon: "none" }),
  essarts: () => B("forest"),
  dijon: () => B("temperate"),
  jerez: () => B("mediterranean", { ground: "#a29a5e" }),
  jarama: () => B("steppe"),
  estoril: () => B("mediterranean"),
  portimao: () => B("mediterranean", { horizon: "hills" }),
  zandvoort: () => B("dunes", { water: "sea" }),
  zolder: () => B("forest"),
  nivelles: () => B("temperate", { density: 0.4 }),
  anderstorp: () => B("forest", { horizon: "none" }),
  monaco: () => B("urban", { water: "harbour", horizon: "mountains", snow: false, hillColor: "#6d7a62", density: 0.2 }),
  baku: () => B("urban", { ground: "#b8a985", water: "sea", density: 0.15 }),
  valencia: () => B("urban", { water: "harbour" }),
  adelaide: () => B("urban", { trees: { broad: 0.7, palm: 0.3 }, density: 0.9 }),
  detroit: () => B("urban", { water: "river" }),
  long_beach: () => B("urban", { water: "sea", trees: { palm: 1 } }),
  montjuic: () => B("urban", { horizon: "hills", water: "sea" }),
  pedralbes: () => B("urban"),
  monsanto: () => B("forest", { skyline: true }),
  boavista: () => B("urban", { water: "sea" }),
  albert_park: () => B("urban", { water: "lake", density: 1.1 }),
  villeneuve: () => B("urban", { water: "river", density: 1.2 }),
  sochi: () => B("urban", { water: "sea", horizon: "mountains", snow: true }),
  shanghai: () => B("urban", { ground: "#6e8a50", density: 0.3 }),
  istanbul: () => B("steppe", { horizon: "hills" }),
  yeongam: () => B("temperate", { water: "sea", density: 0.3 }),
  americas: () => B("steppe", { ground: "#7e9450", density: 0.35 }),
  indianapolis: () => B("urban", { density: 0.5 }),
  sebring: () => B("tropical", { density: 0.5, horizon: "none" }),
  suzuka: () => B("park", { trees: { pine: 0.5, broad: 0.5 }, density: 1.6 }),
  fuji: () => B("alpine", { horizon: "volcano", snow: true }),
  okayama: () => B("forest", { horizon: "hills" }),
  avus: () => B("urban", { horizon: "none" }),
  lemans: () => B("temperate"),
};

/** The setting of a circuit in a given season. */
export const biomeFor = (ref, year = 2020) => {
  const make = VENUES[ref];
  return make ? make(year) : B("temperate");
};
