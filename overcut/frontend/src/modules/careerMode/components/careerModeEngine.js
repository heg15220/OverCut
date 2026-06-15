import { config } from "../../../config/constants";
import { fallbackBootstrap } from "../../overcutRacing/components/fallbackData";
import { applyTeamDecadeRatings } from "../../overcutRacing/components/teamDecadeRatings";
import { SCORING_SYSTEMS } from "../../overcutRacing/components/scoringSystems";
import {
  BATTLE_GAIN_OUTCOMES,
  eventCatalogStats,
  renderBattleEvent,
  renderExtraDynamicEvent,
  renderIncidentEvent,
  renderLeaderEvent,
  renderOvertakeEvent,
  renderPressureManagementEvent,
  renderPlayerSpecificEvent,
  renderRaceRhythmEvent,
  renderRedFlagEvent,
  renderRestartEvent,
  renderStrategyEvent,
  renderVirtualSafetyCarEvent,
  renderWeatherEvent,
} from "./careerRaceEventCatalog";
import { getRaceEraKnowledge, isEraFeatureAllowed, renderEraContextEvent } from "./careerRaceEraKnowledge";
import { applySeasonAging, computeOverall } from "./driverCard";

export const HELMET_COLORS = [
  "#0a2d52", "#123b66", "#1f568b", "#2c6aa3", "#4d7fae",
  "#7b96b7", "#5f7592", "#d8a11d", "#b8840c", "#9b6b00",
  "#80621f", "#6b5b2a", "#8b6b12", "#b38d2c", "#8a5f18",
  "#3b3f48", "#5a606b", "#6b7280", "#4b5563", "#111827",
  "#7f1d1d", "#14532d", "#581c87",
];

export const HELMET_STYLES = ["solid", "gradient", "lines"];

const TEAM_COLORS = [
  "#d0182f", "#ff8700", "#d8a11d", "#00a19c", "#0090ff", "#1e5bc6",
  "#641e9b", "#9c27b0", "#006f62", "#2e7d32", "#8bc34a", "#00bcd4",
  "#3f51b5", "#e91e63", "#795548", "#607d8b", "#b71c1c", "#f06292",
];

const MODERN_POINTS = [25, 18, 15, 12, 10, 8, 6, 4, 2, 1];

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

// Deterministic estimate of a driver's track position at a given race progress
// (0 = lights out, 1 = chequered flag). Used to animate the team-mate's live
// position without RNG, so re-renders stay stable. The curve is gentle early on
// and steepens in the second half, landing exactly on the final position.
export const interpolateRacePosition = (start, final, progress) => {
  const p = clamp(progress, 0, 1);
  const curve = p < 0.5 ? p * 0.72 : 0.36 + (p - 0.5) * 1.28;
  return Math.max(1, Math.round(start + (final - start) * curve));
};

// Legacy/offline fallback: build a flat card from a single rating so the engine
// still runs for profiles created before the card system existed.
const deriveCardFromRating = (rating = 58) => ({
  pace: rating,
  racecraft: rating,
  awareness: rating,
  experience: rating,
});

// Translate a driver-card profile into the knobs the race simulation reads. The
// card is the source of truth: `rating` is the overall, and the legacy
// consistency/aggression knobs are derived from Awareness/Experience.
export const engineInputsFromProfile = (profile = {}) => {
  const card = profile.card || deriveCardFromRating(profile.rating);
  const overall = Number.isFinite(profile.overall) ? profile.overall : computeOverall(card);
  return {
    rating: overall,
    pace: card.pace,
    racecraft: card.racecraft,
    awareness: card.awareness,
    experience: card.experience,
    consistency: clamp(card.awareness * 0.55 + card.experience * 0.45, 35, 95),
    aggression: clamp(70 - (card.awareness - 60) * 0.6, 35, 75),
  };
};

// Rows to render in a race-result table: the top `limit`, plus the player's own
// row pulled out separately when they finished outside it, so the player always
// sees where they classified.
export const raceResultRows = (results, limit = 10) => {
  const rows = results.slice(0, limit);
  const player = results.find((row) => row.isPlayer);
  const playerBelow = player && !rows.some((row) => row.isPlayer) ? player : null;
  return { rows, playerBelow };
};

export const hashString = (value = "") => {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
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

const pickRandom = (items, rng = Math.random) => items[Math.floor(rng() * items.length)];

const sample = (items, count, rng = Math.random) => {
  const pool = [...items];
  for (let i = pool.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, count);
};

export const normalizeColor = (color, fallback = "#0a2d52") => {
  if (!/^#[0-9a-f]{6}$/i.test(color || "")) return fallback;
  const red = parseInt(color.slice(1, 3), 16);
  const green = parseInt(color.slice(3, 5), 16);
  const blue = parseInt(color.slice(5, 7), 16);
  const luminance = (0.2126 * red + 0.7152 * green + 0.0722 * blue) / 255;
  return luminance > 0.68 ? fallback : color;
};

// Build the CSS `background` value for a helmet from its style and two colours.
// Both colours pass through normalizeColor so a bright/invalid pick is muted the
// same way the solid helmet already behaves. Unknown styles render as solid.
export const helmetBackground = (style, colorA, colorB) => {
  const a = normalizeColor(colorA);
  const b = normalizeColor(colorB);
  if (style === "gradient") return `linear-gradient(135deg, ${a}, ${b})`;
  if (style === "lines") return `repeating-linear-gradient(45deg, ${a} 0 6px, ${b} 6px 12px)`;
  return a;
};

const teamColor = (team, index = 0) =>
  normalizeColor(team.color || TEAM_COLORS[(hashString(team.name) + index) % TEAM_COLORS.length], "#0f4c81");

const collectByYear = (buckets = {}, year) => {
  const seen = new Set();
  return Object.values(buckets)
    .flat()
    .filter((item) => item && item.firstYear <= year && item.lastYear >= year)
    .filter((item) => {
      const key = item.name.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
};

export const getSeasonYearsFromRaces = (racesByYear = {}) =>
  Object.entries(racesByYear)
    .filter(([, races]) => Array.isArray(races) && races.length > 0)
    .map(([year]) => Number(year))
    .filter((year) => Number.isFinite(year) && year >= 1950)
    .sort((a, b) => a - b);

export const prepareCareerBootstrap = (data, fallbackMode = false) => {
  const hasBackendPayload =
    data?.decades?.length &&
    data?.teamsByDecade &&
    data?.driversByDecade &&
    data?.racesByYear;
  const source = hasBackendPayload ? data : fallbackBootstrap;
  const seasonYears = (source.seasonYears?.length ? source.seasonYears : getSeasonYearsFromRaces(source.racesByYear))
    .map(Number)
    .filter((year) => Number.isFinite(year))
    .sort((a, b) => a - b);

  return {
    ...source,
    teamsByDecade: applyTeamDecadeRatings(source.teamsByDecade || {}),
    lineupsByYear: source.lineupsByYear || null,
    constructorStandingsByYear: source.constructorStandingsByYear || null,
    seasonYears,
    fallbackMode: fallbackMode || !hasBackendPayload,
  };
};

const constructorStandingForTeam = (bootstrap, year, teamName) => {
  const rows = bootstrap?.constructorStandingsByYear?.[String(year)];
  if (!Array.isArray(rows)) return null;
  return rows.find((row) => row?.team === teamName) || null;
};

const constructorStandingsForYear = (bootstrap, year) => {
  const rows = bootstrap?.constructorStandingsByYear?.[String(year)];
  return Array.isArray(rows) ? rows : [];
};

const scaledRealConstructorPosition = (position, fieldSize) => {
  if (!Number.isFinite(position)) return null;
  if (!Number.isFinite(fieldSize) || fieldSize <= 1) return clamp(position, 1, GRID_TEAMS - 1);
  return clamp(Math.round(((position - 1) / (fieldSize - 1)) * (GRID_TEAMS - 1)) + 1, 1, GRID_TEAMS - 1);
};

const seasonRatingFromStanding = (standing, standings, fallbackRating = 58) => {
  if (!standing || !Number.isFinite(standing.position)) return fallbackRating;
  const fieldSize = Math.max(2, standings.length || GRID_TEAMS);
  const maxPoints = Math.max(...standings.map((row) => (Number.isFinite(row.points) ? row.points : 0)), 0);
  const positionScore = 1 - (standing.position - 1) / (fieldSize - 1);
  const pointsScore = maxPoints > 0 && Number.isFinite(standing.points) ? Math.sqrt(Math.max(0, standing.points) / maxPoints) : 0;
  const seasonScore = clamp(positionScore * 0.72 + pointsScore * 0.28, 0, 1);
  const seasonRating = 46 + seasonScore * 50;
  return clamp(Math.round(seasonRating * 0.76 + fallbackRating * 0.24), 45, 97);
};

// Real grid for a season (team <-> drivers) sourced from the backend
// `lineupsByYear` cache. Returns null when the data is unavailable (offline
// fallback), so callers degrade to the rating-based grid.
export const realTeamsForYear = (bootstrap, year) => {
  const list = bootstrap?.lineupsByYear?.[String(year)];
  if (!Array.isArray(list) || !list.length) return null;
  const standings = constructorStandingsForYear(bootstrap, year);
  return list
    .map((entry) => {
      const standing = constructorStandingForTeam(bootstrap, year, entry.team);
      const historicalRating = Number.isFinite(entry.rating) ? entry.rating : 58;
      const standingPosition = Number.isFinite(entry.standingPosition)
        ? entry.standingPosition
        : Number.isFinite(standing?.position)
        ? standing.position
        : null;
      return {
        id: entry.id || entry.team,
        name: entry.team,
        rating: seasonRatingFromStanding(standing || entry, standings, historicalRating),
        historicalRating,
        races: entry.races || 0,
        realConstructorPoints: Number.isFinite(entry.constructorPoints)
          ? entry.constructorPoints
          : Number.isFinite(entry.points)
          ? entry.points
          : Number.isFinite(standing?.points)
          ? standing.points
          : null,
        realConstructorPosition: standingPosition,
        realConstructorFieldSize: standings.length || null,
        scaledRealConstructorPosition: scaledRealConstructorPosition(standingPosition, standings.length),
        drivers: (entry.drivers || [])
          .filter((driver) => driver?.name)
          .map((driver) => ({
            name: driver.name,
            rating: Number.isFinite(driver.rating) ? driver.rating : 58,
            races: driver.races || 0,
          })),
      };
    })
    .filter((team) => team.name && team.drivers.length);
};

export const fetchCareerBootstrap = async () => {
  try {
    const response = await fetch(`${config.BASE_PATH}/overcutRacing/bootstrap`);
    if (!response.ok) throw new Error("Career bootstrap unavailable");
    return prepareCareerBootstrap(await response.json());
  } catch (error) {
    return prepareCareerBootstrap(fallbackBootstrap, true);
  }
};

export const playableDecades = (bootstrap) =>
  (bootstrap.decades || []).filter((decade) =>
    (bootstrap.seasonYears || []).some((year) => year >= decade.from && year <= decade.to)
  );

export const randomYearInDecade = (bootstrap, decade, rng = Math.random) => {
  const years = (bootstrap.seasonYears || []).filter((year) => year >= decade.from && year <= decade.to);
  return years.length ? pickRandom(years, rng) : decade.from;
};

export const racesForYear = (bootstrap, year) => {
  const races = bootstrap.racesByYear?.[String(year)] || [];
  if (races.length) return races;
  const fallbackYear = getSeasonYearsFromRaces(fallbackBootstrap.racesByYear).pop();
  return fallbackBootstrap.racesByYear[String(fallbackYear)] || [];
};

const scoringForYear = (year) => {
  const exact = SCORING_SYSTEMS.find((system) => {
    const text = String(system.years);
    const years = text.match(/\d{4}/g)?.map(Number) || [];
    if (text.endsWith("-")) return year >= years[0];
    if (years.length === 1) return year === years[0];
    if (years.length >= 2) return year >= years[0] && year <= years[1];
    return false;
  });
  return exact || { years: "2010-", points: MODERN_POINTS, fastestLap: 0 };
};

const teamTier = (rating) => {
  if (rating >= 88) return "top";
  if (rating >= 78) return "medio";
  if (rating >= 68) return "bajo competitivo";
  return "bajo";
};

const GRID_TEAMS = 11; // matches the grid size built by buildSeasonTeams
const SEASON_COMPLETION = 0.85; // not every weekend delivers the expected result

// Where the team is expected to finish in the constructors' table of THIS
// season, derived from its decade-adjusted rating against the real field.
// Result is scaled onto an 11-team grid so the target matches the standings
// the player will actually see.
const expectedConstructorRank = (team, field) => {
  const ranked = field.filter((entry) => Number.isFinite(entry.rating));
  if (ranked.length <= 1) return 1;
  const better = ranked.filter((entry) => entry.rating > team.rating).length;
  return clamp(Math.round((better / (ranked.length - 1)) * (GRID_TEAMS - 1)) + 1, 1, GRID_TEAMS);
};

// Realistic season points for the contracted driver, using the era's scoring
// system. A team expected k-th in the constructors fields its lead car around
// P(2k-1); we average a spread around that finish and project it across the
// real calendar length.
const realisticSeasonPoints = (rank, scoring, raceCount) => {
  const driverFieldSize = GRID_TEAMS * 2;
  const leadFinish = clamp(rank * 2 - 1, 1, driverFieldSize);
  const spread = [-3, -2, -1, 0, 1, 2, 3];
  const avgPerRace =
    spread.reduce(
      (sum, delta) => sum + (scoring.points[clamp(leadFinish + delta, 1, driverFieldSize) - 1] || 0),
      0
    ) / spread.length;
  const expected = avgPerRace * raceCount * SEASON_COMPLETION;
  // Even a backmarker can fish a handful of points across a chaotic season.
  const lowestScoring = scoring.points[scoring.points.length - 1] || 1;
  const floor = rank >= GRID_TEAMS - 1 ? Math.round(lowestScoring * Math.max(1, raceCount * 0.12)) : 0;
  return Math.max(floor, Math.round(expected));
};

const realConstructorPointsForTeam = (team) => {
  const points = team?.realConstructorPoints ?? team?.constructorPoints ?? team?.points;
  return Number.isFinite(points) ? points : null;
};

const realPointsDriverObjective = (team, playerStatus, fallbackEstimate) => {
  const realConstructorPoints = realConstructorPointsForTeam(team);
  if (realConstructorPoints == null) return null;
  if (realConstructorPoints <= 0) return Math.max(1, Math.min(fallbackEstimate, 4));
  const share = playerStatus === "estrella" ? 0.52 : playerStatus === "promesa" ? 0.48 : 0.44;
  return Math.max(1, Math.round(realConstructorPoints * share));
};

export const teammateRatingDuelModifier = ({ entrant, player, teammate, playerRating }) => {
  if (!entrant || !player || !teammate || entrant.team.name !== player.team.name) return 0;
  const teammateRating = teammate.driver?.rating;
  if (!Number.isFinite(playerRating) || !Number.isFinite(teammateRating)) return 0;
  const gap = clamp(playerRating - teammateRating, -35, 35);
  if (entrant.isPlayer) return gap;
  if (entrant.id === teammate.id) return -gap;
  return 0;
};

export const maxOfferRatingForProfile = (profile = {}) => {
  const rating = Number.isFinite(profile.rating) ? profile.rating : profile.overall;
  if (!Number.isFinite(rating)) return 84;
  if (rating < 75) return 78;
  if (rating < 82) return 86;
  return profile.reputation > 75 ? 96 : 92;
};

export const buildContractObjectives = ({ team, field, scoring, raceCount, playerStatus = "rookie" }) => {
  const tier = teamTier(team.rating);
  const rank = expectedConstructorRank(team, field);
  const multiplier = playerStatus === "estrella" ? 1.2 : playerStatus === "promesa" ? 1.08 : 1;
  const realConstructorPoints = realConstructorPointsForTeam(team);
  const estimatedPoints = Math.max(1, Math.round(realisticSeasonPoints(rank, scoring, raceCount) * multiplier));
  const realObjective = realPointsDriverObjective(team, playerStatus, estimatedPoints);
  const basePoints = realObjective != null ? realObjective : estimatedPoints;
  // Ask the team to land around its natural rank (a touch forward), capped so a
  // backmarker is asked to beat at least one rival rather than "reach the top".
  const constructorPosition = clamp(team.scaledRealConstructorPosition || team.realConstructorPosition || rank, 1, GRID_TEAMS - 1);

  return {
    points: basePoints,
    constructorPosition,
    reputationBonus: tier === "medio" ? 10 : tier === "bajo competitivo" ? 8 : 6,
    minimumPoints: Math.max(0, Math.floor(basePoints * 0.45)),
    tier,
    expectedRank: rank,
    realConstructorPoints,
    realConstructorPosition: team.realConstructorPosition || null,
    realConstructorFieldSize: team.realConstructorFieldSize || null,
    objectiveSource: realObjective != null ? "realConstructorPoints" : "estimated",
  };
};

export const generateContracts = ({ bootstrap, year, playerProfile }) => {
  const rng = createRng(`${playerProfile.name}|${year}|contracts|${playerProfile.reputation}`);
  const activeTeams = collectByYear(bootstrap.teamsByDecade, year);
  // Prefer the real grid of the season so offered teams (and their objectives)
  // match who actually raced that year; fall back to the decade pool offline.
  const realTeams = realTeamsForYear(bootstrap, year);
  const fieldSource = realTeams || (activeTeams.length ? activeTeams : Object.values(bootstrap.teamsByDecade || {}).flat());
  // The real competitive field this season drives how realistic each objective is.
  const field = [...fieldSource].sort((a, b) => b.rating - a.rating);
  const scoring = scoringForYear(year);
  const raceCount = racesForYear(bootstrap, year).length || 20;
  const maxOfferRating = maxOfferRatingForProfile(playerProfile);
  const candidates = [...fieldSource]
    .filter((team) => team.rating <= maxOfferRating)
    .sort((a, b) => a.rating - b.rating || a.name.localeCompare(b.name));
  const low = candidates.filter((team) => team.rating < 69);
  const lowerMid = candidates.filter((team) => team.rating >= 69 && team.rating < 76);
  const mid = candidates.filter((team) => team.rating >= 76 && team.rating < 84);
  const pools = [low, lowerMid, mid, candidates];
  const chosen = [];

  pools.forEach((pool) => {
    const available = pool.filter((team) => !chosen.some((picked) => picked.name === team.name));
    if (available.length && chosen.length < 4) chosen.push(pickRandom(available, rng));
  });

  while (chosen.length < 4 && candidates.length) {
    const available = candidates.filter((team) => !chosen.some((picked) => picked.name === team.name));
    if (!available.length) break;
    chosen.push(pickRandom(available, rng));
  }

  return chosen.slice(0, 4).map((team, index) => {
    const coloredTeam = { ...team, color: teamColor(team, index) };
    const objectives = buildContractObjectives({
      team: coloredTeam,
      field,
      scoring,
      raceCount,
      playerStatus: playerProfile.status,
    });
    return {
      id: `${coloredTeam.id || coloredTeam.name}-${year}-${index}`,
      team: coloredTeam,
      duration: 1,
      salary: `${Math.max(1, Math.round((coloredTeam.rating - 52) * 0.28 + rng() * 3))}.${Math.floor(rng() * 9)}M`,
      objectives,
      promise:
        objectives.tier === "medio"
          ? "Puntos regulares y liderar el desarrollo del coche."
          : objectives.tier === "bajo competitivo"
          ? "Aprovechar carreras caoticas y superar al companero."
          : "Aprender, terminar carreras y pescar puntos cuando el caos abra la puerta.",
      promiseEn:
        objectives.tier === "medio"
          ? "Regular points and leading the car's development."
          : objectives.tier === "bajo competitivo"
          ? "Make the most of chaotic races and beat your team-mate."
          : "Learn, finish races and pick up points when chaos opens the door.",
    };
  });
};

const nextSeasonYear = (bootstrap, currentYear) =>
  (bootstrap.seasonYears || []).find((year) => year > currentYear) || currentYear + 1;

const performanceSignal = ({ season, profile }) => {
  const completed = season.completedRaces?.length || 0;
  const total = season.races?.length || 1;
  const progress = clamp(completed / total, 0.05, 1);
  const playerStanding = season.driverStandings.find((row) => row.isPlayer);
  const constructorStanding = season.constructorStandings.find((row) => row.name === season.contract.team.name);
  const battle = teammateBattleSummary(season, profile);
  const objectives = season.contract.objectives || {};
  const expectedPointsNow = Math.max(1, (objectives.points || 1) * progress);
  const pointsRatio = (playerStanding?.points || 0) / expectedPointsNow;
  const constructorTarget = objectives.constructorPosition || GRID_TEAMS;
  const constructorLift = constructorStanding ? constructorTarget - constructorStanding.position : 0;
  const teammateLift = !battle ? 0 : battle.beaten ? 0.2 : battle.tied ? 0 : -0.2;
  const standout =
    pointsRatio >= 1.15 ||
    (playerStanding?.wins || 0) > 0 ||
    (playerStanding?.podiums || 0) >= Math.max(1, Math.floor(completed / 5)) ||
    constructorLift >= 2 ||
    (battle?.beaten && battle.pointsGap >= Math.max(4, completed));
  return {
    completed,
    total,
    progress,
    playerStanding,
    constructorStanding,
    battle,
    pointsRatio,
    constructorLift,
    score: clamp(pointsRatio + constructorLift * 0.08 + teammateLift + (profile.reputation - 45) / 140, 0, 2.2),
    standout,
  };
};

export const sillySeasonMarketWindow = ({ bootstrap, season, profile, alreadySigned = false }) => {
  if (!season || alreadySigned) return null;
  const signal = performanceSignal({ season, profile });
  if (signal.completed < 3 || signal.completed >= signal.total - 1) return null;
  const marketRounds = [
    Math.max(3, Math.floor(signal.total * 0.34)),
    Math.max(4, Math.floor(signal.total * 0.58)),
    Math.max(5, Math.floor(signal.total * 0.76)),
  ];
  if (!marketRounds.includes(signal.completed)) return null;

  const statusBase = profile.status === "estrella" ? 0.42 : profile.status === "promesa" ? 0.26 : 0.12;
  const chance = clamp(statusBase + (signal.score - 0.85) * 0.28 + (signal.standout ? 0.18 : 0), 0.04, 0.78);
  const rng = createRng(`${profile.name}|${season.year}|silly-season|${signal.completed}|${profile.reputation}`);
  if (rng() > chance) return null;

  const nextYear = nextSeasonYear(bootstrap, season.year);
  const realTeams = realTeamsForYear(bootstrap, nextYear);
  const activeTeams = collectByYear(bootstrap.teamsByDecade, nextYear);
  const fieldSource = realTeams || (activeTeams.length ? activeTeams : Object.values(bootstrap.teamsByDecade || {}).flat());
  const field = [...fieldSource].sort((a, b) => b.rating - a.rating);
  const currentRating = season.contract.team.rating || 60;
  const playerPull = profile.reputation + profile.rating * 0.45 + signal.score * 12;
  const ceiling = Math.min(
    maxOfferRatingForProfile(profile),
    clamp(70 + playerPull * 0.36 + (signal.standout ? 8 : 0), currentRating + 3, 96)
  );
  const floor = signal.standout ? currentRating - 4 : currentRating - 10;
  const candidates = field
    .filter((team) => team.name !== season.contract.team.name)
    .filter((team) => team.rating >= floor && team.rating <= ceiling)
    .sort((a, b) => b.rating - a.rating || a.name.localeCompare(b.name));
  if (!candidates.length) return null;

  const offerCount = signal.standout ? 3 : profile.status === "rookie" ? 1 : 2;
  const selected = sample(candidates.slice(0, Math.max(offerCount + 3, 5)), offerCount, rng)
    .sort((a, b) => b.rating - a.rating);
  const scoring = scoringForYear(nextYear);
  const raceCount = racesForYear(bootstrap, nextYear).length || 20;
  const offers = selected.map((team, index) => {
    const coloredTeam = { ...team, color: teamColor(team, index + 3) };
    const objectives = buildContractObjectives({
      team: coloredTeam,
      field,
      scoring,
      raceCount,
      playerStatus: signal.score > 1.2 ? "promesa" : profile.status,
    });
    return {
      id: `pre-${coloredTeam.id || coloredTeam.name}-${nextYear}-${signal.completed}-${index}`,
      kind: "precontract",
      team: coloredTeam,
      duration: 1,
      salary: `${Math.max(1, Math.round((coloredTeam.rating - 50) * 0.34 + signal.score * 1.8 + rng() * 3))}.${Math.floor(rng() * 9)}M`,
      objectives,
      promise:
        signal.standout
          ? "Precontrato condicionado al asiento libre: quieren cerrar tu fichaje antes que el resto del paddock."
          : "Interes temprano del mercado: el equipo reserva una opcion si mantienes el nivel hasta final de año.",
      promiseEn:
        signal.standout
          ? "Pre-contract conditional on the open seat: they want to lock in your signing before the rest of the paddock."
          : "Early market interest: the team reserves an option if you hold your level until the end of the year.",
      marketReason:
        signal.standout
          ? "Rendimiento por encima del valor del coche"
          : profile.status === "estrella"
          ? "Estatus alto y asiento disponible"
          : "Progresion visible durante la temporada",
      marketReasonEn:
        signal.standout
          ? "Performance above the car's value"
          : profile.status === "estrella"
          ? "High status and an available seat"
          : "Visible progression during the season",
      generatedAtRound: signal.completed,
      targetYear: nextYear,
      confidence: Math.round(chance * 100),
    };
  });

  return {
    year: season.year,
    targetYear: nextYear,
    round: signal.completed,
    chance: Math.round(chance * 100),
    signal,
    offers,
  };
};

const lapCountForRace = (raceName, rng) => {
  const name = String(raceName).toLowerCase();
  if (name.includes("monaco")) return 78;
  if (name.includes("belgian") || name.includes("francorchamps")) return 44;
  if (name.includes("italian") || name.includes("monza")) return 53;
  if (name.includes("british")) return 52;
  if (name.includes("singapore")) return 62;
  if (name.includes("brazil") || name.includes("sao paulo")) return 71;
  return 54 + Math.floor(rng() * 16);
};

const raceProfile = (raceName) => {
  const name = String(raceName).toLowerCase();
  const profile = { power: 0.5, street: 0.25, tyre: 0.45, chaos: 0.32, overtaking: 0.48 };
  if (name.includes("monaco") || name.includes("singapore") || name.includes("azerbaijan") || name.includes("las vegas")) {
    profile.street += 0.38;
    profile.chaos += 0.18;
    profile.overtaking -= 0.16;
  }
  if (name.includes("italian") || name.includes("monza") || name.includes("belgian") || name.includes("british")) {
    profile.power += 0.26;
    profile.overtaking += 0.1;
  }
  if (name.includes("hungarian") || name.includes("spanish") || name.includes("dutch") || name.includes("emilia")) {
    profile.tyre += 0.24;
    profile.overtaking -= 0.05;
  }
  if (name.includes("brazil") || name.includes("canadian") || name.includes("australian")) {
    profile.chaos += 0.13;
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

const WET_CONDITIONS = new Set(["lluvia", "intermedios"]);
const isWetCondition = (condition) => WET_CONDITIONS.has(condition);

// Turn the initial weather plus the scheduled switches into an ordered list of
// weather phases the rest of the engine and the UI can read deterministically.
const buildWeatherPhases = (weather, weatherSwitches) => {
  const initial = weather === "lluvia" ? "lluvia" : "seco"; // "mixto" and surprise rain start dry
  const phases = [{ fromLap: 1, condition: initial }];
  [...weatherSwitches]
    .sort((a, b) => a.lap - b.lap)
    .forEach((sw) => phases.push({ fromLap: sw.lap, condition: sw.to }));
  return phases;
};

const firstRainArrivalLap = (phases) => {
  for (let i = 1; i < phases.length; i += 1) {
    if (isWetCondition(phases[i].condition) && !isWetCondition(phases[i - 1].condition)) {
      return phases[i].fromLap;
    }
  }
  return null;
};

const firstDryReturnLap = (phases) => {
  for (let i = 1; i < phases.length; i += 1) {
    if (!isWetCondition(phases[i].condition) && isWetCondition(phases[i - 1].condition)) {
      return phases[i].fromLap;
    }
  }
  return null;
};

const conditionPlan = (profile, lapCount, rng, year) => {
  const era = getRaceEraKnowledge(year);
  const weatherRoll = rng();
  let weather =
    weatherRoll < profile.chaos * 0.16 ? "lluvia" :
    weatherRoll < profile.chaos * 0.34 + profile.tyre * 0.07 ? "mixto" :
    "seco";
  const degradation = clamp(profile.tyre * 0.7 + rng() * 0.32, 0.12, 0.95);
  const weatherSwitches = [];
  if (weather === "mixto") {
    const first = 5 + Math.floor(rng() * Math.max(5, lapCount * 0.35));
    const second = Math.min(lapCount - 5, first + 9 + Math.floor(rng() * Math.max(6, lapCount * 0.32)));
    weatherSwitches.push({ lap: first, to: "intermedios" }, { lap: second, to: rng() < 0.55 ? "seco" : "lluvia" });
  } else if (weather === "lluvia" && rng() < 0.42) {
    weatherSwitches.push({ lap: Math.floor(lapCount * (0.42 + rng() * 0.24)), to: "intermedios" });
  } else if (weather === "seco" && rng() < clamp(profile.chaos * 0.18 + 0.05, 0.05, 0.3)) {
    // Dry race that gets caught out by rain arriving mid-race.
    const arrival = 6 + Math.floor(lapCount * (0.35 + rng() * 0.3));
    weatherSwitches.push({ lap: Math.min(lapCount - 4, arrival), to: rng() < 0.5 ? "intermedios" : "lluvia" });
    if (rng() < 0.5) {
      const back = Math.min(lapCount - 2, arrival + 6 + Math.floor(rng() * 8));
      weatherSwitches.push({ lap: back, to: "seco" });
    }
    weather = "mixto";
  }

  const phases = buildWeatherPhases(weather, weatherSwitches);
  const rainArrivalLap = firstRainArrivalLap(phases);
  const dryReturnLap = firstDryReturnLap(phases);

  const safetyCarBase =
    era.safetyCar === "none" ? 0 :
    era.safetyCar === "rare" ? 0.04 :
    clamp(profile.chaos * 0.32 + (weather !== "seco" ? 0.16 : 0), 0.08, 0.62);
  const safetyCar = safetyCarBase > 0 && rng() < safetyCarBase;
  const scStart = safetyCar ? 6 + Math.floor(rng() * Math.max(8, lapCount - 14)) : null;
  const scEnd = scStart ? Math.min(lapCount - 1, scStart + 3 + Math.floor(rng() * 3)) : null;
  const vsc =
    era.vsc &&
    !safetyCar &&
    rng() < clamp(profile.chaos * 0.18 + (weather !== "seco" ? 0.04 : 0.02), 0.03, 0.24);
  const vscStart = vsc ? 5 + Math.floor(rng() * Math.max(8, lapCount - 12)) : null;
  const vscEnd = vscStart ? Math.min(lapCount - 1, vscStart + 1 + Math.floor(rng() * 2)) : null;
  const redFlag = rng() < clamp(profile.chaos * 0.08 + (weather === "lluvia" ? 0.08 : 0), 0.01, 0.18);
  const redFlagLap = redFlag ? 8 + Math.floor(rng() * Math.max(8, lapCount - 18)) : null;

  return {
    year,
    era,
    weather,
    degradation,
    safetyCar,
    scStart,
    scEnd,
    vsc,
    vscStart,
    vscEnd,
    redFlag,
    redFlagLap,
    weatherSwitches,
    phases,
    rainArrivalLap,
    dryReturnLap,
  };
};

// Live race state at a given lap, derived purely from the plan. Used both to
// keep narration coherent and to drive the on-track animations. It never
// reveals future laps: it only answers "what is true at this lap".
export const raceStateAtLap = (plan, lap) => {
  const phases = plan.phases || buildWeatherPhases(plan.weather, plan.weatherSwitches || []);
  const periods = plan.neutralizations || [];
  let condition = phases[0].condition;
  phases.forEach((phase) => {
    if (lap >= phase.fromLap) condition = phase.condition;
  });
  const activePeriod = periods.find((period) => lap >= period.startLap && lap <= period.endLap);
  const hasPeriodBefore = (type) => periods.some((period) => period.type === type && lap >= period.startLap);
  const greenFlag =
    (plan.scEnd != null && lap === plan.scEnd + 1) ||
    (plan.vscEnd != null && lap === plan.vscEnd + 1) ||
    (plan.redFlagLap != null && lap === plan.redFlagLap + 2) ||
    periods.some((period) => lap === period.endLap + 1);
  const yellowActive = activePeriod?.type === "yellow";
  const yellowHappenedBefore = hasPeriodBefore("yellow");
  const scActive =
    (plan.scStart != null && lap >= plan.scStart && lap <= (plan.scEnd ?? plan.scStart)) ||
    activePeriod?.type === "safetyCar";
  const scHappenedBefore = (plan.scStart != null && lap >= plan.scStart) || hasPeriodBefore("safetyCar");
  const vscActive =
    (plan.vscStart != null && lap >= plan.vscStart && lap <= (plan.vscEnd ?? plan.vscStart)) ||
    activePeriod?.type === "vsc";
  const vscHappenedBefore = (plan.vscStart != null && lap >= plan.vscStart) || hasPeriodBefore("vsc");
  const redFlagActive =
    (plan.redFlagLap != null && lap >= plan.redFlagLap && lap <= plan.redFlagLap + 1) ||
    activePeriod?.type === "redFlag";
  const redFlagHappenedBefore = (plan.redFlagLap != null && lap >= plan.redFlagLap) || hasPeriodBefore("redFlag");
  const rainArrived = plan.rainArrivalLap != null && lap >= plan.rainArrivalLap;
  const rainThreat = plan.rainArrivalLap != null && lap >= plan.rainArrivalLap - 3 && lap < plan.rainArrivalLap;
  const dryReturned = plan.dryReturnLap != null && lap >= plan.dryReturnLap;
  const dryingNow = plan.dryReturnLap != null && lap >= plan.dryReturnLap && lap <= plan.dryReturnLap + 4;
  return {
    year: plan.year,
    era: plan.era,
    condition,
    wet: isWetCondition(condition),
    yellowActive,
    yellowHappenedBefore,
    scActive,
    scHappenedBefore,
    vscActive,
    vscHappenedBefore,
    redFlagActive,
    redFlagHappenedBefore,
    greenFlag,
    rainArrived,
    rainThreat,
    dryReturned,
    dryingNow,
  };
};

// How much rain neutralises the car-performance advantage at full wet. Moderate
// on purpose: the field compresses, it does not invert.
export const CAR_WET_COMPRESSION = 0.45;

// Fraction of the race run on a wet track (0 = fully dry, 1 = fully wet),
// derived from the same weather timeline that drives the narration.
export const wetLevelFromPlan = (plan, lapCount) => {
  if (!lapCount || !plan?.phases?.length) return 0;
  let wetLaps = 0;
  for (let lap = 1; lap <= lapCount; lap += 1) {
    if (raceStateAtLap(plan, lap).wet) wetLaps += 1;
  }
  return clamp(wetLaps / lapCount, 0, 1);
};

// Shrink a team's rating towards the field mean in the wet. A car above the
// mean loses part of its advantage; a car below the mean gains part of it.
// Ordering is preserved (it never overshoots the mean), so it lifts weaker
// teams' chances without turning the result into a lottery.
export const levelledCarRating = (teamRating, meanTeamRating, wetLevel) =>
  teamRating - (teamRating - meanTeamRating) * clamp(wetLevel, 0, 1) * CAR_WET_COMPRESSION;

const buildSeasonTeams = ({ bootstrap, year, contract, rng }) => {
  const active = collectByYear(bootstrap.teamsByDecade, year);
  const source = active.length ? active : Object.values(bootstrap.teamsByDecade || {}).flat();
  const selected = [contract.team];
  const used = new Set([contract.team.name.toLowerCase()]);
  const sorted = [...source]
    .filter((team) => !used.has(team.name.toLowerCase()))
    .sort((a, b) => b.rating - a.rating);
  const top = sorted.slice(0, 4);
  const midfield = sorted.filter((team) => team.rating >= 70 && team.rating < 88);
  const back = sorted.filter((team) => team.rating < 72);
  [...sample(top, 4, rng), ...sample(midfield, 5, rng), ...sample(back, 3, rng), ...sorted].forEach((team) => {
    if (selected.length >= 11) return;
    const key = team.name.toLowerCase();
    if (used.has(key)) return;
    selected.push(team);
    used.add(key);
  });
  return selected.slice(0, 11).map((team, index) => ({ ...team, color: teamColor(team, index) }));
};

const buildSeasonDrivers = ({ bootstrap, year, teams, contract, profile, rng }) => {
  const active = collectByYear(bootstrap.driversByDecade, year);
  const source = active.length ? active : Object.values(bootstrap.driversByDecade || {}).flat();
  const pool = [...source].sort((a, b) => b.rating - a.rating);
  const used = new Set();
  const player = {
    id: "career-player",
    name: profile.name,
    rating: profile.rating,
    helmetColor: profile.helmetColor,
    helmetColor2: profile.helmetColor2,
    helmetStyle: profile.helmetStyle,
    isPlayer: true,
    firstYear: year,
    lastYear: year,
    seasons: profile.seasons + 1,
  };
  const rosters = [];

  teams.forEach((team) => {
    const drivers = [];
    if (team.name === contract.team.name) drivers.push(player);
    const target = team.rating + (team.name === contract.team.name ? 2 : 0);
    const candidates = pool
      .filter((driver) => !used.has(driver.name.toLowerCase()))
      .sort((a, b) => Math.abs(a.rating - target) - Math.abs(b.rating - target));
    while (drivers.length < 2 && candidates.length) {
      const picked = candidates.shift();
      used.add(picked.name.toLowerCase());
      drivers.push({
        ...picked,
        helmetColor: HELMET_COLORS[(hashString(`${picked.name}-${team.name}`) % HELMET_COLORS.length)],
      });
    }
    rosters.push({ ...team, drivers });
  });

  return rosters;
};

const MAX_REAL_TEAMS = 13; // bounds the field for the long privateer tail of early seasons

const driversForDecade = (bootstrap, year) => {
  const decade = (bootstrap.decades || []).find((item) => year >= item.from && year <= item.to);
  const decadeDrivers = decade ? bootstrap.driversByDecade?.[decade.key] : null;
  if (Array.isArray(decadeDrivers) && decadeDrivers.length) return decadeDrivers;
  const active = collectByYear(bootstrap.driversByDecade, year);
  return active.length ? active : Object.values(bootstrap.driversByDecade || {}).flat();
};

const marketDriversForYear = (bootstrap, year) => {
  const byName = new Map();
  const addDriver = (driver) => {
    if (!driver?.name) return;
    const key = driver.name.toLowerCase();
    const current = byName.get(key);
    if (!current || Number(driver.rating || 0) > Number(current.rating || 0)) {
      byName.set(key, driver);
    }
  };

  driversForDecade(bootstrap, year).forEach(addDriver);
  (realTeamsForYear(bootstrap, year) || []).forEach((team) => {
    (team.drivers || []).forEach(addDriver);
  });

  return Array.from(byName.values());
};

const minimumDriverRatingForTeam = (teamRating) => {
  if (teamRating >= 90) return 82;
  if (teamRating >= 84) return 78;
  if (teamRating >= 78) return 72;
  if (teamRating >= 70) return 64;
  return 50;
};

const pickMarketDriver = ({ pool, used, team, rng, teammate = false }) => {
  const target = team.rating + (teammate ? 1 : -1);
  const strictMinimum = minimumDriverRatingForTeam(team.rating);
  const available = pool.filter((driver) => !used.has(driver.name.toLowerCase()));
  const ranked = (minimum) =>
    available
      .filter((driver) => driver.rating >= minimum)
      .sort(
        (a, b) =>
          Math.abs(a.rating - target) - Math.abs(b.rating - target) ||
          b.rating - a.rating ||
          a.name.localeCompare(b.name)
      );
  const candidates = ranked(strictMinimum);
  const relaxed = candidates.length ? candidates : ranked(Math.max(45, strictMinimum - 8));
  const fallback = relaxed.length ? relaxed : available.sort((a, b) => b.rating - a.rating || a.name.localeCompare(b.name));
  if (!fallback.length) return null;
  const shortlist = fallback.slice(0, Math.min(4, fallback.length));
  return pickRandom(shortlist, rng);
};

const chooseRealSeasonTeams = ({ bootstrap, year, contract }) => {
  const realTeams = realTeamsForYear(bootstrap, year);
  if (!realTeams) return null;

  const contractName = contract.team.name;
  const used = new Set();
  const chosen = [];
  const contractTeam = realTeams.find((team) => team.name === contractName);
  if (contractTeam) {
    chosen.push(contractTeam);
    used.add(contractTeam.name.toLowerCase());
  }
  realTeams.forEach((team) => {
    if (chosen.length >= MAX_REAL_TEAMS) return;
    const key = team.name.toLowerCase();
    if (used.has(key)) return;
    chosen.push(team);
    used.add(key);
  });
  if (!contractTeam) chosen.unshift({ ...contract.team, drivers: [] });
  return chosen.slice(0, MAX_REAL_TEAMS);
};

const buildMarketSeasonGrid = ({ bootstrap, year, contract, profile, rng }) => {
  const realTeams = chooseRealSeasonTeams({ bootstrap, year, contract });
  const teams = realTeams || buildSeasonTeams({ bootstrap, year, contract, rng });
  const pool = marketDriversForYear(bootstrap, year).sort((a, b) => b.rating - a.rating || a.name.localeCompare(b.name));
  const used = new Set();
  const player = {
    id: "career-player",
    name: profile.name,
    rating: profile.rating,
    helmetColor: profile.helmetColor,
    helmetColor2: profile.helmetColor2,
    helmetStyle: profile.helmetStyle,
    isPlayer: true,
    firstYear: year,
    lastYear: year,
    seasons: profile.seasons + 1,
  };

  return teams.map((team, index) => {
    const color = teamColor(team, index);
    const drivers = [];
    if (team.name === contract.team.name) drivers.push(player);
    while (drivers.length < 2) {
      const picked = pickMarketDriver({ pool, used, team, rng, teammate: team.name === contract.team.name });
      if (!picked) break;
      used.add(picked.name.toLowerCase());
      drivers.push({
        ...picked,
        helmetColor: HELMET_COLORS[hashString(`${picked.name}-${team.name}-${year}`) % HELMET_COLORS.length],
      });
    }
    return {
      id: team.id || team.name,
      name: team.name,
      rating: team.rating,
      color,
      drivers,
    };
  });
};

const realDriverEntry = (driver, teamName, year) => ({
  name: driver.name,
  rating: driver.rating,
  helmetColor: HELMET_COLORS[hashString(`${driver.name}-${teamName}`) % HELMET_COLORS.length],
  firstYear: year,
  lastYear: year,
});

// Build the historically real grid for a season: the actual teams and the
// drivers who raced for them that year. The player takes one seat of the
// contract team and keeps the real lead driver as team-mate; every other seat
// stays real. Returns null when no real lineup exists for the year.
const buildRealSeasonGrid = ({ bootstrap, year, contract, profile }) => {
  const chosen = chooseRealSeasonTeams({ bootstrap, year, contract });
  if (!chosen) return null;

  const contractName = contract.team.name;

  const player = {
    id: "career-player",
    name: profile.name,
    rating: profile.rating,
    helmetColor: profile.helmetColor,
    helmetColor2: profile.helmetColor2,
    helmetStyle: profile.helmetStyle,
    isPlayer: true,
    firstYear: year,
    lastYear: year,
    seasons: profile.seasons + 1,
  };

  return chosen.slice(0, MAX_REAL_TEAMS).map((team, index) => {
    const color = teamColor(team, index);
    const realDrivers = (team.drivers || []).slice(0, 2);
    let drivers;
    if (team.name === contractName) {
      const teammate = realDrivers[0];
      drivers = teammate ? [player, realDriverEntry(teammate, team.name, year)] : [player];
    } else {
      drivers = realDrivers.map((driver) => realDriverEntry(driver, team.name, year));
    }
    return {
      id: team.id || team.name,
      name: team.name,
      rating: team.rating,
      color,
      drivers,
    };
  });
};

export const createCareerSeason = ({ bootstrap, profile, year, contract }) => {
  const rng = createRng(`${profile.name}|${year}|${contract.team.name}|season-${profile.seasons}`);
  const grid = profile.seasons >= 1
    ? buildMarketSeasonGrid({ bootstrap, year, contract, profile, rng })
    : buildRealSeasonGrid({ bootstrap, year, contract, profile }) ||
    buildSeasonDrivers({
      bootstrap,
      year,
      teams: buildSeasonTeams({ bootstrap, year, contract, rng }),
      contract,
      profile,
      rng,
    });
  const entrants = grid.flatMap((team) =>
    team.drivers.map((driver) => ({
      id: driver.isPlayer ? "career-player" : `${driver.name}-${team.name}`,
      name: driver.name,
      team: team.name,
      color: team.color,
      helmetColor: driver.helmetColor,
      helmetColor2: driver.helmetColor2,
      helmetStyle: driver.helmetStyle,
      points: 0,
      wins: 0,
      podiums: 0,
      dnfs: 0,
      isPlayer: Boolean(driver.isPlayer),
    }))
  );
  return {
    year,
    contract,
    grid,
    races: racesForYear(bootstrap, year).map((race, index) => ({
      ...race,
      round: race.round || index + 1,
      completed: false,
    })),
    scoring: scoringForYear(year),
    driverStandings: entrants.map((row, index) => ({ ...row, position: index + 1 })),
    constructorStandings: grid.map((team, index) => ({
      id: team.id || team.name,
      name: team.name,
      color: team.color,
      points: 0,
      wins: 0,
      podiums: 0,
      position: index + 1,
    })),
    completedRaces: [],
  };
};

const entrantsForSeason = (season) =>
  season.grid.flatMap((team) =>
    team.drivers.map((driver) => ({
      id: driver.isPlayer ? "career-player" : `${driver.name}-${team.name}`,
      driver,
      team,
      isPlayer: Boolean(driver.isPlayer),
      base: driver.rating * 0.55 + team.rating * 0.45,
      reliability: clamp(0.72 + team.rating / 360 + (driver.rating - 65) / 900, 0.68, 0.97),
    }))
  );

const pointsForPosition = (season, position, fastestLap) => {
  const base = season.scoring.points?.[position - 1] ?? 0;
  return base + (fastestLap && season.scoring.fastestLap ? season.scoring.fastestLap : 0);
};

const updateStandings = (season, raceResult) => {
  const driverRows = new Map((season.driverStandings || []).map((row) => [row.id, { ...row }]));
  const teamRows = new Map((season.constructorStandings || []).map((row) => [row.name, { ...row }]));

  raceResult.results.forEach((result) => {
    const driverRow = driverRows.get(result.id) || {
      id: result.id,
      name: result.driver,
      team: result.team,
      color: result.teamColor,
      helmetColor: result.helmetColor,
      helmetColor2: result.helmetColor2,
      helmetStyle: result.helmetStyle,
      points: 0,
      wins: 0,
      podiums: 0,
      dnfs: 0,
      isPlayer: result.isPlayer,
    };
    const teamRow = teamRows.get(result.team) || {
      id: result.team,
      name: result.team,
      color: result.teamColor,
      points: 0,
      wins: 0,
      podiums: 0,
    };
    driverRow.points += result.points;
    teamRow.points += result.points;
    if (result.position === 1) {
      driverRow.wins += 1;
      teamRow.wins += 1;
    }
    if (result.position <= 3) {
      driverRow.podiums += 1;
      teamRow.podiums += 1;
    }
    if (result.status === "DNF") driverRow.dnfs += 1;
    driverRows.set(result.id, driverRow);
    teamRows.set(result.team, teamRow);
  });

  const sortRows = (rows) =>
    [...rows].sort((a, b) =>
      b.points - a.points ||
      b.wins - a.wins ||
      b.podiums - a.podiums ||
      a.name.localeCompare(b.name)
    );

  return {
    driverStandings: sortRows(driverRows.values()).map((row, index) => ({ ...row, position: index + 1 })),
    constructorStandings: sortRows(teamRows.values()).map((row, index) => ({ ...row, position: index + 1 })),
  };
};

const playerEvent = (lap, text, textEn = text, type = "player", extras = {}) => ({
  lap,
  text,
  textEn,
  type,
  important: type !== "neutral",
  ...extras,
});

// How far the narrated position is allowed to drift from the interpolated
// baseline. Keeps event "texture" believable without letting it run away.
const PLAYER_TIMELINE_OFFSET_CAP = 4;

// The lap-by-lap position shown in the narration is anchored to the *real*
// classification: it interpolates from the grid slot to the finishing position
// across race distance, and event deltas only add bounded local texture that
// decays to zero by the chequered flag. The result table is the single source
// of truth, so the narration can no longer drift off and then "teleport" onto
// the final position on the last lap.
const attachPlayerPositionTimeline = ({ events, startPosition, finalPosition, entrantCount, lapCount }) => {
  const start = clamp(startPosition, 1, entrantCount);
  const final = clamp(finalPosition, 1, entrantCount);
  const laps = Math.max(1, lapCount || 1);
  const priority = {
    redflag: 0,
    safetycar: 1,
    vsc: 1,
    yellow: 1,
    green: 2,
    danger: 3,
    player: 4,
    leader: 5,
    rain: 6,
    neutral: 7,
    winner: 9,
  };
  const ordered = [...events].sort(
    (a, b) =>
      a.lap - b.lap ||
      (priority[a.type] ?? 8) - (priority[b.type] ?? 8) ||
      Number(b.important) - Number(a.important)
  );
  let offset = 0;
  return ordered.map((event) => {
    if (event.finalPlayerPosition) {
      offset = 0;
      return { ...event, playerPosition: final };
    }
    // A battle involving the player carries the exact rank it puts them in; anchor
    // the label to it (the rank tracks the interpolation baseline, so no jump).
    if (Number.isFinite(event.playerPositionOverride)) {
      offset = 0;
      return { ...event, playerPosition: clamp(event.playerPositionOverride, 1, entrantCount) };
    }
    if (Number.isFinite(event.positionDelta)) {
      offset = clamp(offset + event.positionDelta, -PLAYER_TIMELINE_OFFSET_CAP, PLAYER_TIMELINE_OFFSET_CAP);
    }
    const progress = clamp(event.lap / laps, 0, 1);
    const baseline = interpolateRacePosition(start, final, progress);
    const damped = Math.round(offset * (1 - progress));
    return {
      ...event,
      playerPosition: clamp(baseline + damped, 1, entrantCount),
    };
  });
};

// Greens are emitted independently by several sources (the global plan and every
// dynamic incident), so they can pile up or land while another neutralisation is
// still running. Consolidate them against the real race state: drop any green on
// a lap still under a safety car, VSC, red or yellow, and keep at most one green
// per lap. The neutralisation timeline (plan) is the single source of truth.
const sanitizeNeutralizationFlags = (events, plan) => {
  const greenLaps = new Set();
  return events.filter((event) => {
    if (event.type !== "green") return true;
    const state = raceStateAtLap(plan, event.lap);
    if (state.scActive || state.vscActive || state.redFlagActive || state.yellowActive) return false;
    if (greenLaps.has(event.lap)) return false;
    greenLaps.add(event.lap);
    return true;
  });
};

const compactRaceEvents = (events, lapCount) => {
  const seen = new Set();
  const perLap = new Map();
  const compacted = [];
  [...events]
    .filter((event) => event?.text && event.lap >= 1 && event.lap <= lapCount)
    .sort((a, b) => a.lap - b.lap || Number(b.important) - Number(a.important))
    .forEach((event) => {
      const key = `${event.lap}|${event.text}`;
      if (seen.has(key)) return;
      seen.add(key);
      const bucket = perLap.get(event.lap) || { important: 0, neutral: 0 };
      if (event.important) {
        if (bucket.important >= 4) return;
        bucket.important += 1;
      } else {
        if (bucket.neutral >= 2) return;
        bucket.neutral += 1;
      }
      perLap.set(event.lap, bucket);
      compacted.push(event);
    });
  return compacted;
};

const rivalNearPosition = ({ order, playerId = "career-player", position, intent = "around" }) => {
  const rivals = order.filter((entry) => entry.id !== playerId);
  if (!rivals.length) return null;
  const targetPosition =
    intent === "attack" ? position - 1 :
    intent === "defend" ? position + 1 :
    position;
  return rivals.reduce((best, rival) => {
    const distance = Math.abs(rival.position - targetPosition);
    const bestDistance = best ? Math.abs(best.position - targetPosition) : Number.POSITIVE_INFINITY;
    return distance < bestDistance ? rival : best;
  }, null);
};

const estimatedPlayerPositionAtLap = ({ lap, lapCount, startPosition, finalPosition, entrantCount, rng }) => {
  const progress = clamp(lap / Math.max(1, lapCount), 0, 1);
  const curve = progress < 0.5 ? progress * 0.72 : 0.36 + progress * 0.64;
  const noise = Math.round((rng() - 0.5) * 3);
  return clamp(Math.round(startPosition + (finalPosition - startPosition) * curve + noise), 1, entrantCount);
};

const isGreenRacingState = (state = {}) =>
  !state.yellowActive && !state.scActive && !state.vscActive && !state.redFlagActive;

const liveRaceOrderAtLap = (results, lap) =>
  results.filter((result) => result.status !== "DNF" || !Number.isFinite(result.dnfLap) || result.dnfLap > lap);

// Estimated running order at a given lap: each still-racing driver's position is
// interpolated from its grid slot towards its final classification (the same
// model the player timeline uses), then ranked. This is the single source of
// truth for the ordinals announced in battle narration, so it stays coherent
// lap to lap without simulating every overtake.
const estimatedRaceOrderAtLap = ({ results, lap, lapCount }) => {
  const progress = clamp(lap / Math.max(1, lapCount), 0, 1);
  return liveRaceOrderAtLap(results, lap)
    .map((result) => ({
      id: result.id,
      driver: result.driver,
      team: result.team,
      isPlayer: result.isPlayer,
      gridPosition: result.gridPosition,
      finalPosition: result.position,
      est: interpolateRacePosition(result.gridPosition, result.position, progress),
    }))
    .sort((a, b) => a.est - b.est || a.finalPosition - b.finalPosition || (a.id < b.id ? -1 : 1))
    .map((entry, index) => ({ ...entry, rank: index + 1, trend: entry.finalPosition - entry.gridPosition }));
};

// One coherent wheel-to-wheel battle between two adjacent cars in the estimated
// order at `lap`. The trailing car attacks the one ahead; the announced ordinal
// is the real position the overtaker moves into. When the player is involved the
// event also carries the position to anchor their on-screen label to.
const buildBattleAtLap = ({ results, lap, lapCount, raceName, year, rng, state }) => {
  const order = estimatedRaceOrderAtLap({ results, lap, lapCount });
  if (order.length < 2) return null;
  const aheadIndex = Math.floor(rng() * (order.length - 1));
  const defender = order[aheadIndex];
  const attacker = order[aheadIndex + 1];
  const climbing = attacker.trend < defender.trend;
  const passChance = climbing ? 0.6 : 0.32;
  const roll = rng();
  const successOutcomes = isEraFeatureAllowed(year, "drs")
    ? ["inside", "outside", "switchback", "drs"]
    : ["inside", "outside", "switchback"];
  const outcome =
    roll < passChance ? pickRandom(successOutcomes, rng) :
    roll < passChance + 0.16 ? "error" :
    roll < passChance + 0.4 ? "defense" :
    roll < passChance + 0.64 ? "sideBySide" :
    "lockup";
  const gain = BATTLE_GAIN_OUTCOMES.includes(outcome);
  // On a completed pass the attacker takes the defender's slot.
  const ordinal = defender.rank;
  const playerInvolved = attacker.isPlayer || defender.isPlayer;
  const base = renderBattleEvent({
    attacker: attacker.driver,
    defender: defender.driver,
    ordinal,
    outcome,
    lap,
    raceName,
    rng,
    state: { ...state, year },
    player: playerInvolved,
  });
  const event = { ...base, category: "battle" };
  if (attacker.isPlayer) {
    event.playerPositionOverride = gain ? defender.rank : attacker.rank;
    if (gain) event.playerOvertakeOrdinal = ordinal; // the ordinal in the text is the player's
  } else if (defender.isPlayer) {
    event.playerPositionOverride = gain ? attacker.rank : defender.rank;
  }
  return event;
};

const positionTextEs = (count) => `${count} posicion${count === 1 ? "" : "es"}`;

const positionTextEn = (count) => `${count} position${count === 1 ? "" : "s"}`;

// English label for an internal condition token, used to keep the weather-switch
// narration fully translated (the Spanish text reuses the token directly).
const conditionNameEn = (condition) =>
  condition === "lluvia" ? "wet" : condition === "intermedios" ? "intermediates" : "dry";

const describeTyre = (plan) => {
  const start = plan.phases[0].condition;
  if (start === "lluvia") return "neumatico de lluvia";
  if (start === "intermedios") return "intermedio";
  return plan.degradation > 0.68 ? "medio-duro" : "medio";
};

const MECHANICAL_FAILURES = [
  { es: "caja de cambios", en: "gearbox" },
  { es: "motor", en: "engine" },
  { es: "frenos", en: "brakes" },
  { es: "embrague", en: "clutch" },
  { es: "bateria", en: "battery", ers: true },
  { es: "unidad de potencia", en: "power unit", ers: true },
  { es: "hidraulica", en: "hydraulics" },
];

// Hybrid-era failures (battery, power unit) only make sense once ERS exists.
const mechanicalFailuresForYear = (year) => {
  const ersAllowed = isEraFeatureAllowed(year, "ers");
  return MECHANICAL_FAILURES.filter((failure) => !failure.ers || ersAllowed);
};

const incidentFlagFor = ({ severity, kind, era, state, rng }) => {
  if (severity >= 0.92) return "redFlag";
  if (severity >= 0.78 && rng() < (state.wet ? 0.38 : 0.24)) return "redFlag";
  if (severity >= 0.62 && era.safetyCar !== "none") return "safetyCar";
  if (severity >= 0.42 && era.vsc && kind !== "driverError") return "vsc";
  return "yellow";
};

const periodLengthForFlag = (flag, rng) => {
  if (flag === "redFlag") return 2 + Math.floor(rng() * 2);
  if (flag === "safetyCar") return 3 + Math.floor(rng() * 3);
  if (flag === "vsc") return 1 + Math.floor(rng() * 2);
  return 1;
};

const buildDynamicRaceIncidents = ({ qualifying, plan, lapCount, profileTrack, era, wetLevel, rng, playerId, reliabilityDnf = new Map() }) => {
  const baseCount = clamp(
    Math.round(profileTrack.chaos * 5 + wetLevel * 7 + (plan.weather !== "seco" ? 2 : 0) + rng() * 3),
    2,
    10
  );
  const available = qualifying.filter((entry) => entry.id !== playerId);
  // Resolve incidents in lap order with a growing set of retired drivers, so a
  // car that has already abandoned can never be picked again as the actor of a
  // later incident, nor be named as a rival still racing after its retirement.
  const laps = [...Array(baseCount)]
    .map(() => 3 + Math.floor(rng() * Math.max(5, lapCount - 7)))
    .sort((a, b) => a - b);
  const retired = new Set();
  const incidents = [];
  for (let index = 0; index < laps.length; index += 1) {
    const lap = laps[index];
    const pool = available.filter((entry) => {
      if (retired.has(entry.id)) return false;
      const reliability = reliabilityDnf.get(entry.id);
      return !(reliability && lap >= reliability.lap);
    });
    if (!pool.length) break;
    const state = raceStateAtLap(plan, lap);
    const actor = pickRandom(pool, rng);
    const rivalPool = pool.filter((entry) => entry.id !== actor.id);
    const rival = rivalPool.length ? pickRandom(rivalPool, rng) : null;
    const rainBoost = state.wet ? 1.85 : state.rainThreat ? 1.28 : 1;
    const mechanicalChance = clamp((1 - actor.reliability) * 0.36 * (era.scenarioWeights?.mechanical || 1), 0.06, 0.42);
    const roll = rng();
    let kind =
      roll < mechanicalChance
        ? "mechanicalDnf"
        : roll < mechanicalChance + 0.18 * rainBoost
        ? "soloCrash"
        : roll < mechanicalChance + 0.36 * rainBoost
        ? "collisionDnf"
        : roll < mechanicalChance + 0.6 * rainBoost
        ? "collisionLoss"
        : "driverError";
    // No rival left on track to collide with: fall back to a single-car version.
    if (!rival && (kind === "collisionDnf" || kind === "collisionLoss")) {
      kind = kind === "collisionDnf" ? "soloCrash" : "driverError";
    }
    const severity =
      kind === "mechanicalDnf"
        ? 0.32 + rng() * 0.38
        : kind === "driverError"
        ? 0.18 + rng() * 0.38 * rainBoost
        : kind === "collisionLoss"
        ? 0.38 + rng() * 0.36 * rainBoost
        : 0.58 + rng() * 0.42 * rainBoost;
    const flag = incidentFlagFor({ severity, kind, era, state, rng });
    const length = periodLengthForFlag(flag, rng);
    const lostPositions =
      kind === "driverError" ? 1 + Math.floor(rng() * (state.wet ? 4 : 3)) :
      kind === "collisionLoss" || kind === "soloCrash" ? 2 + Math.floor(rng() * (state.wet ? 5 : 3)) :
      0;
    const dnf = kind === "mechanicalDnf" || kind === "collisionDnf" || (kind === "soloCrash" && severity > 0.72);
    if (dnf) retired.add(actor.id);
    incidents.push({
      id: `${actor.id}-${lap}-${index}`,
      lap,
      startLap: lap,
      endLap: Math.min(lapCount - 1, lap + length),
      type: flag,
      kind,
      actorId: actor.id,
      actor: actor.driver.name,
      actorTeam: actor.team.name,
      rivalId: rival?.id,
      rival: rival?.driver?.name,
      severity,
      lostPositions,
      dnf,
      mechanical: kind === "mechanicalDnf" ? pickRandom(mechanicalFailuresForYear(plan.year), rng) : null,
      wet: state.wet,
    });
  }
  // Already in lap order: incidents were resolved against a lap-sorted schedule.
  return incidents;
};

const renderDynamicIncidentEvent = ({ incident, playerName, playerNearby }) => {
  const eventType =
    incident.type === "yellow" ? "yellow" :
    incident.type === "safetyCar" ? "safetycar" :
    incident.type === "redFlag" ? "redflag" :
    incident.type;
  const flagEs =
    incident.type === "redFlag" ? "bandera roja" :
    incident.type === "safetyCar" ? "safety car" :
    incident.type === "vsc" ? "VSC" :
    "bandera amarilla";
  const flagEn =
    incident.type === "redFlag" ? "red flag" :
    incident.type === "safetyCar" ? "safety car" :
    incident.type === "vsc" ? "VSC" :
    "yellow flag";
  const playerEs = playerNearby
    ? ` ${playerName} levanta, evita restos y recalcula la carrera desde su posicion.`
    : "";
  const playerEn = playerNearby
    ? ` ${playerName} lifts, avoids debris and recalculates the race from his position.`
    : "";

  if (incident.kind === "mechanicalDnf") {
    return playerEvent(
      incident.lap,
      `${incident.actor} abandona por un problema de ${incident.mechanical.es} en el ${incident.actorTeam}; direccion muestra ${flagEs}.${playerEs}`,
      `${incident.actor} retires with a ${incident.mechanical.en} problem on the ${incident.actorTeam}; race control shows ${flagEn}.${playerEn}`,
      eventType,
      playerNearby && incident.dnf ? { positionDelta: -1 } : {}
    );
  }
  if (incident.kind === "driverError") {
    return playerEvent(
      incident.lap,
      `${incident.actor} comete un error de pilotaje y pierde ${positionTextEs(incident.lostPositions)}; hay ${flagEs} en el sector.${playerEs}`,
      `${incident.actor} makes a driving error and loses ${positionTextEn(incident.lostPositions)}; ${flagEn} in the sector.${playerEn}`,
      eventType
    );
  }
  if (incident.kind === "collisionLoss") {
    return playerEvent(
      incident.lap,
      `${incident.actor} y ${incident.rival} se tocan; ambos siguen, pero ${incident.actor} pierde ${positionTextEs(incident.lostPositions)} y aparece ${flagEs}.${playerEs}`,
      `${incident.actor} and ${incident.rival} collide; both continue, but ${incident.actor} loses ${positionTextEn(incident.lostPositions)} and ${flagEn} is shown.${playerEn}`,
      eventType
    );
  }
  // A soloCrash that is not terminal: a spin/off that only costs positions, so it
  // must NOT read as a retirement (the driver stays in the race).
  if (!incident.dnf) {
    return playerEvent(
      incident.lap,
      `${incident.actor} se va largo y pierde ${positionTextEs(incident.lostPositions)}; hay ${flagEs} en el sector.${playerEs}`,
      `${incident.actor} runs wide and loses ${positionTextEn(incident.lostPositions)}; ${flagEn} in the sector.${playerEn}`,
      eventType
    );
  }
  return playerEvent(
    incident.lap,
    `${incident.actor} ${incident.kind === "soloCrash" ? "se accidenta solo" : `colisiona con ${incident.rival}`} y abandona. Restos en pista: direccion activa ${flagEs}.${playerEs}`,
    `${incident.actor} ${incident.kind === "soloCrash" ? "crashes alone" : `collides with ${incident.rival}`} and retires. Debris on track: race control deploys ${flagEn}.${playerEn}`,
    eventType,
    playerNearby ? { positionDelta: -1 } : {}
  );
};

const renderNeutralizationStrategyEvent = ({ incident, profile, rng }) => {
  if (incident.type === "safetyCar") {
    const stop = rng() < 0.55;
    const delta = stop ? 1 + Math.floor(rng() * 2) : -(1 + Math.floor(rng() * 2));
    return playerEvent(
      incident.endLap,
      stop
        ? `Safety car agrupando toda la parrilla: ${profile.name} para por gomas nuevas, pierde pista ahora pero tendra ataque limpio en la bandera verde.`
        : `Safety car agrupando toda la parrilla: ${profile.name} se queda fuera, gana posiciones en pista y tendra que defender con neumaticos mas usados.`,
      stop
        ? `Safety car bunches the whole field: ${profile.name} pits for fresh tyres, loses track position now but will attack at green flag.`
        : `Safety car bunches the whole field: ${profile.name} stays out, gains track position and will defend on older tyres.`,
      "safetycar",
      { positionDelta: delta }
    );
  }
  if (incident.type === "vsc") {
    const cheapStop = rng() < 0.45;
    return playerEvent(
      incident.endLap,
      cheapStop
        ? `VSC sin agrupar la parrilla: el muro intenta una parada barata para ${profile.name} manteniendo el delta con los rivales.`
        : `VSC sin agrupar la parrilla: ${profile.name} no para porque las distancias se mantienen y perderia la ventana de ataque.`,
      cheapStop
        ? `VSC without bunching the field: the pit wall tries a cheap stop for ${profile.name} while keeping the delta to rivals.`
        : `VSC without bunching the field: ${profile.name} stays out because gaps remain and a stop would lose the attack window.`,
      "vsc",
      cheapStop ? { positionDelta: rng() < 0.5 ? -1 : 0 } : {}
    );
  }
  return null;
};

export const simulateCareerRace = ({ season, raceIndex, profile }) => {
  const race = season.races[raceIndex];
  const rng = createRng(`${profile.name}|${season.year}|${race.name}|${raceIndex}|${profile.rating}`);
  const entrants = entrantsForSeason(season);
  const player = entrants.find((entrant) => entrant.isPlayer);
  // The card is read live, so attribute growth during the season is felt in the
  // very next race (the season grid was frozen at sign-on).
  const inputs = engineInputsFromProfile(profile);
  if (player) {
    player.driver = { ...player.driver, rating: inputs.rating };
    player.base = inputs.rating * 0.55 + player.team.rating * 0.45;
  }
  const teammateEntrant = entrants.find((entrant) => !entrant.isPlayer && player && entrant.team.name === player.team.name);
  const profileTrack = raceProfile(race.name);
  const lapCount = lapCountForRace(race.name, rng);
  const plan = conditionPlan(profileTrack, lapCount, rng, season.year);
  const era = getRaceEraKnowledge(season.year);
  // Wet conditions compress the car-performance spread, so weaker teams get a
  // realistic (not exaggerated) chance to shine. Both values feed the pace model.
  const wetLevel = wetLevelFromPlan(plan, lapCount);
  const meanTeamRating = entrants.reduce((sum, entry) => sum + entry.team.rating, 0) / entrants.length;
  const eventLaps = new Set([
    1,
    2 + Math.floor(rng() * 5),
    Math.floor(lapCount * 0.25),
    Math.floor(lapCount * 0.5),
    Math.floor(lapCount * 0.75),
    lapCount,
  ]);
  if (plan.scStart) eventLaps.add(plan.scStart);
  if (plan.scEnd) eventLaps.add(plan.scEnd);
  if (plan.vscStart) eventLaps.add(plan.vscStart);
  if (plan.vscEnd) eventLaps.add(plan.vscEnd);
  if (plan.redFlagLap) eventLaps.add(plan.redFlagLap);
  plan.weatherSwitches.forEach((item) => eventLaps.add(item.lap));

  const qualifying = entrants
    .map((entrant) => {
      const teammateDuel = teammateRatingDuelModifier({
        entrant,
        player,
        teammate: teammateEntrant,
        playerRating: inputs.rating,
      });
      return {
        ...entrant,
        qualiScore:
          entrant.base +
          teammateDuel * 0.18 +
          (rng() - 0.5) * 10 +
          (profileTrack.street > 0.55 ? entrant.driver.rating * 0.035 : 0) +
          (entrant.isPlayer ? (inputs.pace - inputs.rating) * 0.35 : 0),
      };
    })
    .sort((a, b) => b.qualiScore - a.qualiScore)
    .map((entry, index) => ({ ...entry, gridPosition: index + 1 }));
  const playerGrid = qualifying.find((entry) => entry.isPlayer)?.gridPosition || 20;
  const nearbyRivals = qualifying
    .filter((entry) => !entry.isPlayer)
    .sort((a, b) => Math.abs(a.gridPosition - playerGrid) - Math.abs(b.gridPosition - playerGrid));
  const rivalName = nearbyRivals[0]?.driver.name || qualifying.find((entry) => !entry.isPlayer)?.driver.name || "su rival directo";

  const tyre = describeTyre(plan);
  let playerDelta = 0;
  const events = [
    renderEraContextEvent({ year: season.year, lap: 1, rng }),
    playerEvent(
      1,
      `${profile.name} sale P${playerGrid} con ${tyre}; el muro prioriza aire limpio y cuidar el embrague.`,
      `${profile.name} starts P${playerGrid} on ${tyre}; the pit wall prioritises clean air and clutch protection.`
    ),
  ];

  const startGain = Math.round((rng() - 0.42) * 4 + (inputs.consistency - 50) / 45);
  playerDelta += startGain;
  eventLaps.add(2);
  events.push(
    playerEvent(
      2,
      startGain >= 1
        ? `Gran salida: gana ${startGain} posicion${startGain === 1 ? "" : "es"} sin castigar goma.`
        : startGain < 0
        ? `Salida dificil: pierde ${Math.abs(startGain)} posicion${startGain === -1 ? "" : "es"} y debe estabilizar temperaturas.`
        : "Salida limpia, mantiene posicion y evita contactos en la primera frenada.",
      startGain >= 1
        ? `Great start: gains ${startGain} position${startGain === 1 ? "" : "s"} without hurting the tyres.`
        : startGain < 0
        ? `Difficult launch: loses ${Math.abs(startGain)} position${startGain === -1 ? "" : "s"} and must stabilise temperatures.`
        : "Clean start, keeps position and avoids contact into the first braking zone.",
      "player",
      { positionDelta: -startGain }
    )
  );
  events.push(
    startGain >= 0
      ? renderOvertakeEvent({ driver: profile.name, rival: rivalName, lap: 2, raceName: race.name, rng, player: true, year: season.year })
      : renderOvertakeEvent({ driver: rivalName, rival: profile.name, lap: 2, raceName: race.name, rng, player: false, year: season.year })
  );

  plan.weatherSwitches.forEach((switchItem) => {
    const gain = switchItem.to === "seco" ? Math.round((rng() - 0.45) * 3) : Math.round((rng() - 0.38) * 4);
    playerDelta += gain;
    events.push(
      renderWeatherEvent({
        lap: Math.max(1, switchItem.lap - 2),
        raceName: race.name,
        rng,
        important: true,
        state: {
          ...raceStateAtLap(plan, Math.max(1, switchItem.lap - 2)),
          rainThreat: switchItem.to !== "seco",
          dryingNow: switchItem.to === "seco",
        },
        year: season.year,
      })
    );
    events.push(
      playerEvent(
        Math.max(1, switchItem.lap - 1),
        `${profile.name} entra a boxes para cambiar neumaticos antes del cambio de condiciones.`,
        `${profile.name} pits for a tyre change before the conditions swing.`,
        "player"
      )
    );
    events.push(
      playerEvent(
        switchItem.lap,
        `Cambio de condiciones a ${switchItem.to}. ${profile.name} ${gain >= 0 ? "gana" : "pierde"} ${Math.abs(gain)} posicion${Math.abs(gain) === 1 ? "" : "es"} con la llamada a boxes.`,
        `Conditions switch to ${conditionNameEn(switchItem.to)}. ${profile.name} ${gain >= 0 ? "gains" : "loses"} ${Math.abs(gain)} position${Math.abs(gain) === 1 ? "" : "s"} with the pit call.`,
        "player",
        { positionDelta: -gain }
      )
    );
    events.push(
      renderWeatherEvent({
        lap: switchItem.lap,
        raceName: race.name,
        rng,
        important: true,
        state: raceStateAtLap(plan, switchItem.lap),
        year: season.year,
      })
    );
  });

  if (plan.degradation > 0.66) {
    const lap = Math.floor(lapCount * (0.34 + rng() * 0.2));
    const gain = inputs.consistency > 58 ? 2 : rng() < 0.45 ? 1 : -1;
    playerDelta += gain;
    events.push(
      playerEvent(
        lap,
        `La degradacion es alta. El ritmo de ${profile.name} ${gain >= 0 ? "crece al gestionar mejor el eje trasero" : "cae por graining delantero"}.`,
        `Degradation is high. ${profile.name}'s pace ${gain >= 0 ? "improves by managing the rear axle better" : "drops with front graining"}.`,
        "player",
        { positionDelta: -gain }
      )
    );
    const strategicRivalIndex = Math.min(
      nearbyRivals.length - 1,
      Math.max(0, Math.floor((lap / lapCount) * nearbyRivals.length))
    );
    const strategicRival = nearbyRivals[strategicRivalIndex] || nearbyRivals[0];
    events.push(
      playerEvent(
        lap,
        `${profile.name} entra a boxes a cambiar neumaticos; la vuelta de salida decidira si gana aire limpio.`,
        `${profile.name} pits for tyres; the out-lap will decide whether clean air opens up.`,
        "player"
      )
    );
    events.push(
      renderStrategyEvent({
        driver: profile.name,
        rival: strategicRival?.driver.name || rivalName,
        team: player.team.name,
        lap: lap + 1,
        rng,
        player: true,
        state: raceStateAtLap(plan, lap + 1),
        year: season.year,
      })
    );
  }

  if (plan.scStart) {
    const gain = Math.round((rng() - 0.42) * 5);
    playerDelta += gain;
    events.push(
      playerEvent(
        plan.scStart,
        `Safety car por restos en pista. La relanzada ${gain >= 0 ? "le abre hueco y gana" : "le deja encajonado y pierde"} ${Math.abs(gain)} posicion${Math.abs(gain) === 1 ? "" : "es"}.`,
        `Safety car for debris on track. The restart ${gain >= 0 ? "opens a gap and gains" : "boxes him in and costs"} ${Math.abs(gain)} position${Math.abs(gain) === 1 ? "" : "s"}.`,
        "safetycar",
        { positionDelta: -gain }
      )
    );
    events.push(
      renderRestartEvent({
        driver: profile.name,
        leader: qualifying[0]?.driver.name || "el lider",
        lap: (plan.scEnd ?? plan.scStart) + 1,
        raceName: race.name,
        rng,
        kind: "safetyCar",
        year: season.year,
      })
    );
    events.push(
      playerEvent(
        (plan.scEnd ?? plan.scStart) + 1,
        "Bandera verde: termina el safety car, la parrilla vuelve agrupada y cada defensa cuenta.",
        "Green flag: the safety car ends, the field is bunched up and every defence matters.",
        "green"
      )
    );
  }

  if (plan.vscStart) {
    const gain = Math.round((rng() - 0.48) * 3);
    playerDelta += gain;
    const vscText =
      gain > 0
        ? {
            es: `Fin del VSC: ${profile.name} aprovecha el delta y gana ${gain} posicion${gain === 1 ? "" : "es"}.`,
            en: `VSC ends: ${profile.name} uses the delta and gains ${gain} position${gain === 1 ? "" : "s"}.`,
          }
        : gain < 0
        ? {
            es: `Fin del VSC: ${profile.name} sale frio de neumaticos y pierde ${Math.abs(gain)} posicion${Math.abs(gain) === 1 ? "" : "es"}.`,
            en: `VSC ends: ${profile.name} comes out on cold tyres and loses ${Math.abs(gain)} position${Math.abs(gain) === 1 ? "" : "s"}.`,
          }
        : {
            es: `Fin del VSC: ${profile.name} respeta el delta, mantiene posicion y conserva temperatura para la relanzada.`,
            en: `VSC ends: ${profile.name} respects the delta, holds position and keeps tyre temperature for the restart.`,
          };
    events.push(renderVirtualSafetyCarEvent({ lap: plan.vscStart, rng, player: false }));
    events.push(
      playerEvent(
        plan.vscEnd || plan.vscStart,
        vscText.es,
        vscText.en,
        "player",
        { positionDelta: -gain }
      )
    );
    events.push(
      playerEvent(
        (plan.vscEnd || plan.vscStart) + 1,
        "Bandera verde tras VSC: las distancias se mantienen, pero vuelve el ritmo de carrera.",
        "Green flag after VSC: the gaps remain, but racing speed returns.",
        "green"
      )
    );
  }

  if (plan.redFlagLap) {
    const gain = Math.round((rng() - 0.5) * 4);
    playerDelta += gain;
    events.push(renderRedFlagEvent({ lap: plan.redFlagLap, raceName: race.name, rng }));
    events.push(
      playerEvent(
        plan.redFlagLap + 1,
        `Nueva salida parada: el equipo revisa aleron y frenos, y ${profile.name} ${gain >= 0 ? "sale reforzado" : "pierde inercia"}.`,
        `Standing restart: the team checks wing and brakes, and ${profile.name} ${gain >= 0 ? "comes out stronger" : "loses momentum"}.`,
        "player",
        { positionDelta: -gain }
      )
    );
    events.push(
      playerEvent(
        plan.redFlagLap + 2,
        "Bandera verde tras la roja: direccion relanza la carrera con los coches revisados.",
        "Green flag after the red flag: race control restarts the race with the cars checked.",
        "green"
      )
    );
  }

  const playerMechanicalRisk = clamp(
    ((1 - (player?.reliability || 0.8)) * 0.08 + Math.max(0, 82 - (player?.team?.rating || 70)) / 1800) *
      (era.scenarioWeights?.mechanical || 1),
    0.004,
    0.09
  );
  const accidentRisk = clamp(
    (0.03 + profileTrack.chaos * 0.06 + wetLevel * 0.05 - inputs.awareness / 1800) *
      (era.scenarioWeights?.danger || 1),
    0.01,
    0.26
  );
  const playerAccidentDnf = rng() < accidentRisk * (inputs.aggression > 65 ? 1.25 : 0.8);
  const playerMechanicalDnf = !playerAccidentDnf && rng() < playerMechanicalRisk;
  const playerDnf = playerAccidentDnf || playerMechanicalDnf;
  const playerDnfLap = playerDnf ? 4 + Math.floor(rng() * Math.max(4, lapCount - 8)) : null;
  if (playerDnf) {
    if (playerMechanicalDnf) {
      const failure = pickRandom(mechanicalFailuresForYear(season.year), rng);
      events.push(
        playerEvent(
          playerDnfLap,
          `${profile.name} avisa por radio de un problema de ${failure.es}. El equipo confirma que no puede continuar y abandona la carrera.`,
          `${profile.name} reports a ${failure.en} problem over the radio. The team confirms they cannot continue and retires the car.`,
          "danger"
        )
      );
    } else {
      events.push(renderIncidentEvent({ driver: profile.name, lap: playerDnfLap, raceName: race.name, rng, player: true, severe: true, state: raceStateAtLap(plan, playerDnfLap), year: season.year }));
    }
  }

  // Reliability retirements are decided up front (one retirement timeline), so
  // the incident builder can avoid naming a driver who has already retired and
  // the result table can reuse the very same lap.
  const reliabilityDnf = new Map();
  qualifying.forEach((entrant) => {
    if (entrant.isPlayer) return;
    const risk = clamp(
      (0.025 + (1 - entrant.reliability) * 0.14 + profileTrack.chaos * 0.05 + wetLevel * 0.04) *
        (era.scenarioWeights?.mechanical || 1),
      0.01,
      0.28
    );
    if (rng() < risk) {
      reliabilityDnf.set(entrant.id, {
        lap: 5 + Math.floor(rng() * Math.max(5, lapCount - 10)),
        kind: rng() < 0.58 ? "mechanical" : "incident",
      });
    }
  });

  const dynamicIncidents = buildDynamicRaceIncidents({
    qualifying,
    plan,
    lapCount,
    profileTrack,
    era,
    wetLevel,
    rng,
    playerId: player?.id,
    reliabilityDnf,
  });
  plan.neutralizations = dynamicIncidents.map((incident) => ({
    type: incident.type,
    startLap: incident.startLap,
    endLap: incident.endLap,
  }));
  const gridPositionById = new Map(qualifying.map((entry) => [entry.id, entry.gridPosition]));
  dynamicIncidents.forEach((incident) => {
    eventLaps.add(incident.startLap);
    eventLaps.add(Math.min(lapCount, incident.endLap + 1));
    const actorGrid = gridPositionById.get(incident.actorId) || playerGrid;
    const playerNearby = Math.abs(actorGrid - playerGrid) <= 5;
    const incidentEvent = renderDynamicIncidentEvent({ incident, playerName: profile.name, playerNearby });
    playerDelta += Number.isFinite(incidentEvent.positionDelta) ? -incidentEvent.positionDelta : 0;
    events.push(incidentEvent);
    const strategyEvent = renderNeutralizationStrategyEvent({ incident, profile, rng });
    if (strategyEvent) {
      playerDelta += Number.isFinite(strategyEvent.positionDelta) ? -strategyEvent.positionDelta : 0;
      events.push(strategyEvent);
    }
    if (incident.type !== "yellow") {
      events.push(
        playerEvent(
          Math.min(lapCount, incident.endLap + 1),
          "Bandera verde: direccion libera la carrera y los pilotos vuelven a ritmo de competicion.",
          "Green flag: race control releases the race and the drivers return to racing speed.",
          "green"
        )
      );
    } else {
      events.push(
        playerEvent(
          Math.min(lapCount, incident.endLap + 1),
          "Bandera verde en el sector: se retiran las amarillas y vuelve a estar permitido adelantar.",
          "Green flag in the sector: yellows are withdrawn and overtaking is allowed again.",
          "green"
        )
      );
    }
  });
  const dynamicByActor = new Map();
  dynamicIncidents.forEach((incident) => {
    const previous = dynamicByActor.get(incident.actorId);
    if (!previous || incident.severity > previous.severity) dynamicByActor.set(incident.actorId, incident);
  });
  // Drivers already narrated as retiring by a dynamic incident, so the result
  // table's DNF loop can avoid telling the same retirement a second time.
  const dynamicDnfActors = new Set(
    dynamicIncidents.filter((incident) => incident.dnf).map((incident) => incident.actorId)
  );

  const classified = qualifying
    .map((entrant) => {
      const isPlayer = entrant.isPlayer;
      const dynamicIncident = dynamicByActor.get(entrant.id);
      // Rain widens the random spread and rewards driver skill over the car.
      const randomSwing = (rng() - 0.5) * (8 + profileTrack.chaos * 9 + wetLevel * 8);
      const weatherSkill = ((hashString(`${entrant.driver.name}-rain`) % 100) / 100) * (1 + wetLevel * 6);
      // Car advantage shrinks towards the field mean as the track gets wetter;
      // driver rating keeps its full weight.
      const adjustedTeamRating = levelledCarRating(entrant.team.rating, meanTeamRating, wetLevel);
      const wetBase = entrant.driver.rating * 0.55 + adjustedTeamRating * 0.45;
      const teammateDuel = teammateRatingDuelModifier({
        entrant,
        player,
        teammate: teammateEntrant,
        playerRating: inputs.rating,
      });
      // Reliability retirement was decided up front; a dynamic incident DNF takes
      // precedence and overrides the lap so the timeline stays single-sourced.
      const reliability = reliabilityDnf.get(entrant.id);
      const dnf = isPlayer ? playerDnf : Boolean(dynamicIncident?.dnf) || Boolean(reliability);
      const dnfLap =
        isPlayer && dnf ? playerDnfLap :
        dynamicIncident?.dnf ? dynamicIncident.lap :
        reliability ? reliability.lap :
        null;
      const dnfKind =
        !dnf ? null :
        isPlayer && playerMechanicalDnf ? "mechanical" :
        dynamicIncident?.kind === "mechanicalDnf" ? "mechanical" :
        dynamicIncident ? "incident" :
        reliability ? reliability.kind :
        "incident";
      return {
        ...entrant,
        dnf,
        dnfLap,
        dnfKind,
        raceScore:
          wetBase +
          teammateDuel * 0.32 +
          randomSwing +
          weatherSkill +
          (profileTrack.power - 0.5) * (adjustedTeamRating - 70) * 0.12 +
          (profileTrack.tyre - 0.4) * ((hashString(`${entrant.driver.name}-tyre`) % 12) - 5) +
          (dynamicIncident ? -dynamicIncident.lostPositions * 3.2 - dynamicIncident.severity * 3 : 0) +
          (isPlayer
            ? playerDelta * 2.8 +
              profile.reputation * 0.025 +
              (inputs.pace - inputs.rating) * 0.25 +
              (inputs.racecraft - inputs.rating) * 0.2
            : 0),
      };
    });

  const finishers = classified
    .filter((entry) => !entry.dnf)
    .sort((a, b) => b.raceScore - a.raceScore);
  const dnfs = classified
    .filter((entry) => entry.dnf)
    .sort((a, b) => b.raceScore - a.raceScore);
  const order = [...finishers, ...dnfs].map((entry, index) => ({ ...entry, position: index + 1 }));

  const fastestLap = finishers[Math.floor(rng() * Math.min(8, finishers.length))];
  const results = order.map((entry) => {
    const status = entry.dnf ? "DNF" : "FIN";
    const fastest = fastestLap?.id === entry.id && status === "FIN";
    return {
      id: entry.id,
      driver: entry.driver.name,
      team: entry.team.name,
      teamColor: entry.team.color,
      helmetColor: entry.driver.helmetColor,
      helmetColor2: entry.driver.helmetColor2,
      helmetStyle: entry.driver.helmetStyle,
      isPlayer: entry.isPlayer,
      position: entry.position,
      gridPosition: entry.gridPosition,
      points: status === "FIN" ? pointsForPosition(season, entry.position, fastest) : 0,
      fastestLap: fastest,
      status,
      dnfLap: entry.dnfLap,
      dnfKind: entry.dnfKind,
    };
  });

  const playerResult = results.find((result) => result.isPlayer);
  const winner = results[0];
  const podium = results.slice(0, 3);
  results
    .filter((result) => !result.isPlayer && result.status === "DNF" && Number.isFinite(result.dnfLap))
    // Drivers who retired through a dynamic incident were already narrated there;
    // this loop only covers the remaining (reliability) DNFs, so each retirement
    // is told exactly once.
    .filter((result) => !dynamicDnfActors.has(result.id))
    .sort((a, b) => a.dnfLap - b.dnfLap)
    .forEach((result) => {
      const playerEstimatedPosition = estimatedPlayerPositionAtLap({
        lap: result.dnfLap,
        lapCount,
        startPosition: playerGrid,
        finalPosition: playerResult.position,
        entrantCount: entrants.length,
        rng,
      });
      const gainsPlace = result.gridPosition <= playerEstimatedPosition;
      events.push(
        playerEvent(
          result.dnfLap,
          result.dnfKind === "mechanical"
            ? `${result.driver} abandona por un problema mecanico en el ${result.team}. ${gainsPlace ? `${profile.name} gana una posicion automaticamente.` : "La carrera queda neutralizada localmente."}`
            : `${result.driver} queda fuera de carrera tras un incidente. ${gainsPlace ? `${profile.name} hereda una posicion sin pelearla en pista.` : "Los comisarios preparan banderas en el sector."}`,
          result.dnfKind === "mechanical"
            ? `${result.driver} retires with a mechanical issue on the ${result.team}. ${gainsPlace ? `${profile.name} gains one position automatically.` : "The race is locally neutralised."}`
            : `${result.driver} is out after an incident. ${gainsPlace ? `${profile.name} inherits a position without fighting for it on track.` : "Marshals prepare flags in the sector."}`,
          result.dnfKind === "mechanical" ? "danger" : "neutral",
          gainsPlace ? { positionDelta: -1 } : {}
        )
      );
    });
  // The team-mate shares the player's team. Some real grids field a single seat,
  // so this can be absent; the live duel header simply hides itself then.
  const teammateResult = results.find((result) => !result.isPlayer && result.team === player.team.name);
  const teammate = teammateResult
    ? {
        name: teammateResult.driver,
        helmetColor: teammateResult.helmetColor,
        teamColor: teammateResult.teamColor,
        startingPosition: teammateResult.gridPosition,
        finalPosition: teammateResult.position,
      }
    : null;
  const classifiedRivals = results.filter((result) => !result.isPlayer);
  const getPlayerRaceRival = (lap, intent = "around") => {
    const estimatedPosition = estimatedPlayerPositionAtLap({
      lap,
      lapCount,
      startPosition: playerGrid,
      finalPosition: playerResult.position,
      entrantCount: entrants.length,
      rng,
    });
    return (
      rivalNearPosition({
        order: liveRaceOrderAtLap(results, lap),
        position: estimatedPosition,
        intent,
      }) ||
      rivalNearPosition({
        order: qualifying.map((entry) => ({
          id: entry.id,
          driver: entry.driver.name,
          team: entry.team.name,
          position: entry.gridPosition,
        })),
        position: estimatedPosition,
        intent,
      })
    );
  };
  const neutralCount = clamp(
    Math.round(
      lapCount * 0.55 +
        profileTrack.chaos * 18 +
        profileTrack.overtaking * 8 +
        (plan.weather !== "seco" ? 10 : 3) +
        (plan.safetyCar ? 6 : 0) +
        (plan.redFlag ? 8 : 0) +
        dynamicIncidents.length * 2
    ),
    18,
    42
  );
  sample([...Array(neutralCount)].map((_, index) => index), neutralCount, rng).forEach((_, index) => {
    const lap = 3 + Math.floor(rng() * Math.max(5, lapCount - 6));
    const state = raceStateAtLap(plan, lap);
    const liveRivals = liveRaceOrderAtLap(classifiedRivals, lap);
    const actor = pickRandom(liveRivals, rng) || winner;
    const rival = pickRandom(liveRivals.filter((item) => item.id !== actor.id), rng) || playerResult;
    if ((state.vscActive && index % 3 === 0) || (state.vscHappenedBefore && index % 17 === 0)) {
      events.push(renderVirtualSafetyCarEvent({ lap, rng }));
    } else if (!isGreenRacingState(state)) {
      if (state.yellowActive && index % 3 === 0) {
        events.push(playerEvent(lap, "Bandera amarilla local: se neutraliza el sector y todos levantan hasta pasar el incidente.", "Local yellow flag: the sector is neutralised and everyone lifts until passing the incident.", "yellow"));
      } else if (state.scActive && index % 4 === 0) {
        events.push(playerEvent(lap, "Safety car en pista: la parrilla se agrupa y los muros recalculan la ventana de parada.", "Safety car on track: the field bunches up and pit walls recalculate the stop window.", "safetycar"));
      } else if (state.redFlagActive && index % 4 === 0) {
        events.push(playerEvent(lap, "Bandera roja: la carrera queda detenida mientras se limpian restos y se revisan barreras.", "Red flag: the race is stopped while debris is cleared and barriers are checked.", "redflag"));
      }
    } else if (index % 8 === 0 && podium.length >= 2) {
      events.push(renderLeaderEvent({ leader: podium[0].driver, chaser: podium[1].driver, third: podium[2]?.driver || rival.driver, lap, rng, year: season.year }));
    } else if (index % 8 === 1) {
      const battle = buildBattleAtLap({ results, lap, lapCount, raceName: race.name, year: season.year, rng, state });
      if (battle) events.push(battle);
    } else if (index % 8 === 2) {
      events.push(renderIncidentEvent({ driver: actor.driver, lap, raceName: race.name, rng, severe: rng() < 0.2, state, year: season.year }));
    } else if (index % 8 === 3) {
      events.push(renderStrategyEvent({ driver: actor.driver, rival: rival.driver, team: actor.team, lap, rng, state, year: season.year }));
    } else if (index % 8 === 4) {
      events.push(renderExtraDynamicEvent({ driver: actor.driver, rival: rival.driver, team: actor.team, lap, raceName: race.name, rng, state }));
    } else if (index % 8 === 5) {
      events.push(renderPressureManagementEvent({ driver: actor.driver, rival: rival.driver, team: actor.team, lap, raceName: race.name, rng, state }));
    } else if (index % 8 === 6 || state.wet || state.rainThreat || state.dryingNow) {
      events.push(renderWeatherEvent({ lap, raceName: race.name, rng, important: false, state }));
    } else {
      events.push(renderRaceRhythmEvent({ lap, rng, state }));
    }
  });

  const playerSpecificCount = clamp(
    Math.round(
      lapCount * 0.28 +
        profileTrack.overtaking * 6 +
        profileTrack.chaos * 7 +
        (plan.weather !== "seco" ? 4 : 0) +
        (playerResult.status === "DNF" ? 3 : 0)
    ),
    16,
    34
  );
  sample([...Array(playerSpecificCount)].map((_, index) => index), playerSpecificCount, rng).forEach((_, index) => {
    const lap = 3 + Math.floor(rng() * Math.max(5, lapCount - 7));
    const state = raceStateAtLap(plan, lap);
    if (!isGreenRacingState(state)) return;
    const intent = index % 3 === 0 ? "attack" : index % 3 === 1 ? "defend" : "around";
    const rival = getPlayerRaceRival(lap, intent) || { driver: rivalName };
    events.push(
      renderPlayerSpecificEvent({
        driver: profile.name,
        rival: rival.driver,
        team: player.team.name,
        lap,
        raceName: race.name,
        rng,
        state,
        year: season.year,
      })
    );
  });

  if (playerResult.status !== "DNF" && playerResult.position < playerGrid) {
    const lateAttackRival = getPlayerRaceRival(Math.floor(lapCount * 0.82), "attack") || { driver: rivalName };
    events.push(
      renderOvertakeEvent({
        driver: profile.name,
        rival: lateAttackRival.driver,
        lap: Math.max(3, Math.floor(lapCount * 0.82)),
        raceName: race.name,
        rng,
        player: true,
        year: season.year,
      })
    );
    events.push(
      renderExtraDynamicEvent({
        driver: profile.name,
        rival: lateAttackRival.driver,
        team: player.team.name,
        lap: Math.max(4, Math.floor(lapCount * 0.88)),
        raceName: race.name,
        rng,
        player: true,
        state: raceStateAtLap(plan, Math.max(4, Math.floor(lapCount * 0.88))),
      })
    );
    events.push(
      renderPressureManagementEvent({
        driver: profile.name,
        rival: lateAttackRival.driver,
        team: player.team.name,
        lap: Math.max(5, Math.floor(lapCount * 0.9)),
        raceName: race.name,
        rng,
        player: true,
        state: raceStateAtLap(plan, Math.max(5, Math.floor(lapCount * 0.9))),
      })
    );
  }

  events.push(
    playerEvent(
      lapCount,
      playerResult.status === "DNF"
        ? `${profile.name} no ve la bandera a cuadros. El equipo revisara si el riesgo asumido era necesario.`
        : `${profile.name} termina P${playerResult.position} y suma ${playerResult.points} punto${playerResult.points === 1 ? "" : "s"}.`,
      playerResult.status === "DNF"
        ? `${profile.name} does not reach the chequered flag. The team will review whether the risk was necessary.`
        : `${profile.name} finishes P${playerResult.position} and scores ${playerResult.points} point${playerResult.points === 1 ? "" : "s"}.`,
      playerResult.status === "DNF" ? "danger" : "player",
      { finalPlayerPosition: true }
    )
  );
  events.push(
    playerEvent(
      lapCount,
      `Gana ${winner.driver} para ${winner.team}; podio: ${podium.map((item) => item.driver).join(", ")}.`,
      `${winner.driver} wins for ${winner.team}; podium: ${podium.map((item) => item.driver).join(", ")}.`,
      "winner"
    )
  );

  return {
    race: { ...race, lapCount },
    profile: profileTrack,
    conditions: plan,
    startingPosition: playerGrid,
    events: attachPlayerPositionTimeline({
      events: compactRaceEvents(sanitizeNeutralizationFlags(events, plan), lapCount),
      startPosition: playerGrid,
      finalPosition: playerResult.position,
      entrantCount: entrants.length,
      lapCount,
    }),
    results,
    playerResult,
    winner,
    podium,
    teammate,
    wetLevel,
    eventCatalogStats: eventCatalogStats(),
  };
};

export const completeRace = (season, raceIndex, raceResult) => {
  const nextRaces = season.races.map((race, index) =>
    index === raceIndex ? { ...race, completed: true, result: raceResult } : race
  );
  const completedRaces = [...(season.completedRaces || []), raceResult];
  const standings = updateStandings({ ...season, completedRaces }, raceResult);
  return {
    ...season,
    races: nextRaces,
    completedRaces,
    ...standings,
  };
};

// Head-to-head with the team-mate across the season: the team-mate is the
// benchmark every driver is measured against. `beaten` reflects the final
// championship tally (season points), which is what matters for status.
export const teammateBattleSummary = (season, profile) => {
  if (!season) return null;
  const teamName = season.contract?.team?.name;
  const standings = season.driverStandings || [];
  const playerRow = standings.find((row) => row.isPlayer);
  const teammateRow = standings.find((row) => row.team === teamName && !row.isPlayer);
  if (!playerRow || !teammateRow) return null;

  let raceWins = 0;
  let raceLosses = 0;
  let qualiWins = 0;
  let qualiLosses = 0;
  let racesCompared = 0;
  (season.completedRaces || []).forEach((race) => {
    const results = race.results || [];
    const playerResult = results.find((row) => row.isPlayer);
    const teammateResult = results.find((row) => row.team === teamName && !row.isPlayer);
    if (!playerResult || !teammateResult) return;
    racesCompared += 1;
    if (playerResult.position < teammateResult.position) raceWins += 1;
    else if (playerResult.position > teammateResult.position) raceLosses += 1;
    if (Number.isFinite(playerResult.gridPosition) && Number.isFinite(teammateResult.gridPosition)) {
      if (playerResult.gridPosition < teammateResult.gridPosition) qualiWins += 1;
      else if (playerResult.gridPosition > teammateResult.gridPosition) qualiLosses += 1;
    }
  });

  const playerPoints = playerRow.points || 0;
  const teammatePoints = teammateRow.points || 0;
  const teamRoster = (season.grid || []).find((team) => team.name === teamName);
  const teammateDriver = teamRoster?.drivers.find((driver) => !driver.isPlayer);

  return {
    teammateName: teammateRow.name,
    teammateId: teammateRow.id,
    teammateRating: Number.isFinite(teammateDriver?.rating) ? teammateDriver.rating : null,
    playerPoints,
    teammatePoints,
    pointsGap: playerPoints - teammatePoints,
    raceWins,
    raceLosses,
    qualiWins,
    qualiLosses,
    racesCompared,
    // Ahead on the season tally (points; race head-to-head breaks an exact tie).
    leading: playerPoints > teammatePoints || (playerPoints === teammatePoints && raceWins > raceLosses),
    beaten: playerPoints > teammatePoints || (playerPoints === teammatePoints && raceWins > raceLosses),
    tied: playerPoints === teammatePoints && raceWins === raceLosses,
  };
};

export const evaluateSeason = ({ season, profile }) => {
  const playerStanding = season.driverStandings.find((row) => row.isPlayer);
  const constructorStanding = season.constructorStandings.find((row) => row.name === season.contract.team.name);
  const points = playerStanding?.points || 0;
  const objectives = season.contract.objectives;
  const pointsRatio = objectives.points ? points / objectives.points : 1;
  const constructorMet = constructorStanding && constructorStanding.position <= objectives.constructorPosition;
  const overDelivered = pointsRatio >= 1.25 || (pointsRatio >= 1 && constructorMet);
  const met = pointsRatio >= 1 || (pointsRatio >= 0.82 && constructorMet);
  const failed = points < objectives.minimumPoints && !constructorMet;
  // Beating the team-mate over the season lifts reputation (and thus status);
  // losing the intra-team duel costs it. A tie is neutral.
  const battle = teammateBattleSummary(season, profile);
  const teammateRepDelta = !battle ? 0 : battle.tied ? 0 : battle.beaten ? 6 : -6;
  const reputationDelta = (overDelivered ? objectives.reputationBonus + 6 : met ? objectives.reputationBonus : failed ? -10 : -3) + teammateRepDelta;
  const nextAge = (Number.isFinite(profile.age) ? profile.age : 18) + 1;
  const aged = profile.card
    ? applySeasonAging(profile.card, nextAge)
    : { card: profile.card, overall: Number.isFinite(profile.overall) ? profile.overall : profile.rating };
  // Rating now comes from the driver card (raised per race), so the season review
  // only ages the driver, moves reputation/status, and tallies career stats.
  const nextProfile = {
    ...profile,
    seasons: profile.seasons + 1,
    age: nextAge,
    card: aged.card,
    overall: aged.overall,
    reputation: clamp(profile.reputation + reputationDelta, 0, 100),
    rating: aged.overall,
    status:
      profile.reputation + reputationDelta >= 78 ? "estrella" :
      profile.reputation + reputationDelta >= 55 ? "promesa" :
      "rookie",
    stats: {
      ...profile.stats,
      points: profile.stats.points + points,
      wins: profile.stats.wins + (playerStanding?.wins || 0),
      podiums: profile.stats.podiums + (playerStanding?.podiums || 0),
      titles: profile.stats.titles + (playerStanding?.position === 1 ? 1 : 0),
      teams: Array.from(new Set([...profile.stats.teams, season.contract.team.name])),
    },
  };
  return {
    playerStanding,
    constructorStanding,
    met,
    overDelivered,
    fired: failed && !battle?.beaten,
    reputationDelta,
    champion: playerStanding?.position === 1,
    titleFight: playerStanding?.position <= 3 || (playerStanding?.points || 0) >= (season.driverStandings[0]?.points || 0) * 0.72,
    teammateBattle: battle,
    teammateRepDelta,
    nextProfile,
  };
};

export const retirementSummary = (profile, currentSeason = null) => ({
  name: profile.name,
  seasons: profile.seasons,
  points: profile.stats.points + (currentSeason?.driverStandings?.find((row) => row.isPlayer)?.points || 0),
  teams: new Set([
    ...profile.stats.teams,
    ...(currentSeason?.contract?.team?.name ? [currentSeason.contract.team.name] : []),
  ]).size,
  wins: profile.stats.wins + (currentSeason?.driverStandings?.find((row) => row.isPlayer)?.wins || 0),
  podiums: profile.stats.podiums + (currentSeason?.driverStandings?.find((row) => row.isPlayer)?.podiums || 0),
  titles: profile.stats.titles,
});
