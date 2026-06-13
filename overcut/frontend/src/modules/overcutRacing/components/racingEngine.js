import {
  classifyRaceScenario,
  pickDecisiveMoment,
  renderChampionTitle,
  renderLastRacePreview,
  renderRaceNarrative,
  renderSeasonIntro,
} from "./narratives";
import { locale, strings } from "./i18n";
import { translateGrandPrixName } from "./grandPrixTranslations";
import { describeScoringSystem, effectiveResultLimit, pickScoringSystem } from "./scoringSystems";

const WEATHER_LABELS = {
  dry: strings.weatherDry,
  mixed: strings.weatherMixed,
  wet: strings.weatherWet,
};

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

// --- Balance tuning ---------------------------------------------------------
// Target: the front group (top-4 by rating) wins ~80% of clean dry races,
// ~65% behind a safety car and ~55% in the wet.
//
// The main lever is GRIP: how much of a car/driver's rating advantage actually
// counts in each condition. In the dry the best cars get their full edge; rain
// and safety-car restarts COMPRESS the field (everyone closer), so ratings
// matter less and surprises rise — exactly like real life. Volatility then adds
// the residual race-to-race randomness on top.
const GRIP = { dry: 1.0, safetyCar: 0.72, wet: 0.3, mixed: 0.5 };
const RACE_VOLATILITY = {
  base: 4, // baseline shuffle in a clean dry race
  chaos: 9, // extra shuffle on chaotic circuits
  wet: 11, // residual chaos on top of wet compression
  mixed: 9, // residual chaos in mixed conditions
  safetyCar: 5, // restart lottery on top of SC compression
  drift: 0.06, // slow season-long variance creep
};
// Momentum weights (form streaks and team trend). High enough to reward
// consistency, low enough not to let a single fluke snowball into dominance.
const FORM_WEIGHT = 1.45;
const TEAM_TREND_WEIGHT = 1.0;
// Per-driver wet talent swing (rain masters vs. drivers who struggle).
const WET_SKILL_SWING = { wet: 8, mixed: 4, dry: 1.5 };
// The championship arc only *nudges* the racing now (soft push), it no longer
// scripts a protagonist. The storyline still emerges from real standings.
const ARC_NUDGE = 0.34;
// ---------------------------------------------------------------------------

const hashString = (value) => {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
};

const normalizeHexColor = (color) => {
  if (!/^#[0-9a-f]{6}$/i.test(color || "")) {
    return "#0a2d52";
  }
  const red = parseInt(color.slice(1, 3), 16);
  const green = parseInt(color.slice(3, 5), 16);
  const blue = parseInt(color.slice(5, 7), 16);
  const luminance = (0.2126 * red + 0.7152 * green + 0.0722 * blue) / 255;
  return luminance > 0.68 ? "#0f4c81" : color;
};

const createRng = (seedText) => {
  let seed = hashString(seedText) || 1;
  return () => {
    seed += 0x6d2b79f5;
    let t = seed;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const teamColor = (name, index) => {
  const colors = [
    "#d0182f",
    "#ff8700",
    "#00a19c",
    "#1e5bc6",
    "#0090ff",
    "#641e9b",
    "#006f62",
    "#c8b273",
    "#7a4f12",
    "#263238",
    "#b71c1c",
  ];
  return normalizeHexColor(colors[(hashString(name) + index) % colors.length]);
};

export const buildGrid = (teams, drivers) =>
  teams.map((team, index) => {
    const driverA = drivers[index * 2];
    const driverB = drivers[index * 2 + 1];
    const reliability = clamp(0.68 + team.rating / 330 + ((hashString(team.name) % 9) - 4) / 100, 0.7, 0.96);
    return {
      ...team,
      color: normalizeHexColor(team.color || teamColor(team.name, index)),
      reliability,
      drivers: [driverA, driverB].filter(Boolean),
    };
  });

const raceProfile = (raceName) => {
  const name = raceName.toLowerCase();
  const profile = {
    power: 0.5,
    street: 0.3,
    tyre: 0.45,
    chaos: 0.32,
    overtaking: 0.48,
  };

  if (name.includes("monaco") || name.includes("singapore") || name.includes("las vegas") || name.includes("azerbaijan")) {
    profile.street += 0.35;
    profile.chaos += 0.15;
    profile.overtaking -= 0.14;
  }
  if (name.includes("italian") || name.includes("monza") || name.includes("belgian") || name.includes("spa") || name.includes("british")) {
    profile.power += 0.28;
    profile.overtaking += 0.1;
  }
  if (name.includes("hungarian") || name.includes("spanish") || name.includes("dutch") || name.includes("emilia")) {
    profile.tyre += 0.24;
    profile.overtaking -= 0.04;
  }
  if (name.includes("brazil") || name.includes("sao paulo") || name.includes("canadian") || name.includes("australian")) {
    profile.chaos += 0.12;
    profile.overtaking += 0.08;
  }

  return {
    power: clamp(profile.power, 0, 1),
    street: clamp(profile.street, 0, 1),
    tyre: clamp(profile.tyre, 0, 1),
    chaos: clamp(profile.chaos, 0, 1),
    overtaking: clamp(profile.overtaking, 0, 1),
  };
};

const raceConditions = (profile, rng) => {
  const wetRoll = rng();
  const weatherCode =
    wetRoll < profile.chaos * 0.16
      ? "wet"
      : wetRoll < profile.chaos * 0.32 + profile.tyre * 0.05
      ? "mixed"
      : "dry";
  const weatherRisk = weatherCode === "wet" ? 0.2 : weatherCode === "mixed" ? 0.1 : 0;
  const degradation = clamp(profile.tyre * 0.72 + rng() * 0.34 + (weatherCode === "dry" ? 0.04 : -0.03), 0.12, 0.96);

  return {
    weatherCode,
    weather: WEATHER_LABELS[weatherCode],
    safetyCar: rng() < clamp(profile.chaos * 0.34 + weatherRisk, 0.08, 0.58),
    degradation,
    trackTemp: Math.round(16 + degradation * 21 + rng() * 10),
  };
};

const chooseStrategy = ({ entrant, standing, leaderBefore, gapBefore, profile, conditions, rng }) => {
  const bias = (hashString(`${entrant.driver.name}-${entrant.team.name}-strategy`) % 100) / 100;
  const chasingLeader = leaderBefore && standing.id !== leaderBefore.id && gapBefore <= 35;

  if (conditions.weatherCode !== "dry" && rng() < 0.34 + profile.chaos * 0.22) {
    return {
      code: "early_inter",
      label: strings.strategyEarlyInter,
      score: 2.2 + profile.chaos * 4 + (bias - 0.45) * 3,
      risk: 0.02,
    };
  }

  if (chasingLeader && rng() < 0.46 + profile.overtaking * 0.16) {
    return {
      code: "undercut",
      label: strings.strategyUndercut,
      score: 1.8 + profile.overtaking * 3.2 + (rng() - 0.44) * 4,
      risk: 0.018,
    };
  }

  if (conditions.degradation > 0.66 && bias > 0.42) {
    return {
      code: "tyre_mgmt",
      label: strings.strategyTyreManagement,
      score: 1.6 + conditions.degradation * 3.1,
      risk: -0.008,
    };
  }

  if (profile.street > 0.5) {
    return {
      code: "track_pos",
      label: strings.strategyTrackPosition,
      score: 1.4 + profile.street * 2.8 + (bias - 0.5) * 2,
      risk: 0.006,
    };
  }

  return {
    code: "pure_pace",
    label: strings.strategyPureRace,
    score: (bias - 0.5) * 2,
    risk: 0,
  };
};

const entrantId = (driver, team) => `${driver.name}__${team.name}`;

const sortStandings = (standings) =>
  [...standings.values()].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.wins !== a.wins) return b.wins - a.wins;
    if (b.podiums !== a.podiums) return b.podiums - a.podiums;
    return a.name.localeCompare(b.name);
  });

const sumBestScores = (scores, limit) => {
  if (!limit || scores.length <= limit) {
    return scores.reduce((total, score) => total + score, 0);
  }
  return scores
    .slice()
    .sort((a, b) => b - a)
    .slice(0, limit)
    .reduce((total, score) => total + score, 0);
};

const scoreBestResults = (scores, scoringSystem, totalRaces) => {
  const validScores = scores.filter((score) => Number.isFinite(score));
  if (scoringSystem.segmentLimits) {
    const splitIndex = Math.ceil(totalRaces / 2);
    const firstSegment = validScores.slice(0, splitIndex);
    const secondSegment = validScores.slice(splitIndex);
    return (
      sumBestScores(firstSegment, effectiveResultLimit(scoringSystem.segmentLimits[0], splitIndex)) +
      sumBestScores(secondSegment, effectiveResultLimit(scoringSystem.segmentLimits[1], totalRaces - splitIndex))
    );
  }
  return sumBestScores(validScores, effectiveResultLimit(scoringSystem.maxResults, totalRaces));
};

const refreshScoredStandings = (standings, scoringSystem, totalRaces) => {
  standings.forEach((row) => {
    row.points = scoreBestResults(row.raceScores || [], scoringSystem, totalRaces);
    row.rawPoints = (row.raceScores || []).reduce((total, score) => total + score, 0);
  });
};

const topGap = (standings) => {
  const sorted = sortStandings(standings);
  if (sorted.length < 2) return 0;
  return sorted[0].points - sorted[1].points;
};

const getRecentWinnerStreak = (history, key) => {
  if (!history.length) return 0;
  const last = history[history.length - 1][key];
  let streak = 0;
  for (let i = history.length - 1; i >= 0; i -= 1) {
    if (history[i][key] !== last) break;
    streak += 1;
  }
  return streak;
};

const pickMidfieldHighlights = (fullOrder, winner) => {
  const candidates = fullOrder
    .filter(
      (result) =>
        result.status !== "DNF" &&
        result.id !== winner.id &&
        result.position >= 4 &&
        result.position <= 10 &&
        result.baseRank >= 6
    )
    .map((result) => ({
      ...result,
      overPerformance: Math.max(0, result.baseRank - result.position),
      highlightScore: Math.max(0, result.baseRank - result.position) * 2 + result.points + (result.fastestLap ? 2 : 0),
    }))
    .filter((result) => result.points > 0 || result.overPerformance >= 3 || result.fastestLap);

  if (!candidates.length) return [];

  const selected = [];
  candidates
    .sort((a, b) => b.highlightScore - a.highlightScore || a.position - b.position)
    .forEach((highlight) => {
      if (selected.length >= 3) return;
      if (selected.some((entry) => entry.team.name === highlight.team.name)) return;
      selected.push(highlight);
    });

  return selected.map((highlight) => ({
    driver: highlight.driver.name,
    team: highlight.team.name,
    position: highlight.position,
    points: highlight.points,
    baseRank: highlight.baseRank,
    overPerformance: highlight.overPerformance,
    fastestLap: highlight.fastestLap,
    strategy: highlight.strategy.label,
  }));
};

const arcLabels = {
  es: {
    driver_domination: "un piloto puede romper el campeonato desde el primer tercio",
    team_domination: "un equipo amenaza con dominar con sus dos coches",
    cross_team_duel: "dos lideres de equipos distintos pueden repartirse el mundial carrera a carrera",
    intra_team_duel: "dos companeros pueden convertir el garaje en la pelea principal por el titulo",
    streak_breakaway: "un duelo directo puede romperse por una racha decisiva en la segunda mitad",
    three_way: "la pelea puede abrirse a tres candidatos reales",
    four_way: "el titulo puede sobrevivir con cuatro aspirantes en paralelo",
    final_shootout: "el guion empuja hacia una ultima carrera con varios pilotos vivos",
    open: "un mundial abierto, sensible a rachas, abandonos y golpes de estrategia",
  },
  en: {
    driver_domination: "one driver may break the championship from the opening third",
    team_domination: "one team threatens to dominate with both cars",
    cross_team_duel: "two leaders from different teams may trade the title race round by round",
    intra_team_duel: "two team-mates may turn one garage into the main title fight",
    streak_breakaway: "a direct duel may break open through a decisive second-half streak",
    three_way: "the fight may open up to three real contenders",
    four_way: "the title may survive with four parallel contenders",
    final_shootout: "the plot leans toward a final race with several drivers alive",
    open: "an open championship shaped by streaks, retirements and strategy swings",
  },
};

const arcLabelFor = (type) => (locale === "en" ? arcLabels.en[type] || arcLabels.en.open : arcLabels.es[type] || arcLabels.es.open);

const buildArc = (type, extras = {}) => ({
  type,
  label: arcLabelFor(type),
  ...extras,
});

const toTitleContenders = (standings, maxPoints) => titleContenders(standings, maxPoints).slice(0, 5);

const hasSameTeamTopTwo = (standings) => standings.length >= 2 && standings[0].team === standings[1].team;

const hasCrossTeamTopTwo = (standings) => standings.length >= 2 && standings[0].team !== standings[1].team;

const buildContenderIds = (standings, count) => standings.slice(0, Math.min(count, standings.length)).map((row) => row.id);

const deriveChampionshipArc = ({ driverStandings, constructorStandings, history, raceIndex, totalRaces, maxRacePoints }) => {
  const standings = sortStandings(driverStandings);
  const constructors = sortStandings(constructorStandings);
  const leader = standings[0];
  const second = standings[1];
  const third = standings[2];
  const fourth = standings[3];
  const remainingRaces = Math.max(0, totalRaces - raceIndex - 1);
  const contenders = toTitleContenders(standings, remainingRaces * maxRacePoints || maxRacePoints);
  const recentDriverStreak = getRecentWinnerStreak(history, "winner");
  const recentTeamStreak = getRecentWinnerStreak(history, "teamWinner");
  const leaderGap = leader && second ? leader.points - second.points : 0;
  const leaderWins = leader?.wins || 0;
  const leaderPodiums = leader?.podiums || 0;
  const topTeam = constructors[0];
  const topTeamGap = constructors.length >= 2 ? constructors[0].points - constructors[1].points : 0;
  const topTeamDrivers = standings.filter((row) => row.team === topTeam?.name).slice(0, 2);
  const sameTeamGap = hasSameTeamTopTwo(standings) ? leaderGap : 999;
  const sameTeamContenders = hasSameTeamTopTwo(standings) ? buildContenderIds(standings.filter((row) => row.team === leader.team), 2) : [];
  const crossTeamContenders = hasCrossTeamTopTwo(standings) ? buildContenderIds(standings, 2) : [];

  if (remainingRaces <= 0 && contenders.length >= 5) {
    return buildArc("final_shootout", { contenderIds: buildContenderIds(contenders, 5) });
  }

  if (recentDriverStreak >= 3 && raceIndex >= Math.floor(totalRaces / 2) && leaderGap >= maxRacePoints) {
    return buildArc("streak_breakaway", {
      contenderIds: buildContenderIds(contenders.length >= 2 ? contenders : standings, 2),
      breakawayId: leader?.id,
      driverId: leader?.id,
    });
  }

  if (hasSameTeamTopTwo(standings)) {
    if (leaderGap <= maxRacePoints && (sameTeamGap <= maxRacePoints || topTeamGap >= maxRacePoints * 2)) {
      return buildArc("intra_team_duel", {
        teamName: leader.team,
        contenderIds: sameTeamContenders.length >= 2 ? sameTeamContenders : buildContenderIds(standings.filter((row) => row.team === leader.team), 2),
      });
    }
    if (topTeamGap >= maxRacePoints * 3 || (topTeamDrivers.length >= 2 && topTeamDrivers[0].wins + topTeamDrivers[1].wins >= 3)) {
      return buildArc("team_domination", {
        teamName: topTeam?.name,
        contenderIds: topTeamDrivers.length >= 2 ? topTeamDrivers.map((row) => row.id) : buildContenderIds(standings.filter((row) => row.team === topTeam?.name), 2),
      });
    }
  }

  if (hasCrossTeamTopTwo(standings) && leaderGap <= maxRacePoints * 2 && contenders.length <= 4) {
    return buildArc("cross_team_duel", {
      contenderIds: crossTeamContenders.length >= 2 ? crossTeamContenders : buildContenderIds(standings, 2),
    });
  }

  if (recentTeamStreak >= 4 && topTeamGap >= maxRacePoints * 2) {
    return buildArc("team_domination", {
      teamName: topTeam?.name,
      contenderIds: topTeamDrivers.length >= 2 ? topTeamDrivers.map((row) => row.id) : buildContenderIds(standings.filter((row) => row.team === topTeam?.name), 2),
    });
  }

  if (leader && leaderGap >= maxRacePoints * 6 && leaderWins >= Math.max(3, Math.ceil(raceIndex / 2))) {
    return buildArc("driver_domination", {
      driverId: leader.id,
      contenderIds: buildContenderIds(standings, 2),
    });
  }

  if (contenders.length >= 5 && remainingRaces <= 2) {
    return buildArc("final_shootout", { contenderIds: buildContenderIds(contenders, 5) });
  }

  if (contenders.length === 4) {
    return buildArc("four_way", { contenderIds: buildContenderIds(contenders, 4) });
  }

  if (contenders.length === 3) {
    return buildArc("three_way", { contenderIds: buildContenderIds(contenders, 3) });
  }

  if (leader && leaderGap <= maxRacePoints * 2 && contenders.length === 2) {
    return buildArc(crossTeamContenders.length >= 2 ? "cross_team_duel" : "intra_team_duel", {
      teamName: leader.team,
      contenderIds: buildContenderIds(contenders, 2),
    });
  }

  if (leader && leaderGap <= maxRacePoints && leaderPodiums >= 3 && raceIndex < Math.floor(totalRaces / 2)) {
    return buildArc("open");
  }

  return buildArc("open");
};

const titleContenders = (standings, maxPoints) => {
  const sorted = Array.isArray(standings) ? standings : sortStandings(standings);
  const leader = sorted[0];
  if (!leader) return [];
  return sorted.filter((row) => leader.points - row.points <= maxPoints);
};

const seasonArcScore = ({ arc, entrant, raceIndex, raceCount, standingsBefore, rng }) => {
  if (!arc || arc.type === "open") return 0;
  const progress = raceCount > 1 ? raceIndex / (raceCount - 1) : 0;
  const leader = standingsBefore[0];
  const standing = standingsBefore.find((row) => row.id === entrant.id);
  const gapToLeader = leader && standing ? leader.points - standing.points : 0;
  const isContender = arc.contenderIds.includes(entrant.id);

  if (arc.type === "driver_domination") {
    if (entrant.id === arc.driverId) return 8.5 + progress * 3.5;
    if (progress > 0.7 && gapToLeader > 45 && rng() < 0.18) return 5.5;
    return 0;
  }

  if (arc.type === "team_domination") {
    if (entrant.team.name === arc.teamName) {
      const surpriseBrake = progress > 0.25 && Math.floor(progress * raceCount) % 5 === 3 ? -8 : 0;
      return 11.5 + progress * 3.2 + surpriseBrake;
    }
    return progress > 0.35 && rng() < 0.1 ? 5.5 : 0;
  }

  if (arc.type === "cross_team_duel") {
    if (!isContender) return 0;
    const phase = Math.floor(progress * raceCount) % 2;
    const rotationTarget = arc.contenderIds[phase] || arc.contenderIds[0];
    const chaseBoost = gapToLeader > 0 && gapToLeader <= 40 ? clamp(gapToLeader / 6, 1.5, 7.5) : 0;
    return entrant.id === rotationTarget ? 5.2 + chaseBoost : 3.2 + chaseBoost * 0.8;
  }

  if (arc.type === "intra_team_duel") {
    if (!isContender) {
      return entrant.team.name === arc.teamName ? 1.2 : 0;
    }
    const phase = Math.floor(progress * raceCount) % 2;
    const rotationTarget = arc.contenderIds[phase] || arc.contenderIds[0];
    const garagePressure = leader?.team === entrant.team.name ? -1.2 : 0;
    const chaseBoost = gapToLeader > 0 && gapToLeader <= 35 ? clamp(gapToLeader / 7, 1.2, 6.5) : 0;
    return entrant.id === rotationTarget ? 4.8 + chaseBoost + garagePressure : 3 + chaseBoost * 0.85 + garagePressure;
  }

  if (arc.type === "streak_breakaway") {
    if (!isContender) return 0;
    if (progress < 0.42) {
      const phase = Math.floor(progress * raceCount) % 2;
      return entrant.id === arc.contenderIds[phase] ? 5 : 4.2;
    }
    if (entrant.id === arc.breakawayId) {
      return 9.5 + progress * 5.5;
    }
    return gapToLeader <= 18 ? 2 : -2.8 - progress * 2.4;
  }

  if (arc.type === "three_way" || arc.type === "four_way") {
    if (!isContender) return 0;
    const phase = Math.floor(progress * arc.contenderIds.length) % arc.contenderIds.length;
    const rotationTarget = arc.contenderIds[phase];
    const chaseBoost = gapToLeader > 0 && gapToLeader <= 55 ? clamp(gapToLeader / 8, 1, 7) : 0;
    return entrant.id === rotationTarget ? 5.5 + chaseBoost : 2.5 + chaseBoost * 0.7;
  }

  if (arc.type === "final_shootout") {
    if (!isContender) return 0;
    if (progress < 0.5) return 1.8;
    if (leader?.id === entrant.id && gapToLeader === 0) return -clamp(standing.points / 42, 0, 5);
    return clamp(gapToLeader / 5, 2.5, 10.5);
  }

  return 0;
};

export const simulateChampionship = ({ teams, drivers, races, seasonYear }) => {
  const grid = buildGrid(teams, drivers);
  const seed = `${seasonYear}|${teams.map((team) => team.name).join("|")}|${drivers.map((driver) => driver.name).join("|")}`;
  const rng = createRng(seed);
  const scoringSystem = pickScoringSystem(rng);
  const entrants = grid.flatMap((team) =>
    team.drivers.map((driver) => ({
      id: entrantId(driver, team),
      driver,
      team,
      form: 0,
      recentDnfs: 0,
      base: driver.rating * 0.58 + team.rating * 0.42,
    }))
  );
  const maxRacePoints = (scoringSystem.points[0] || 0) + (scoringSystem.fastestLap || 0);
  const fieldMeanBase = entrants.reduce((total, entrant) => total + entrant.base, 0) / entrants.length;
  let seasonArc = buildArc("open");

  const driverStandings = new Map(
    entrants.map((entrant) => [
      entrant.id,
      {
        id: entrant.id,
        name: entrant.driver.name,
        team: entrant.team.name,
        color: entrant.team.color,
        helmetColor: entrant.driver.helmetColor,
        points: 0,
        rawPoints: 0,
        raceScores: [],
        wins: 0,
        podiums: 0,
        dnfs: 0,
      },
    ])
  );
  const constructorStandings = new Map(
    grid.map((team) => [
      team.name,
      {
        id: team.id,
        name: team.name,
        color: team.color,
        points: 0,
        rawPoints: 0,
        raceScores: [],
        wins: 0,
        podiums: 0,
      },
    ])
  );

  const teamMomentum = new Map(grid.map((team) => [team.name, 0]));
  const history = [];
  let championAnnounced = false;

  const raceResults = races.map((race, raceIndex) => {
    const originalRaceName = race.name;
    const displayRaceName = translateGrandPrixName(originalRaceName);
    const profile = raceProfile(originalRaceName);
    const conditions = raceConditions(profile, rng);
    const raceArcBefore = seasonArc;
    const standingsBefore = sortStandings(driverStandings);
    const constructorStandingsBefore = sortStandings(constructorStandings);
    const leaderBefore = standingsBefore[0];
    const finalRoundContenders =
      raceIndex === races.length - 1 ? titleContenders(standingsBefore, maxRacePoints).slice(0, 5) : [];
    const preRaceNarrative =
      finalRoundContenders.length >= 2
        ? renderLastRacePreview({
            race: displayRaceName,
            contenders: finalRoundContenders,
            maxPoints: maxRacePoints,
            constructorsLeader: constructorStandingsBefore[0],
            arc: raceArcBefore,
            rng,
          })
        : "";
    const gapBefore = topGap(driverStandings);
    const previousWinner = history[history.length - 1]?.winner;
    const previousTeamWinner = history[history.length - 1]?.teamWinner;
    const driverStreakBefore = getRecentWinnerStreak(history, "winner");
    const teamStreakBefore = getRecentWinnerStreak(history, "teamWinner");

    // How much of the rating hierarchy survives today's conditions. Rain and
    // safety cars compress the field; the dry lets the best cars stretch out.
    const grip = Math.min(
      conditions.weatherCode === "wet"
        ? GRIP.wet
        : conditions.weatherCode === "mixed"
        ? GRIP.mixed
        : GRIP.dry,
      conditions.safetyCar ? GRIP.safetyCar : GRIP.dry
    );

    const scored = entrants.map((entrant) => {
      const standing = driverStandings.get(entrant.id);
      const teamStanding = constructorStandings.get(entrant.team.name);
      const strategy = chooseStrategy({ entrant, standing, leaderBefore, gapBefore, profile, conditions, rng });
      const pressure =
        leaderBefore?.id === entrant.id && gapBefore > 28
          ? -profile.chaos * (2.5 + rng() * 5)
          : 0;
      const comeback =
        standingsBefore[1]?.id === entrant.id && gapBefore <= 30
          ? 2.5 + profile.overtaking * 4
          : 0;
      const teamTrend = teamMomentum.get(entrant.team.name) || 0;
      const arcScore =
        seasonArcScore({
          arc: raceArcBefore,
          entrant,
          raceIndex,
          raceCount: races.length,
          standingsBefore,
          rng,
        }) * ARC_NUDGE;
      const trackFit =
        ((hashString(`${entrant.team.name}-${originalRaceName}`) % 100) / 100 - 0.5) *
        (profile.power * 7 + profile.tyre * 5 + profile.street * 4);
      const baseRank = entrants.filter((other) => other.base > entrant.base).length + 1;
      const weatherSkill =
        ((hashString(`${entrant.driver.name}-wet`) % 100) / 100 - 0.44) *
        (WET_SKILL_SWING[conditions.weatherCode] ?? WET_SKILL_SWING.dry);
      const tyreManagement =
        ((hashString(`${entrant.driver.name}-tyres`) % 100) / 100 - 0.43) * conditions.degradation * 7;
      const safetyCarSwing = conditions.safetyCar ? (rng() - 0.45) * (profile.chaos * 8 + 4) : 0;
      const volatility =
        RACE_VOLATILITY.base +
        profile.chaos * RACE_VOLATILITY.chaos +
        (conditions.weatherCode === "wet"
          ? RACE_VOLATILITY.wet
          : conditions.weatherCode === "mixed"
          ? RACE_VOLATILITY.mixed
          : 0) +
        (conditions.safetyCar ? RACE_VOLATILITY.safetyCar : 0) +
        raceIndex * RACE_VOLATILITY.drift;
      const randomSwing = (rng() - 0.5) * volatility;
      const reliabilityRisk = clamp(
        0.025 +
          (1 - entrant.team.reliability) * 0.16 +
          profile.chaos * 0.055 +
          (conditions.weatherCode === "wet" ? 0.028 : conditions.weatherCode === "mixed" ? 0.014 : 0) +
          strategy.risk +
          entrant.recentDnfs * 0.012 -
          entrant.driver.rating / 4200,
        0.01,
        0.22
      );
      const dnf = rng() < reliabilityRisk;

      return {
        ...entrant,
        standing,
        teamStanding,
        strategy,
        baseRank,
        score:
          fieldMeanBase +
          (entrant.base - fieldMeanBase) * grip +
          entrant.form * FORM_WEIGHT +
          teamTrend * TEAM_TREND_WEIGHT +
          pressure +
          comeback +
          arcScore +
          trackFit +
          strategy.score +
          weatherSkill +
          tyreManagement +
          safetyCarSwing +
          randomSwing,
        dnf,
      };
    });

    const classifiedBase = scored
      .filter((entry) => !entry.dnf)
      .sort((a, b) => b.score - a.score)
      .map((entry, index) => ({
        ...entry,
        position: index + 1,
        points: scoringSystem.points[index] || 0,
        fastestLap: false,
        status: "FIN",
        performanceRank: index + 1,
      }));

    const fastestLapWinner =
      scoringSystem.fastestLap > 0
        ? classifiedBase
            .filter((entry) => scoringSystem.id !== "2019-2024" || entry.position <= 10)
            .sort((a, b) => b.score - a.score)[0]
        : null;
    const classified = classifiedBase.map((entry) =>
      fastestLapWinner && entry.id === fastestLapWinner.id
        ? { ...entry, fastestLap: true, points: entry.points + scoringSystem.fastestLap }
        : entry
    );

    const dnfs = scored
      .filter((entry) => entry.dnf)
      .sort((a, b) => b.score - a.score)
      .map((entry, index) => ({
        ...entry,
        position: classified.length + index + 1,
        points: 0,
        fastestLap: false,
        status: "DNF",
        performanceRank: classified.length + index + 1,
      }));

    const fullOrder = [...classified, ...dnfs];
    const constructorRaceScores = new Map(grid.map((team) => [team.name, 0]));
    fullOrder.forEach((result) => {
      const standing = driverStandings.get(result.id);
      const constructor = constructorStandings.get(result.team.name);
      const liveEntrant = entrants.find((entrant) => entrant.id === result.id);

      standing.raceScores.push(result.points);
      constructorRaceScores.set(result.team.name, (constructorRaceScores.get(result.team.name) || 0) + result.points);

      if (result.position === 1) {
        standing.wins += 1;
        constructor.wins += 1;
      }
      if (result.position <= 3) {
        standing.podiums += 1;
        constructor.podiums += 1;
      }
      if (result.status === "DNF") {
        standing.dnfs += 1;
        liveEntrant.recentDnfs += 1;
      } else {
        liveEntrant.recentDnfs = 0;
      }

      const formDelta =
        result.status === "DNF"
          ? -1.5
          : result.position === 1
          ? 1.7
          : result.position <= 3
          ? 1.1
          : result.points > 0
          ? 0.45
          : -0.55;
      liveEntrant.form = clamp(liveEntrant.form * 0.72 + formDelta, -4, 4);
      const currentTeamMomentum = teamMomentum.get(result.team.name) || 0;
      teamMomentum.set(result.team.name, clamp(currentTeamMomentum * 0.76 + formDelta / 2, -4, 4));
    });

    constructorRaceScores.forEach((points, teamName) => {
      const constructor = constructorStandings.get(teamName);
      if (constructor) {
        constructor.raceScores.push(points);
      }
    });

    refreshScoredStandings(driverStandings, scoringSystem, races.length);
    refreshScoredStandings(constructorStandings, scoringSystem, races.length);

    const winner = fullOrder[0];
    const podium = fullOrder.slice(0, 3);
    const midfieldHighlights = pickMidfieldHighlights(fullOrder, winner);
    const midfieldHighlight = midfieldHighlights[0];
    const fastestLapResult = fullOrder.find((result) => result.fastestLap);
    const standingsAfter = sortStandings(driverStandings);
    const constructorStandingsAfter = sortStandings(constructorStandings);
    const leaderAfter = standingsAfter[0];
    const gapAfter = topGap(driverStandings);
    const remainingRaces = Math.max(0, races.length - raceIndex - 1);
    const liveTitleContenders =
      remainingRaces > 0 ? titleContenders(standingsAfter, remainingRaces * maxRacePoints).slice(0, 5) : [];
    // The drivers' title is sealed once the leader is out of reach (gap bigger
    // than the points still on the table) or simply after the final round.
    const titleClinched =
      !championAnnounced &&
      !!leaderAfter &&
      (remainingRaces === 0 || gapAfter > remainingRaces * maxRacePoints);
    let championNarrative = "";
    if (titleClinched) {
      championAnnounced = true;
      championNarrative = renderChampionTitle({
        champion: leaderAfter.name,
        team: leaderAfter.team,
        year: seasonYear,
        racesToSpare: remainingRaces,
        points: leaderAfter.points,
        wins: leaderAfter.wins,
        rng,
      });
    }
    const projectedHistory = [...history, { winner: winner.driver.name, teamWinner: winner.team.name }];
    const raceArcAfter = deriveChampionshipArc({
      driverStandings,
      constructorStandings,
      history: projectedHistory,
      raceIndex,
      totalRaces: races.length,
      maxRacePoints,
    });
    seasonArc = raceArcAfter;
    const driverStreak = previousWinner === winner.driver.name ? driverStreakBefore + 1 : 1;
    const teamStreak = previousTeamWinner === winner.team.name ? teamStreakBefore + 1 : 1;

    const scenario = classifyRaceScenario({
      winner,
      podium,
      dnfList: dnfs,
      leaderBefore,
      driverStreak,
    teamStreak,
      gapBefore,
      gapAfter,
      conditions,
      profile,
      previousWinner,
      previousTeamWinner,
    });
    const decisiveMoment = pickDecisiveMoment(scenario, rng);
    const narrative = renderRaceNarrative({
      scenario,
      rng,
      vars: {
        race: displayRaceName,
        winner: winner.driver.name,
        team: winner.team.name,
        second: podium[1]?.driver.name || "",
        third: podium[2]?.driver.name || "",
        leaderAfter: leaderAfter?.name || "",
        gapAfter,
        weather: conditions.weather,
        safetyCar: conditions.safetyCar,
        dnfCount: dnfs.length,
        winnerBaseRank: winner.baseRank,
        winnerPosition: winner.position,
        winnerPoints: winner.points,
        winnerStrategy: winner.strategy.label,
        winnerStrategyCode: winner.strategy.code,
        fastestLapDriver: fastestLapResult?.driver.name || "",
        fastestLapTeam: fastestLapResult?.team.name || "",
        midfieldDriver: midfieldHighlight?.driver || "",
        midfieldTeam: midfieldHighlight?.team || "",
        midfieldPosition: midfieldHighlight?.position || "",
        midfieldPoints: midfieldHighlight?.points || 0,
        midfieldBaseRank: midfieldHighlight?.baseRank || "",
        midfieldGain: midfieldHighlight?.overPerformance || 0,
        midfieldFastestLap: midfieldHighlight?.fastestLap || false,
        midfieldStrategy: midfieldHighlight?.strategy || "",
        midfieldHighlights,
        titleContenders: liveTitleContenders,
        seasonArc: raceArcAfter.type,
        dominantTeam: raceArcAfter.teamName || "",
        round: raceIndex + 1,
        raceCount: races.length,
        scoringSystem: scoringSystem.years,
        decisive: decisiveMoment,
        previousWinner: previousWinner || "",
      },
    });

    history.push({
      winner: winner.driver.name,
      teamWinner: winner.team.name,
      tag: narrative.tag,
    });

    return {
      round: race.round || raceIndex + 1,
      name: displayRaceName,
      originalName: originalRaceName,
      circuit: race.circuit,
      locality: race.locality,
      country: race.country,
      profile,
      conditions,
      narrative,
      championNarrative,
      decisiveMoment,
      midfieldHighlight,
      midfieldHighlights,
      preRaceNarrative,
      finalRoundContenders: finalRoundContenders.map((row) => ({
        id: row.id,
        name: row.name,
        team: row.team,
        points: row.points,
        wins: row.wins,
      })),
      seasonArc: raceArcAfter.type,
      seasonArcLabel: raceArcAfter.label,
      winner: {
        driver: winner.driver.name,
        team: winner.team.name,
        color: winner.team.color,
        helmetColor: winner.driver.helmetColor,
        strategy: winner.strategy.label,
        baseRank: winner.baseRank,
      },
      podium: podium.map((result) => ({
        position: result.position,
        driver: result.driver.name,
        team: result.team.name,
        color: result.team.color,
        helmetColor: result.driver.helmetColor,
        points: result.points,
        fastestLap: result.fastestLap,
      })),
      results: fullOrder.slice(0, 12).map((result) => ({
        position: result.position,
        driver: result.driver.name,
        team: result.team.name,
        helmetColor: result.driver.helmetColor,
        points: result.points,
        fastestLap: result.fastestLap,
        status: result.status,
        strategy: result.strategy.label,
      })),
      top10: fullOrder.slice(0, 10).map((result) => ({
        position: result.position,
        driver: result.driver.name,
        team: result.team.name,
        color: result.team.color,
        helmetColor: result.driver.helmetColor,
        points: result.points,
        fastestLap: result.fastestLap,
        status: result.status,
      })),
      driverStandingsSnapshot: standingsAfter.slice(0, 10).map((row) => ({
        id: row.id,
        name: row.name,
        team: row.team,
        color: row.color,
        helmetColor: row.helmetColor,
        points: row.points,
        wins: row.wins,
        podiums: row.podiums,
      })),
      constructorStandingsSnapshot: constructorStandingsAfter.slice(0, 11).map((row) => ({
        id: row.id,
        name: row.name,
        color: row.color,
        points: row.points,
        wins: row.wins,
        podiums: row.podiums,
      })),
      scenario,
      dnfs: dnfs.map((result) => result.driver.name),
      leaderAfter: leaderAfter?.name,
      gapAfter,
    };
  });

  const finalDrivers = sortStandings(driverStandings);
  const finalConstructors = sortStandings(constructorStandings);
  const stats = {
    uniqueWinners: new Set(raceResults.map((race) => race.winner.driver)).size,
    comebackWins: raceResults.filter((race) => race.winner.baseRank > 6 || race.narrative.tag === "Sorpresa").length,
    totalDnfs: raceResults.reduce((total, race) => total + race.dnfs.length, 0),
    safetyCars: raceResults.filter((race) => race.conditions.safetyCar).length,
    wetRaces: raceResults.filter((race) => race.conditions.weather !== "Seco").length,
  };

  const intro = renderSeasonIntro({
    year: seasonYear,
    teamCount: grid.length,
    driverCount: entrants.length,
    raceCount: raceResults.length,
    rng,
    arcLabel: "",
  });

  return {
    seasonYear,
    intro,
    races: raceResults,
    stats,
    driverStandings: finalDrivers,
    constructorStandings: finalConstructors,
    champion: finalDrivers[0],
    constructorsChampion: finalConstructors[0],
    seasonArc,
    grid,
    scoringSystem: {
      ...scoringSystem,
      description: describeScoringSystem(scoringSystem, races.length),
    },
  };
};
