// frontend/src/i18n/messages/messages_es.js
export default {
  // Body / routing
  "routes.notFound": "404",

  // Header
  "header.brandAria": "Inicio OverCut Predictions",
  "header.navAria": "Navegación principal",
  "header.home": "Inicio",
  "header.simulate": "Simular",
  "header.openOvercut": "Abrir OverCut",

  // HomePage
  "home.badge": "SIMULADOR",
  "home.subtitle":
    "Simula un campeonato desde la ronda que elijas y recalcula el mundial en tiempo real. Cambia el orden de llegada y observa cómo evoluciona la clasificación.",
  "home.ctaStart": "Empezar simulación",
  "home.ctaOvercut": "Abrir OverCut",

  // CustomSeasonModal
  "customModal.title": "Config personalizada de temporada",
  "customModal.desc":
    "Se precarga con pilotos/equipos/calendario reales si existen en tu base de datos. Puedes ajustar lo que necesites.",
      // ✅ NUEVO: sistema de puntos
    "customModal.sectionPoints": "Sistema de puntos",
    "customModal.pointsAuto": "Auto (según temporada)",
    "customModal.points1950": "1950–1960 (8-6-4-3-2-1)",
    "customModal.points1961": "1961–1990 (9-6-4-3-2-1)",
    "customModal.points1991": "1991–2002 (10-6-4-3-2-1)",
    "customModal.points2003": "2003–2009 (10-8-6-5-4-3-2-1)",
    "customModal.points2010": "2010+ (25-18-15-12-10-8-6-4-2-1)",
  "customModal.close": "Cerrar",
  "customModal.sectionTeams": "Equipos",
  "customModal.sectionDriversTeams": "Pilotos + Equipo",
  "customModal.sectionCalendar": "Calendario",
  "customModal.teamPlaceholder": "Nombre del equipo",
  "customModal.driverPlaceholder": "Nombre del piloto",
  "customModal.roundPlaceholder": "Ronda",
  "customModal.gpPlaceholder": "Nombre del GP",
  "customModal.selectTeam": "Selecciona equipo…",
  "customModal.deleteTitle": "Eliminar",
  "customModal.addTeam": "+ Añadir equipo",
  "customModal.addDriver": "+ Añadir piloto",
  "customModal.addGp": "+ Añadir GP",
  "customModal.cancel": "Cancelar",
  "customModal.bootstrap": "Bootstrap custom",

  // PredictionsHeader
  "predHeader.pillSeason": "Season",
  "predHeader.pillStart": "Start",
  "predHeader.pillRealLoaded": "{n} carreras reales cargadas",
  "predHeader.pillTotal": "Total",
  "predHeader.pillRounds": "rondas",
  "predHeader.pillMode": "Mode",
  "predHeader.loading": "Cargando…",
  "predHeader.hint": "Selecciona temporada y ronda para inicializar el campeonato.",
  "predHeader.resetTitle": "Reiniciar simulación",
  "predHeader.resetBtn": "Reset",

  // PredictionsView alert
  "pred.errorTitle": "Ha ocurrido un error",
  "pred.errorNetwork": "Error de red",
  "pred.errorHint":
    "Nota: el sistema está cargando; si el error persiste, prueba “Reset” y vuelve a bootstrap.",

  // SeasonRoundSelector
  "sr.title": "Inicializar simulación",
  "sr.desc": "Elige temporada y la ronda desde la que quieres empezar a modificar resultados.",
  "sr.custom": "Custom season",
  "sr.customTitle": "Config (basada en datos reales si existen)",
  "sr.default": "Default",
  "sr.defaultTitle": "Volver a valores por defecto",
  "sr.season": "Temporada",
  "sr.rangeYears": "Rango 1950–2026",
  "sr.fromRound": "Simular desde la ronda",
  "sr.hintWithTotal": "Temporada con {total} rondas.",
  "sr.selected": "Seleccionada:",
  "sr.max30": "máx. 30",
  "sr.hintAfterBootstrap": "Al hacer Bootstrap mostraremos el GP.",
  "sr.rangeRounds": "Rango 1–{max}",
  "sr.loading": "Cargando...",
  "sr.bootstrap": "Bootstrap",

  // SimulationPanel
  "sim.title": "Simulación",
  "sim.needBootstrap": "Haz Bootstrap para empezar",
  "sim.empty":
    "Haz Bootstrap para cargar el estado real del campeonato y empezar a simular.",
  "sim.subtitle": "{season} · Desde ronda {fromRound} · {gp}",
  "sim.gpRound": "Gran Premio (ronda)",
  "sim.apply": "Aplicar simulación",
  "sim.applyNext": "Aplicar y siguiente ronda →",
  "sim.resetOrder": "Reset orden",
  "sim.onlyFrom": "Solo puedes simular desde round {fromRound} en adelante.",
  "sim.finishingOrder": "Orden de llegada",
  "sim.countDrivers": "{n} pilotos",
  "sim.dragHint": "Arrastra para reordenar (P1 arriba) · Click 2 pilotos para intercambiar",
  "sim.metaGp": "GP: {gp}",
  "sim.selectedId": "Seleccionado: #{id}",
  "sim.note": "Ahora puedes hacer “Next” para aplicar + avanzar sin validar a mano.",
  "sim.ariaPoints": "Puntos: {points}",

  // Standings
  "stand.title": "Clasificación",
  "stand.subtitleLive": "Clasificación en tiempo real",
  "stand.empty": "Haz Bootstrap para ver la clasificación.",
  "stand.tabDrivers": "Drivers",
  "stand.tabConstructors": "Constructors",
  "stand.subtitleDrivers": "Pilotos",
  "stand.subtitleConstructors": "Constructores",
  "stand.thDriver": "Piloto",
  "stand.thConstructor": "Constructor",
  "stand.thPts": "Pts",
  "stand.footDrivers": "Clasificación pilotos",
  "stand.footConstructors": "Clasificación de equipos",
};
