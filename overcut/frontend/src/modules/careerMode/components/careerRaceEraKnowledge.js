const inRange = (year, from, to = Infinity) => year >= from && year <= to;

const ERA_PROFILES = [
  {
    id: "frontier",
    from: 1950,
    to: 1960,
    label: "F1 fundacional",
    safetyCar: "none",
    vsc: false,
    drs: false,
    refuelling: false,
    tyreStops: "rare",
    reliability: "fragile",
    raceControl: "banderas y comisarios locales",
    scenarioWeights: { mechanical: 1.4, strategy: 0.55, overtaking: 0.75, danger: 1.25 },
    vocabulary: {
      tyres: ["neumaticos estrechos", "gomas castigadas", "trazada sucia"],
      strategy: ["parada larga", "reparacion en boxes", "ritmo de supervivencia"],
      incidents: ["fuga de aceite", "problema de embrague", "frenos fatigados", "motor tosiendo"],
    },
  },
  {
    id: "safety-awakening",
    from: 1961,
    to: 1977,
    label: "seguridad en construccion",
    safetyCar: "none",
    vsc: false,
    drs: false,
    refuelling: false,
    tyreStops: "limited",
    reliability: "fragile",
    raceControl: "banderas, comisarios y decisiones de direccion de carrera",
    scenarioWeights: { mechanical: 1.25, strategy: 0.7, overtaking: 0.82, danger: 1.15 },
    vocabulary: {
      tyres: ["goma diagonal", "neumatico castigado", "temperatura irregular"],
      strategy: ["parada manual", "ajuste mecanico", "cambio de ritmo por trafico"],
      incidents: ["rotura de suspension", "freno largo", "problema de alimentacion", "piano agresivo"],
    },
  },
  {
    id: "ground-effect-turbo",
    from: 1978,
    to: 1992,
    label: "efecto suelo, turbos y preclasificacion",
    safetyCar: "rare",
    vsc: false,
    drs: false,
    refuelling: false,
    tyreStops: "tactical",
    reliability: "volatile",
    raceControl: "banderas y neutralizacion excepcional",
    scenarioWeights: { mechanical: 1.15, strategy: 0.9, overtaking: 0.9, danger: 1.05 },
    vocabulary: {
      tyres: ["slicks castigados", "goma en ventana", "neumatico trasero recalentado"],
      strategy: ["parada de neumaticos", "aire limpio", "ritmo de turbo", "gestion de combustible"],
      incidents: ["turbo sin respuesta", "faldon tocado", "caja de cambios dura", "temperatura de frenos"],
    },
  },
  {
    id: "refuelling",
    from: 1993,
    to: 2009,
    label: "safety car moderno y repostajes",
    safetyCar: "regular",
    vsc: false,
    drs: false,
    refuelling: true,
    tyreStops: "fuel-window",
    reliability: "improving",
    raceControl: "safety car, drive-throughs y ventanas de repostaje",
    scenarioWeights: { mechanical: 0.95, strategy: 1.35, overtaking: 0.82, danger: 0.9 },
    vocabulary: {
      tyres: ["goma con carga de combustible", "stint pesado", "neumatico delantero abierto"],
      strategy: ["ventana de repostaje", "carga de combustible", "parada corta", "undercut con poco combustible"],
      incidents: ["manguera lenta", "drive-through", "entrada a boxes al limite", "bloqueo con frenos frios"],
    },
  },
  {
    id: "pirelli-drs",
    from: 2010,
    to: 2021,
    label: "Pirelli, degradacion y DRS",
    safetyCar: "regular",
    vsc: true,
    drs: true,
    refuelling: false,
    tyreStops: "degradation",
    reliability: "strong",
    raceControl: "safety car, VSC, DRS y limites de pista",
    scenarioWeights: { mechanical: 0.75, strategy: 1.25, overtaking: 1.2, danger: 0.72 },
    vocabulary: {
      tyres: ["degradacion termica", "graining delantero", "slicks contra intermedios", "cliff de goma"],
      strategy: ["undercut", "overcut", "offset de neumaticos", "delta de VSC", "tren de DRS"],
      incidents: ["limites de pista", "brake magic", "pinchazo lento", "aleron tocado"],
    },
  },
  {
    id: "ground-effect-modern",
    from: 2022,
    to: Infinity,
    label: "efecto suelo moderno",
    safetyCar: "regular",
    vsc: true,
    drs: true,
    refuelling: false,
    tyreStops: "degradation",
    reliability: "strong",
    raceControl: "safety car, VSC, DRS, track limits y direccion de carrera digital",
    scenarioWeights: { mechanical: 0.65, strategy: 1.2, overtaking: 1.3, danger: 0.65 },
    vocabulary: {
      tyres: ["degradacion termica", "neumatico en ventana", "aire sucio", "suelo danado"],
      strategy: ["undercut", "overcut", "doble parada", "delta positivo", "offset de compuestos"],
      incidents: ["suelo tocado", "track limits", "pinchazo por restos", "sobrecalentamiento de frenos"],
    },
  },
];

const ERA_CONTEXT_EVENTS = {
  frontier: [
    {
      es: "La carrera se lee como una prueba de resistencia: cada ruido del motor puede cambiar el orden antes que una pizarra de boxes.",
      en: "The race reads like an endurance test: every engine note can change the order before any pit-board plan does.",
    },
    {
      es: "Sin neutralizaciones modernas, los comisarios y las banderas locales marcan el pulso de los incidentes.",
      en: "With no modern neutralisations, marshals and local flags set the rhythm of incidents.",
    },
  ],
  "safety-awakening": [
    {
      es: "La seguridad empieza a ordenar el fin de semana, pero la carrera sigue dependiendo mucho de banderas y criterio local.",
      en: "Safety is beginning to structure the weekend, but the race still leans heavily on flags and local judgement.",
    },
    {
      es: "Los pilotos gestionan margen y mecanica: atacar demasiado pronto puede romper tanto la goma como el coche.",
      en: "Drivers manage margin and machinery: attacking too early can break both tyres and car.",
    },
  ],
  "ground-effect-turbo": [
    {
      es: "El coche va pegado al suelo, pero el margen es estrecho: un piano mal tomado o un turbo fuera de respuesta cambian media carrera.",
      en: "The car is glued to the ground, but the margin is narrow: one bad kerb or a lagging turbo can change half the race.",
    },
    {
      es: "La estrategia existe, aunque la prioridad sigue siendo mantener vivo el paquete de motor, frenos y neumaticos.",
      en: "Strategy exists, though the priority is still keeping engine, brakes and tyres alive.",
    },
  ],
  refuelling: [
    {
      es: "La carga de combustible convierte cada parada en una jugada doble: tiempo en boxes y ritmo del stint siguiente.",
      en: "Fuel load turns every stop into a double play: pit time and pace in the next stint.",
    },
    {
      es: "El safety car ya puede reabrir la carrera: entrar una vuelta antes o despues cambia toda la ventana de repostaje.",
      en: "The safety car can now reopen the race: pitting one lap earlier or later changes the whole refuelling window.",
    },
  ],
  "pirelli-drs": [
    {
      es: "La carrera vive entre degradacion, delta de VSC y trenes de DRS: el ritmo puro no basta si la goma cae.",
      en: "The race lives between degradation, VSC delta and DRS trains: raw pace is not enough if the tyre falls away.",
    },
    {
      es: "El muro calcula undercut y overcut mientras el piloto decide cuanto DRS y bateria gastar en cada ataque.",
      en: "The pit wall calculates undercut and overcut while the driver decides how much DRS and battery to spend on each attack.",
    },
  ],
  "ground-effect-modern": [
    {
      es: "El suelo manda: aire sucio, altura del coche y temperatura de goma pesan tanto como la velocidad punta.",
      en: "The floor rules: dirty air, ride height and tyre temperature matter as much as top speed.",
    },
    {
      es: "Direccion de carrera vigila limites, VSC y restos en pista mientras los equipos buscan la ventana exacta.",
      en: "Race control watches limits, VSC and debris while teams hunt the exact window.",
    },
  ],
};

const GP_LEARNED_SCENARIOS = [
  "safety_car_pit_window",
  "red_flag_restart_error",
  "leader_puncture_or_failure",
  "late_title_management",
  "drs_train_defence",
  "track_limits_penalty",
  "floor_or_wing_damage",
  "wet_dry_crossover",
  "two_stop_chase",
  "team_order_or_title_tradeoff",
];

export const getRaceEraKnowledge = (year) =>
  ERA_PROFILES.find((profile) => inRange(year, profile.from, profile.to)) || ERA_PROFILES[ERA_PROFILES.length - 1];

export const isEraFeatureAllowed = (year, feature) => {
  const era = getRaceEraKnowledge(year);
  if (feature === "drs") return era.drs;
  if (feature === "vsc") return era.vsc;
  if (feature === "refueling") return era.refuelling;
  if (feature === "safetyCar") return era.safetyCar !== "none";
  return true;
};

const translateFallback = (term, category) => {
  const dictionary = {
    "neumaticos estrechos": "narrow tyres",
    "gomas castigadas": "worn tyres",
    "trazada sucia": "dirty racing line",
    "parada larga": "long stop",
    "reparacion en boxes": "pit repair",
    "ritmo de supervivencia": "survival pace",
    "fuga de aceite": "oil leak",
    "problema de embrague": "clutch issue",
    "frenos fatigados": "tired brakes",
    "motor tosiendo": "coughing engine",
    "ventana de repostaje": "refuelling window",
    "carga de combustible": "fuel load",
    "parada corta": "short-fuel stop",
    "undercut con poco combustible": "low-fuel undercut",
    "degradacion termica": "thermal degradation",
    "tren de DRS": "DRS train",
    "delta de VSC": "VSC delta",
    "suelo danado": "floor damage",
    "track limits": "track limits",
  };
  return dictionary[term] || `${category} factor`;
};

export const chooseEraTerm = (year, category, rng = Math.random) => {
  const terms = getRaceEraKnowledge(year).vocabulary?.[category] || [];
  if (!terms.length) return null;
  const term = terms[Math.floor(rng() * terms.length)];
  return typeof term === "string" ? { es: term, en: translateFallback(term, category) } : term;
};

export const renderEraContextEvent = ({ year, lap = 1, rng = Math.random }) => {
  const era = getRaceEraKnowledge(year);
  const bank = ERA_CONTEXT_EVENTS[era.id] || ERA_CONTEXT_EVENTS["ground-effect-modern"];
  const picked = bank[Math.floor(rng() * bank.length)];
  return {
    lap,
    type: "neutral",
    important: false,
    text: picked.es,
    textEn: picked.en,
    era: era.id,
  };
};

export const raceKnowledgeStats = () => ({
  eras: ERA_PROFILES.length,
  gpLearnedScenarios: GP_LEARNED_SCENARIOS.length,
  eraContextEvents: Object.values(ERA_CONTEXT_EVENTS).reduce((sum, list) => sum + list.length, 0),
});
