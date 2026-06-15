// Career Mode UI strings. Locale is decided once from the browser language:
// anything starting with "es" gets Spanish, everything else gets English.
//
// The race narration (careerRaceEventCatalog / careerRaceEraKnowledge) and the
// Grand Prix names (careerRaceNames) carry their own bilingual text, so this
// module only covers the chrome rendered directly by CareerMode.js plus the few
// engine-generated tokens (driver status, contract tier) that surface in the UI.

const detectLocale = () => {
  if (typeof navigator === "undefined") return "en";
  const lang = (navigator.language || navigator.userLanguage || "en").toLowerCase();
  return lang.startsWith("es") ? "es" : "en";
};

export const locale = detectLocale();

const STRINGS = {
  es: {
    // Header / shell
    careerKicker: "OverCut Career",
    careerTitle: "Modo trayectoria",
    backToHome: "Volver a OverCut",
    homeLabel: "OverCut",
    restart: "Reiniciar",
    saveGame: "Guardar",
    saving: "Guardando",
    saveSuccess: (code) => `Partida guardada. Codigo de exportacion: ${code}`,
    saveError: "No se pudo guardar la partida.",
    loadSuccess: (code) => `Partida cargada: ${code}`,
    loadError: "No se encontro una partida con ese codigo.",
    dataFallback: "Datos locales de respaldo",
    dataCache: "Cache OverCutRacing",
    heroEntry: "Comienza una trayectoria o recupera una partida guardada",
    heroSetup: "Crea un piloto y decide cómo empieza su época",
    heroFallbackTitle: "Trayectoria F1",
    heroProfile: (name, status, seasonNumber, year) =>
      `${name} · ${status} · Temporada ${seasonNumber}${year ? ` · ${year}` : ""}`,
    heroAge: (age) => `EDAD ${age}`,
    heroRep: (rep) => `REP ${rep}`,
    heroRtg: (rtg) => `RTG ${rtg}`,

    // Driver card
    cardOverall: "GLOBAL",
    cardDriverFallback: "Piloto",
    cardIdentity: (status, age) => `${status} · ${age} años`,
    attributeNames: { pace: "Ritmo", racecraft: "Pilotaje", awareness: "Conciencia", experience: "Experiencia" },

    // On-track duel
    trackDuelTitle: "Duelo en pista",
    you: "Tú",
    teammate: "Compañero",

    // Track overlays
    overlayRedFlag: "BANDERA ROJA",
    overlaySafetyCar: "SAFETY CAR",
    overlayVsc: "VIRTUAL SC",
    overlayYellow: "BANDERA AMARILLA",
    overlayGreen: "BANDERA VERDE",
    overlayRain: "LLUVIA",
    overlayWetTrack: "PISTA MOJADA",

    // Track status (race meta)
    statusRedFlag: "Bandera roja",
    statusSafetyCar: "Safety Car",
    statusVsc: "VSC",
    statusYellow: "Bandera amarilla",
    statusGreenFlag: "Bandera verde",
    statusGreen: "Verde",

    // Conditions
    condition: { seco: "Seco", intermedios: "Intermedios", lluvia: "Lluvia" },

    // Teammate battle
    teammateBattleTitle: "Duelo con el compañero",
    battleRaces: "Carreras",
    battleQualifying: "Clasificación",
    battlePoints: "Puntos",
    battleBalance: "Balance",
    battleTied: "Empate al límite con tu compañero.",
    battleLeading: "Por delante en el cómputo de la temporada: clave para tu estatus.",
    battleBehind: "Por detrás del compañero: ganar el duelo cuenta para tu estatus.",

    // Setup panel
    step1: "Paso 1",
    setupTitle: "Crea tu piloto",
    driverNameLabel: "Nombre del piloto",
    driverNamePlaceholder: "Nombre y apellido",
    helmetColorLabel: "Color del casco",
    helmetPrimaryLabel: "Color principal",
    helmetSecondaryLabel: "Color secundario",
    helmetStyleLabel: "Formato del casco",
    helmetStyleNames: { solid: "Sólido", gradient: "Degradado", lines: "Líneas" },
    helmetAria: (color) => `Casco ${color}`,
    initialProfile: "Perfil inicial",
    newDriver: "Nuevo piloto",
    initialStats: "Rating 58 · Reputación 28 · Status rookie",
    enterF1: "Empezar Modo Trayectoria",

    // Career saves
    newGameKicker: "Nueva partida",
    existingGameKicker: "Partida existente",
    startNewGame: "Comenzar nueva partida",
    startNewGameCopy: "Crea un piloto nuevo en este navegador. Podras guardarlo y recibir un codigo de exportacion.",
    continueExisting: "Seguir con una existente",
    continueExistingCopy: "Introduce el codigo de exportacion de una partida guardada para continuar desde cualquier navegador.",
    exportCodeLabel: "Codigo de exportacion",
    browserCode: (code) => `Codigo de este navegador: ${code}`,
    loadingSave: "Cargando",

    // Decade choice
    step2: "Paso 2",
    chooseDecadeTitle: "Elige la década",
    calendarEntry: "Entrada al calendario",
    decadeFallback: "Década",
    decadeIntro: "Escoge una época concreta o deja que el dado abra la primera puerta de tu trayectoria.",
    controlLabel: "Control",
    chooseDecadeAction: "Escoger década",
    chooseDecadeHint: "Selecciona manualmente la etapa histórica donde quieres debutar.",
    randomLabel: "Azar",
    rollDiceAction: "Tirar dado",
    rollDiceHint: "El sistema sortea una década disponible antes de tirar el año.",
    availableDecades: "Décadas disponibles",

    // Year dice
    step3: "Paso 3",
    rollYearTitle: "Tira por año",
    exactSeason: "Temporada exacta",
    yearHint: (decade) => `Dentro de ${decade}, el dado decide el calendario de debut.`,
    theDecade: "la década",
    decideYear: "Decidir año",

    // Contracts
    targetPoints: "Puntos objetivo",
    constructors: "Constructores",
    topN: (n) => `Top ${n}`,
    reputation: "Reputación",
    carRatingSalary: (rating, salary) => `Rating coche ${rating} · Salario ${salary}`,
    precontractBadge: "precontrato",

    // Pre-contract notice
    precontractSigned: "Precontrato firmado",
    precontractDecided: "Se decide al final de la temporada.",

    // Contract selection
    firstContractTitle: "Elige tu primer contrato",
    firstContractCopy: (name, status) =>
      `${name} llega como ${status}. Las ofertas priorizan equipos medios y bajos: objetivos realistas, bonus de reputación y riesgo de perder el asiento si queda lejos.`,

    // Contract signing
    precontractTerm: (year) => `Precontrato ${year}`,
    contractTerm: (year) => `Contrato ${year}`,
    driverLinked: "Piloto vinculado",
    contractSigning: "Firma del contrato",
    driverLabel: "Piloto",
    teamLabel: "Escudería",
    carRating: "Rating coche",
    salary: "Salario",
    teammateLabel: "Compañero",
    toBeConfirmed: "Por confirmar",
    teammateRating: "Rating compañero",
    term: "Vigencia",
    signatureZone: "Zona de firma",
    linkedMessage: (name, team) => `${name} queda vinculado a ${team}.`,
    signingMessage: "Firmando contrato...",
    reviewMessage: "Revisa objetivos y confirma la firma.",
    back: "Volver",
    signContract: "Firmar contrato",
    backToPaddock: "Volver al paddock",
    joinTeam: "Entrar al equipo",

    // Standings
    standingsDrivers: "Pilotos",
    standingsConstructors: "Constructores",
    yourPosition: "Tu posición",
    winsCount: (n) => `${n} victorias`,

    // Race simulation
    lapOf: (lap, total) => `Vuelta ${lap}/${total}`,
    simulationSpeed: "Velocidad de simulación",
    speedNormal: "Normal",
    pause: "Pausar",
    resume: "Reanudar",
    backToLive: "Volver al directo",
    simulateRaceSkip: "Simular carrera",
    metaWeather: "Clima",
    metaDegradation: "Degradación",
    metaTrackStatus: "Estado de pista",
    lapTag: (lap) => `V${lap}`,
    viewResult: "Ver resultado",

    // Race result
    resultLabel: "Resultado",
    winnerLabel: "Ganador",
    pointsShort: (n) => `${n} pts`,
    yourResult: "Tu resultado",
    teammateResult: "Resultado del compañero",
    viewProgress: "Ver evolución",

    // Race development
    progressAfter: (raceName) => `Progreso tras ${raceName}`,
    cardImproves: "La carta sube",
    experienceGained: "Experiencia acumulada",
    devResult: "Resultado",
    devExpected: "Esperado",
    devXpFactor: "Factor XP",
    devGains: "Subidas",
    xpAmount: (n) => `+${n} XP`,
    noGain: "sin subida",
    devCopy:
      "La experiencia siempre progresa; el rendimiento sobre el objetivo del coche multiplica Ritmo, Pilotaje y Conciencia. La mejora ya cuenta desde la siguiente carrera.",
    continueSeason: "Continuar temporada",

    // Season dashboard
    currentAge: (age) => `Edad actual: ${age} años`,
    ratingReputation: (rating, reputation) => `Rating ${rating} · Reputación ${reputation}`,
    objectiveTeam: "Equipo",
    objectivePoints: "Objetivo pts",
    objectiveConstructors: "Constructores",
    objectiveRound: "Ronda",
    roundProgress: (current, total) => `${current}/${total}`,
    retire: "Retirarse",
    calendarYear: (year) => `Calendario ${year}`,
    roundLabel: (round) => `Ronda ${round}`,
    seasonComplete: "Temporada completa",
    finalEvaluation: "Evaluación final",
    driverPoints: "Puntos piloto",
    driverPosition: "Posición piloto",
    teamPoints: "Equipo pts",
    seasonCopy: (name) =>
      `La simulación calcula ritmo puro, adaptación al circuito, fiabilidad, estrategia, gestión de goma, clima variable y eventos de carrera. La narración destaca lo que afecta a ${name}.`,
    simulateRace: "Simular carrera",

    // Silly season
    sillySeasonTitle: (round) => `Silly Season · Ronda ${round}`,
    paddockAsking: "El paddock pregunta por ti",
    sillySeasonCopy:
      "Tu rendimiento y estatus han abierto conversaciones antes de acabar el año. Puedes firmar un precontrato, pero la decisión definitiva se tomará al terminar la temporada.",
    probability: "Probabilidad",
    pointsVsTarget: "Puntos vs objetivo",
    nextYear: "Proximo año",
    offers: "Ofertas",
    carryOnUnsigned: "Seguir sin firmar",

    // Season review
    endOfSeason: (year) => `Fin de temporada ${year}`,
    reviewChampion: "Campeón del mundo",
    reviewEliteSeason: "Temporada de élite",
    reviewFired: "El equipo rompe el contrato",
    reviewObjectivesMet: "Objetivos cumplidos",
    reviewInsufficient: "Temporada insuficiente",
    reviewPoints: "Puntos",
    reviewChampionship: "Mundial",
    reviewTeam: "Equipo",
    reviewReputation: "Reputación",
    teammateTied: "Duelo interno igualado: sin efecto en la reputación.",
    teammateBeaten: (delta) => `Ganaste a tu compañero en el cómputo final (${delta} reputación).`,
    teammateLost: (delta) => `Tu compañero te superó en el cómputo final (${delta} reputación).`,
    reviewFiredCopy:
      "La directiva considera que el rendimiento quedó lejos del mínimo. Las nuevas ofertas bajan el riesgo y el nivel.",
    reviewOverDeliveredCopy:
      "El paddock toma nota: el rendimiento supera el valor del coche y abre puertas mejores.",
    reviewMarketCopy:
      "El mercado reacciona de forma gradual: ofertas cercanas al estatus actual y alguna apuesta condicionada.",
    sillySeasonDecision: "Decisión de Silly Season",
    precontractChoiceCopy: (team) =>
      `Tienes un acuerdo previo con ${team}. Puedes respetarlo y cerrar el asiento, o romper la prioridad para mirar el mercado final de temporada.`,
    honorPrecontract: "Cumplir precontrato",
    lookOtherOffers: "Mirar otras ofertas",
    retireNow: "Retirarse ahora",

    // Retirement
    retirementLabel: "Retirada",
    retSeasons: "Temporadas",
    retTeams: "Equipos",
    retPoints: "Puntos",
    retWins: "Victorias",
    retPodiums: "Podios",
    retTitles: "Títulos",
    newCareer: "Nueva trayectoria",

    // Engine tokens shown in the UI
    status: { rookie: "rookie", promesa: "promesa", estrella: "estrella" },
    tier: { top: "top", medio: "medio", "bajo competitivo": "bajo competitivo", bajo: "bajo" },
  },
  en: {
    // Header / shell
    careerKicker: "OverCut Career",
    careerTitle: "Career mode",
    backToHome: "Back to OverCut",
    homeLabel: "OverCut",
    restart: "Restart",
    saveGame: "Save",
    saving: "Saving",
    saveSuccess: (code) => `Game saved. Export code: ${code}`,
    saveError: "The game could not be saved.",
    loadSuccess: (code) => `Game loaded: ${code}`,
    loadError: "No saved game was found for that code.",
    dataFallback: "Local fallback data",
    dataCache: "OverCutRacing cache",
    heroEntry: "Start a career or recover a saved game",
    heroSetup: "Create a driver and decide how their era begins",
    heroFallbackTitle: "F1 career",
    heroProfile: (name, status, seasonNumber, year) =>
      `${name} · ${status} · Season ${seasonNumber}${year ? ` · ${year}` : ""}`,
    heroAge: (age) => `AGE ${age}`,
    heroRep: (rep) => `REP ${rep}`,
    heroRtg: (rtg) => `RTG ${rtg}`,

    // Driver card
    cardOverall: "OVERALL",
    cardDriverFallback: "Driver",
    cardIdentity: (status, age) => `${status} · age ${age}`,
    attributeNames: { pace: "Pace", racecraft: "Racecraft", awareness: "Awareness", experience: "Experience" },

    // On-track duel
    trackDuelTitle: "On-track duel",
    you: "You",
    teammate: "Team-mate",

    // Track overlays
    overlayRedFlag: "RED FLAG",
    overlaySafetyCar: "SAFETY CAR",
    overlayVsc: "VIRTUAL SC",
    overlayYellow: "YELLOW FLAG",
    overlayGreen: "GREEN FLAG",
    overlayRain: "RAIN",
    overlayWetTrack: "WET TRACK",

    // Track status (race meta)
    statusRedFlag: "Red flag",
    statusSafetyCar: "Safety Car",
    statusVsc: "VSC",
    statusYellow: "Yellow flag",
    statusGreenFlag: "Green flag",
    statusGreen: "Green",

    // Conditions
    condition: { seco: "Dry", intermedios: "Intermediates", lluvia: "Wet" },

    // Teammate battle
    teammateBattleTitle: "Team-mate duel",
    battleRaces: "Races",
    battleQualifying: "Qualifying",
    battlePoints: "Points",
    battleBalance: "Balance",
    battleTied: "Dead level with your team-mate.",
    battleLeading: "Ahead on the season tally: key to your status.",
    battleBehind: "Behind your team-mate: winning the duel counts towards your status.",

    // Setup panel
    step1: "Step 1",
    setupTitle: "Create your driver",
    driverNameLabel: "Driver name",
    driverNamePlaceholder: "First and last name",
    helmetColorLabel: "Helmet colour",
    helmetPrimaryLabel: "Primary colour",
    helmetSecondaryLabel: "Secondary colour",
    helmetStyleLabel: "Helmet style",
    helmetStyleNames: { solid: "Solid", gradient: "Gradient", lines: "Lines" },
    helmetAria: (color) => `Helmet ${color}`,
    initialProfile: "Initial profile",
    newDriver: "New driver",
    initialStats: "Rating 58 · Reputation 28 · rookie status",
    enterF1: "Start Career Mode",

    // Career saves
    newGameKicker: "New game",
    existingGameKicker: "Existing game",
    startNewGame: "Start new game",
    startNewGameCopy: "Create a new driver in this browser. You can save later and receive an export code.",
    continueExisting: "Continue existing",
    continueExistingCopy: "Enter the export code for a saved game to continue from any browser.",
    exportCodeLabel: "Export code",
    browserCode: (code) => `This browser's code: ${code}`,
    loadingSave: "Loading",

    // Decade choice
    step2: "Step 2",
    chooseDecadeTitle: "Choose the decade",
    calendarEntry: "Calendar entry",
    decadeFallback: "Decade",
    decadeIntro: "Pick a specific era or let the dice open the first door of your career.",
    controlLabel: "Control",
    chooseDecadeAction: "Choose decade",
    chooseDecadeHint: "Manually select the historic era where you want to debut.",
    randomLabel: "Random",
    rollDiceAction: "Roll the dice",
    rollDiceHint: "The system draws an available decade before rolling for the year.",
    availableDecades: "Available decades",

    // Year dice
    step3: "Step 3",
    rollYearTitle: "Roll for year",
    exactSeason: "Exact season",
    yearHint: (decade) => `Within ${decade}, the dice decides the debut calendar.`,
    theDecade: "the decade",
    decideYear: "Decide year",

    // Contracts
    targetPoints: "Target points",
    constructors: "Constructors",
    topN: (n) => `Top ${n}`,
    reputation: "Reputation",
    carRatingSalary: (rating, salary) => `Car rating ${rating} · Salary ${salary}`,
    precontractBadge: "pre-contract",

    // Pre-contract notice
    precontractSigned: "Pre-contract signed",
    precontractDecided: "Decided at the end of the season.",

    // Contract selection
    firstContractTitle: "Choose your first contract",
    firstContractCopy: (name, status) =>
      `${name} arrives as a ${status}. The offers favour midfield and backmarker teams: realistic targets, reputation bonuses and a risk of losing the seat if you fall short.`,

    // Contract signing
    precontractTerm: (year) => `Pre-contract ${year}`,
    contractTerm: (year) => `Contract ${year}`,
    driverLinked: "Driver signed",
    contractSigning: "Contract signing",
    driverLabel: "Driver",
    teamLabel: "Team",
    carRating: "Car rating",
    salary: "Salary",
    teammateLabel: "Team-mate",
    toBeConfirmed: "To be confirmed",
    teammateRating: "Team-mate rating",
    term: "Term",
    signatureZone: "Signature area",
    linkedMessage: (name, team) => `${name} is now signed to ${team}.`,
    signingMessage: "Signing contract...",
    reviewMessage: "Review the targets and confirm the signing.",
    back: "Back",
    signContract: "Sign contract",
    backToPaddock: "Back to the paddock",
    joinTeam: "Join the team",

    // Standings
    standingsDrivers: "Drivers",
    standingsConstructors: "Constructors",
    yourPosition: "Your position",
    winsCount: (n) => `${n} wins`,

    // Race simulation
    lapOf: (lap, total) => `Lap ${lap}/${total}`,
    simulationSpeed: "Simulation speed",
    speedNormal: "Normal",
    pause: "Pause",
    resume: "Resume",
    backToLive: "Back to live",
    simulateRaceSkip: "Simulate race",
    metaWeather: "Weather",
    metaDegradation: "Degradation",
    metaTrackStatus: "Track status",
    lapTag: (lap) => `L${lap}`,
    viewResult: "View result",

    // Race result
    resultLabel: "Result",
    winnerLabel: "Winner",
    pointsShort: (n) => `${n} pts`,
    yourResult: "Your result",
    teammateResult: "Team-mate result",
    viewProgress: "View progress",

    // Race development
    progressAfter: (raceName) => `Progress after ${raceName}`,
    cardImproves: "The card improves",
    experienceGained: "Experience gained",
    devResult: "Result",
    devExpected: "Expected",
    devXpFactor: "XP factor",
    devGains: "Gains",
    xpAmount: (n) => `+${n} XP`,
    noGain: "no gain",
    devCopy:
      "Experience always grows; performance against the car's target multiplies Pace, Racecraft and Awareness. The improvement already counts from the next race.",
    continueSeason: "Continue season",

    // Season dashboard
    currentAge: (age) => `Current age: ${age}`,
    ratingReputation: (rating, reputation) => `Rating ${rating} · Reputation ${reputation}`,
    objectiveTeam: "Team",
    objectivePoints: "Target pts",
    objectiveConstructors: "Constructors",
    objectiveRound: "Round",
    roundProgress: (current, total) => `${current}/${total}`,
    retire: "Retire",
    calendarYear: (year) => `${year} calendar`,
    roundLabel: (round) => `Round ${round}`,
    seasonComplete: "Season complete",
    finalEvaluation: "Final evaluation",
    driverPoints: "Driver points",
    driverPosition: "Driver position",
    teamPoints: "Team pts",
    seasonCopy: (name) =>
      `The simulation models raw pace, circuit adaptation, reliability, strategy, tyre management, variable weather and race events. The narration highlights what affects ${name}.`,
    simulateRace: "Simulate race",

    // Silly season
    sillySeasonTitle: (round) => `Silly Season · Round ${round}`,
    paddockAsking: "The paddock is asking about you",
    sillySeasonCopy:
      "Your form and status have opened conversations before the year is out. You can sign a pre-contract, but the final decision will be made when the season ends.",
    probability: "Probability",
    pointsVsTarget: "Points vs target",
    nextYear: "Next year",
    offers: "Offers",
    carryOnUnsigned: "Carry on without signing",

    // Season review
    endOfSeason: (year) => `End of season ${year}`,
    reviewChampion: "World champion",
    reviewEliteSeason: "Elite season",
    reviewFired: "The team breaks the contract",
    reviewObjectivesMet: "Objectives met",
    reviewInsufficient: "Season fell short",
    reviewPoints: "Points",
    reviewChampionship: "Championship",
    reviewTeam: "Team",
    reviewReputation: "Reputation",
    teammateTied: "Internal duel level: no effect on reputation.",
    teammateBeaten: (delta) => `You beat your team-mate in the final tally (${delta} reputation).`,
    teammateLost: (delta) => `Your team-mate beat you in the final tally (${delta} reputation).`,
    reviewFiredCopy:
      "The board feels the performance fell well short of the minimum. The new offers lower the risk and the level.",
    reviewOverDeliveredCopy:
      "The paddock takes note: the performance beats the car's value and opens better doors.",
    reviewMarketCopy:
      "The market reacts gradually: offers close to your current status and the odd conditional bet.",
    sillySeasonDecision: "Silly Season decision",
    precontractChoiceCopy: (team) =>
      `You have a prior agreement with ${team}. You can honour it and lock in the seat, or break the priority to look at the end-of-season market.`,
    honorPrecontract: "Honour pre-contract",
    lookOtherOffers: "Look at other offers",
    retireNow: "Retire now",

    // Retirement
    retirementLabel: "Retirement",
    retSeasons: "Seasons",
    retTeams: "Teams",
    retPoints: "Points",
    retWins: "Wins",
    retPodiums: "Podiums",
    retTitles: "Titles",
    newCareer: "New career",

    // Engine tokens shown in the UI
    status: { rookie: "rookie", promesa: "prospect", estrella: "star" },
    tier: { top: "top", medio: "midfield", "bajo competitivo": "lower midfield", bajo: "backmarker" },
  },
};

export const strings = STRINGS[locale];

// Translate an engine status token ("rookie" | "promesa" | "estrella") for display.
export const statusLabel = (status) => strings.status[status] || status;

// Translate an engine contract tier token for display.
export const tierLabel = (tier) => strings.tier[tier] || tier;

// Translate a weather condition token ("seco" | "intermedios" | "lluvia").
export const conditionLabel = (condition) => strings.condition[condition] || condition;
