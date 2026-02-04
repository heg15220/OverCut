// frontend/src/i18n/messages/messages_en.js
export default {
  // Body / routing
  "routes.notFound": "404",

  // Header
  "header.brandAria": "OverCut Predictions Home",
  "header.navAria": "Main navigation",
  "header.home": "Home",
  "header.simulate": "Simulate",
  "header.openOvercut": "Open OverCut",

  // HomePage
  "home.badge": "SIMULATOR",
  "home.subtitle":
    "Simulate a championship from the round you choose and recalculate standings in real time. Change the finishing order and see how the table evolves.",
  "home.ctaStart": "Start simulation",
  "home.ctaOvercut": "Open OverCut",

  // CustomSeasonModal
  "customModal.title": "Custom season configuration",
  "customModal.desc":
    "It preloads real drivers/teams/calendar if they exist in your database. You can tweak anything you want.",
    "customModal.sectionPoints": "Points system",
    "customModal.pointsAuto": "Auto (by season)",
    "customModal.points1950": "1950–1960 (8-6-4-3-2-1)",
    "customModal.points1961": "1961–1990 (9-6-4-3-2-1)",
    "customModal.points1991": "1991–2002 (10-6-4-3-2-1)",
    "customModal.points2003": "2003–2009 (10-8-6-5-4-3-2-1)",
    "customModal.points2010": "2010+ (25-18-15-12-10-8-6-4-2-1)",
  "customModal.close": "Close",
  "customModal.sectionTeams": "Teams",
  "customModal.sectionDriversTeams": "Drivers + Team",
  "customModal.sectionCalendar": "Calendar",
  "customModal.teamPlaceholder": "Team name",
  "customModal.driverPlaceholder": "Driver name",
  "customModal.roundPlaceholder": "Round",
  "customModal.gpPlaceholder": "Grand Prix name",
  "customModal.selectTeam": "Select team…",
  "customModal.deleteTitle": "Delete",
  "customModal.addTeam": "+ Add team",
  "customModal.addDriver": "+ Add driver",
  "customModal.addGp": "+ Add GP",
  "customModal.cancel": "Cancel",
  "customModal.bootstrap": "Bootstrap custom",

  // PredictionsHeader
  "predHeader.pillSeason": "Season",
  "predHeader.pillStart": "Start",
  "predHeader.pillRealLoaded": "{n} real races loaded",
  "predHeader.pillTotal": "Total",
  "predHeader.pillRounds": "rounds",
  "predHeader.pillMode": "Mode",
  "predHeader.loading": "Loading…",
  "predHeader.hint": "Select season and round to initialize the championship.",
  "predHeader.resetTitle": "Reset simulation",
  "predHeader.resetBtn": "Reset",

  // PredictionsView alert
  "pred.errorTitle": "Something went wrong",
  "pred.errorNetwork": "Network error",
  "pred.errorHint":
    "Note: the system is still loading; if the error persists, try “Reset” and bootstrap again.",

  // SeasonRoundSelector
  "sr.title": "Initialize simulation",
  "sr.desc": "Pick a season and the round from which you want to start modifying results.",
  "sr.custom": "Custom season",
  "sr.customTitle": "Config (preloaded from real data if available)",
  "sr.default": "Default",
  "sr.defaultTitle": "Back to default values",
  "sr.season": "Season",
  "sr.rangeYears": "Range 1950–2026",
  "sr.fromRound": "Simulate from round",
  "sr.hintWithTotal": "Season with {total} rounds.",
  "sr.selected": "Selected:",
  "sr.max30": "max. 30",
  "sr.hintAfterBootstrap": "After Bootstrap we’ll show the GP name.",
  "sr.rangeRounds": "Range 1–{max}",
  "sr.loading": "Loading...",
  "sr.bootstrap": "Bootstrap",

  // SimulationPanel
  "sim.title": "Simulation",
  "sim.needBootstrap": "Run Bootstrap to start",
  "sim.empty": "Run Bootstrap to load the real championship state and start simulating.",
  "sim.subtitle": "{season} · From round {fromRound} · {gp}",
  "sim.gpRound": "Grand Prix (round)",
  "sim.apply": "Apply simulation",
  "sim.applyNext": "Apply and Next round →",
  "sim.resetOrder": "Reset order",
  "sim.onlyFrom": "You can only simulate from round {fromRound} onwards.",
  "sim.finishingOrder": "Finishing order",
  "sim.countDrivers": "{n} drivers",
  "sim.dragHint": "Drag to reorder (P1 on top) · Click 2 drivers to swap",
  "sim.metaGp": "GP: {gp}",
  "sim.selectedId": "Selected: #{id}",
  "sim.note": "Now you can press “Next” to apply + advance without manual validation.",
  "sim.ariaPoints": "Points: {points}",

  // Standings
  "stand.title": "Standings",
  "stand.subtitleLive": "Live standings",
  "stand.empty": "Run Bootstrap to see standings.",
  "stand.tabDrivers": "Drivers",
  "stand.tabConstructors": "Constructors",
  "stand.subtitleDrivers": "Drivers",
  "stand.subtitleConstructors": "Constructors",
  "stand.thDriver": "Driver",
  "stand.thConstructor": "Constructor",
  "stand.thPts": "Pts",
  "stand.footDrivers": "Drivers standings",
  "stand.footConstructors": "Teams standings",
};
