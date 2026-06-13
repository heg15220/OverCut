import { config } from "../../../config/constants";
import { fallbackBootstrap } from "../../overcutRacing/components/fallbackData";
import { applyTeamDecadeRatings } from "../../overcutRacing/components/teamDecadeRatings";
import { SCORING_SYSTEMS } from "../../overcutRacing/components/scoringSystems";
import {
  eventCatalogStats,
  renderExtraDynamicEvent,
  renderIncidentEvent,
  renderLeaderEvent,
  renderOvertakeEvent,
  renderPressureManagementEvent,
  renderPlayerSpecificEvent,
  renderRedFlagEvent,
  renderRestartEvent,
  renderStrategyEvent,
  renderWeatherEvent,
} from "./careerRaceEventCatalog";

export const HELMET_COLORS = [
  "#0a2d52", "#123b66", "#1f568b", "#2c6aa3", "#4d7fae",
  "#7b96b7", "#5f7592", "#d8a11d", "#b8840c", "#9b6b00",
  "#80621f", "#6b5b2a", "#8b6b12", "#b38d2c", "#8a5f18",
  "#3b3f48", "#5a606b", "#6b7280", "#4b5563", "#111827",
  "#7f1d1d", "#14532d", "#581c87",
];

const TEAM_COLORS = [
  "#d0182f", "#ff8700", "#d8a11d", "#00a19c", "#0090ff", "#1e5bc6",
  "#641e9b", "#9c27b0", "#006f62", "#2e7d32", "#8bc34a", "#00bcd4",
  "#3f51b5", "#e91e63", "#795548", "#607d8b", "#b71c1c", "#f06292",
];

const MODERN_POINTS = [25, 18, 15, 12, 10, 8, 6, 4, 2, 1];

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

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
    seasonYears,
    fallbackMode: fallbackMode || !hasBackendPayload,
  };
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

const contractObjectives = (team, playerStatus, rng) => {
  const tier = teamTier(team.rating);
  const basePoints =
    tier === "medio" ? 20 + Math.round((team.rating - 76) * 2.5) :
    tier === "bajo competitivo" ? 7 + Math.round((team.rating - 67) * 1.3) :
    2 + Math.round(rng() * 5);
  const constructorTarget =
    tier === "medio" ? 6 :
    tier === "bajo competitivo" ? 8 :
    10;
  const multiplier = playerStatus === "estrella" ? 1.25 : playerStatus === "promesa" ? 1.1 : 1;

  return {
    points: Math.max(1, Math.round(basePoints * multiplier)),
    constructorPosition: constructorTarget,
    reputationBonus: tier === "medio" ? 10 : tier === "bajo competitivo" ? 8 : 6,
    minimumPoints: Math.max(0, Math.floor(basePoints * 0.45)),
    tier,
  };
};

export const generateContracts = ({ bootstrap, year, playerProfile }) => {
  const rng = createRng(`${playerProfile.name}|${year}|contracts|${playerProfile.reputation}`);
  const activeTeams = collectByYear(bootstrap.teamsByDecade, year);
  const candidates = (activeTeams.length ? activeTeams : Object.values(bootstrap.teamsByDecade || {}).flat())
    .filter((team) => team.rating < (playerProfile.reputation > 75 ? 92 : 84))
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
    const objectives = contractObjectives(coloredTeam, playerProfile.status, rng);
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
    };
  });
};

const lapCountForRace = (raceName, rng) => {
  const name = String(raceName).toLowerCase();
  if (name.includes("monaco")) return 78;
  if (name.includes("belgian") || name.includes("spa")) return 44;
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

const conditionPlan = (profile, lapCount, rng) => {
  const weatherRoll = rng();
  const weather =
    weatherRoll < profile.chaos * 0.16 ? "lluvia" :
    weatherRoll < profile.chaos * 0.34 + profile.tyre * 0.07 ? "mixto" :
    "seco";
  const degradation = clamp(profile.tyre * 0.7 + rng() * 0.32, 0.12, 0.95);
  const safetyCar = rng() < clamp(profile.chaos * 0.32 + (weather !== "seco" ? 0.16 : 0), 0.08, 0.62);
  const redFlag = rng() < clamp(profile.chaos * 0.08 + (weather === "lluvia" ? 0.08 : 0), 0.01, 0.18);
  const weatherSwitches = [];
  if (weather === "mixto") {
    const first = 5 + Math.floor(rng() * Math.max(5, lapCount * 0.35));
    const second = Math.min(lapCount - 5, first + 9 + Math.floor(rng() * Math.max(6, lapCount * 0.32)));
    weatherSwitches.push({ lap: first, to: "intermedios" }, { lap: second, to: rng() < 0.55 ? "seco" : "lluvia" });
  } else if (weather === "lluvia" && rng() < 0.42) {
    weatherSwitches.push({ lap: Math.floor(lapCount * (0.42 + rng() * 0.24)), to: "intermedios" });
  }
  return {
    weather,
    degradation,
    safetyCar,
    safetyCarLap: safetyCar ? 6 + Math.floor(rng() * Math.max(8, lapCount - 14)) : null,
    redFlag,
    redFlagLap: redFlag ? 8 + Math.floor(rng() * Math.max(8, lapCount - 18)) : null,
    weatherSwitches,
  };
};

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

export const createCareerSeason = ({ bootstrap, profile, year, contract }) => {
  const rng = createRng(`${profile.name}|${year}|${contract.team.name}|season-${profile.seasons}`);
  const teams = buildSeasonTeams({ bootstrap, year, contract, rng });
  const grid = buildSeasonDrivers({ bootstrap, year, teams, contract, profile, rng });
  const entrants = grid.flatMap((team) =>
    team.drivers.map((driver) => ({
      id: driver.isPlayer ? "career-player" : `${driver.name}-${team.name}`,
      name: driver.name,
      team: team.name,
      color: team.color,
      helmetColor: driver.helmetColor,
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

const normalEvent = (lap, text, textEn = text) => ({ lap, text, textEn, type: "neutral", important: false });

const attachPlayerPositionTimeline = ({ events, startPosition, finalPosition, entrantCount }) => {
  let currentPosition = clamp(startPosition, 1, entrantCount);
  const ordered = [...events].sort((a, b) => a.lap - b.lap || Number(b.important) - Number(a.important));
  return ordered.map((event) => {
    if (event.finalPlayerPosition) {
      currentPosition = clamp(finalPosition, 1, entrantCount);
    } else if (Number.isFinite(event.positionDelta)) {
      currentPosition = clamp(currentPosition + event.positionDelta, 1, entrantCount);
    }
    return {
      ...event,
      playerPosition: currentPosition,
    };
  });
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

const describeTyre = (weather, plan) => {
  if (weather === "lluvia") return "neumatico de lluvia";
  if (weather === "mixto" || plan.weatherSwitches.length) return "intermedio";
  return plan.degradation > 0.68 ? "medio-duro" : "medio";
};

export const simulateCareerRace = ({ season, raceIndex, profile }) => {
  const race = season.races[raceIndex];
  const rng = createRng(`${profile.name}|${season.year}|${race.name}|${raceIndex}|${profile.rating}`);
  const entrants = entrantsForSeason(season);
  const player = entrants.find((entrant) => entrant.isPlayer);
  const profileTrack = raceProfile(race.name);
  const lapCount = lapCountForRace(race.name, rng);
  const plan = conditionPlan(profileTrack, lapCount, rng);
  const eventLaps = new Set([
    1,
    2 + Math.floor(rng() * 5),
    Math.floor(lapCount * 0.25),
    Math.floor(lapCount * 0.5),
    Math.floor(lapCount * 0.75),
    lapCount,
  ]);
  if (plan.safetyCarLap) eventLaps.add(plan.safetyCarLap);
  if (plan.redFlagLap) eventLaps.add(plan.redFlagLap);
  plan.weatherSwitches.forEach((item) => eventLaps.add(item.lap));

  const qualifying = entrants
    .map((entrant) => ({
      ...entrant,
      qualiScore:
        entrant.base +
        (rng() - 0.5) * 10 +
        (profileTrack.street > 0.55 ? entrant.driver.rating * 0.035 : 0),
    }))
    .sort((a, b) => b.qualiScore - a.qualiScore)
    .map((entry, index) => ({ ...entry, gridPosition: index + 1 }));
  const playerGrid = qualifying.find((entry) => entry.isPlayer)?.gridPosition || 20;
  const nearbyRivals = qualifying
    .filter((entry) => !entry.isPlayer)
    .sort((a, b) => Math.abs(a.gridPosition - playerGrid) - Math.abs(b.gridPosition - playerGrid));
  const rivalName = nearbyRivals[0]?.driver.name || qualifying.find((entry) => !entry.isPlayer)?.driver.name || "su rival directo";

  const tyre = describeTyre(plan.weather, plan);
  let playerDelta = 0;
  const events = [
    playerEvent(
      1,
      `${profile.name} sale P${playerGrid} con ${tyre}; el muro prioriza aire limpio y cuidar el embrague.`,
      `${profile.name} starts P${playerGrid} on ${tyre}; the pit wall prioritises clean air and clutch protection.`
    ),
  ];

  const startGain = Math.round((rng() - 0.42) * 4 + (profile.consistency - 50) / 45);
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
      ? renderOvertakeEvent({ driver: profile.name, rival: rivalName, lap: 2, raceName: race.name, rng, player: true })
      : renderOvertakeEvent({ driver: rivalName, rival: profile.name, lap: 2, raceName: race.name, rng, player: false })
  );

  plan.weatherSwitches.forEach((switchItem) => {
    const gain = switchItem.to === "seco" ? Math.round((rng() - 0.45) * 3) : Math.round((rng() - 0.38) * 4);
    playerDelta += gain;
    events.push(
      playerEvent(
        switchItem.lap,
        `Cambio de condiciones a ${switchItem.to}. ${profile.name} ${gain >= 0 ? "gana" : "pierde"} ${Math.abs(gain)} posicion${Math.abs(gain) === 1 ? "" : "es"} con la llamada a boxes.`,
        `Conditions switch to ${switchItem.to}. ${profile.name} ${gain >= 0 ? "gains" : "loses"} ${Math.abs(gain)} position${Math.abs(gain) === 1 ? "" : "s"} with the pit call.`,
        "player",
        { positionDelta: -gain }
      )
    );
    events.push(renderWeatherEvent({ lap: switchItem.lap, raceName: race.name, rng, important: true }));
  });

  if (plan.degradation > 0.66) {
    const lap = Math.floor(lapCount * (0.34 + rng() * 0.2));
    const gain = profile.consistency > 58 ? 2 : rng() < 0.45 ? 1 : -1;
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
      renderStrategyEvent({
        driver: profile.name,
        rival: strategicRival?.driver.name || rivalName,
        team: player.team.name,
        lap: lap + 1,
        rng,
        player: true,
      })
    );
  }

  if (plan.safetyCarLap) {
    const gain = Math.round((rng() - 0.42) * 5);
    playerDelta += gain;
    events.push(
      playerEvent(
        plan.safetyCarLap,
        `Safety car por restos en pista. La relanzada ${gain >= 0 ? "le abre hueco y gana" : "le deja encajonado y pierde"} ${Math.abs(gain)} posicion${Math.abs(gain) === 1 ? "" : "es"}.`,
        `Safety car for debris on track. The restart ${gain >= 0 ? "opens a gap and gains" : "boxes him in and costs"} ${Math.abs(gain)} position${Math.abs(gain) === 1 ? "" : "s"}.`,
        "player",
        { positionDelta: -gain }
      )
    );
    events.push(renderRestartEvent({ driver: profile.name, leader: qualifying[0]?.driver.name || "el lider", lap: plan.safetyCarLap + 1, raceName: race.name, rng }));
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
  }

  const accidentRisk = clamp(0.03 + profileTrack.chaos * 0.06 + (plan.weather !== "seco" ? 0.04 : 0) - profile.consistency / 1800, 0.01, 0.18);
  const playerDnf = rng() < accidentRisk * (profile.aggression > 65 ? 1.25 : 0.8);
  if (playerDnf) {
    const lap = 4 + Math.floor(rng() * Math.max(4, lapCount - 8));
    events.push(renderIncidentEvent({ driver: profile.name, lap, raceName: race.name, rng, player: true, severe: true }));
  }

  const classified = qualifying
    .map((entrant) => {
      const isPlayer = entrant.isPlayer;
      const randomSwing =
        (rng() - 0.5) *
        (8 + profileTrack.chaos * 9 + (plan.weather === "lluvia" ? 8 : plan.weather === "mixto" ? 5 : 0));
      const weatherSkill =
        (hashString(`${entrant.driver.name}-rain`) % 100) / 100 * (plan.weather === "lluvia" ? 7 : plan.weather === "mixto" ? 4 : 1);
      const dnf =
        isPlayer
          ? playerDnf
          : rng() < clamp(0.025 + (1 - entrant.reliability) * 0.14 + profileTrack.chaos * 0.05, 0.01, 0.2);
      return {
        ...entrant,
        dnf,
        raceScore:
          entrant.base +
          randomSwing +
          weatherSkill +
          (profileTrack.power - 0.5) * (entrant.team.rating - 70) * 0.12 +
          (profileTrack.tyre - 0.4) * ((hashString(`${entrant.driver.name}-tyre`) % 12) - 5) +
          (isPlayer ? playerDelta * 2.8 + profile.reputation * 0.025 : 0),
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
      isPlayer: entry.isPlayer,
      position: entry.position,
      gridPosition: entry.gridPosition,
      points: status === "FIN" ? pointsForPosition(season, entry.position, fastest) : 0,
      fastestLap: fastest,
      status,
    };
  });

  const playerResult = results.find((result) => result.isPlayer);
  const winner = results[0];
  const podium = results.slice(0, 3);
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
        order: results,
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
        (plan.redFlag ? 8 : 0)
    ),
    28,
    72
  );
  sample([...Array(neutralCount)].map((_, index) => index), neutralCount, rng).forEach((_, index) => {
    const lap = 3 + Math.floor(rng() * Math.max(5, lapCount - 6));
    const actor = pickRandom(classifiedRivals, rng) || winner;
    const rival = pickRandom(classifiedRivals.filter((item) => item.id !== actor.id), rng) || playerResult;
    if (index % 7 === 0 && podium.length >= 2) {
      events.push(renderLeaderEvent({ leader: podium[0].driver, chaser: podium[1].driver, third: podium[2]?.driver || rival.driver, lap, rng }));
    } else if (index % 7 === 1) {
      events.push(renderOvertakeEvent({ driver: actor.driver, rival: rival.driver, lap, raceName: race.name, rng, player: false }));
    } else if (index % 7 === 2) {
      events.push(renderIncidentEvent({ driver: actor.driver, lap, raceName: race.name, rng, severe: rng() < 0.2 }));
    } else if (index % 7 === 3) {
      events.push(renderStrategyEvent({ driver: actor.driver, rival: rival.driver, team: actor.team, lap, rng }));
    } else if (index % 7 === 4) {
      events.push(renderExtraDynamicEvent({ driver: actor.driver, rival: rival.driver, team: actor.team, lap, raceName: race.name, rng }));
    } else if (index % 7 === 5) {
      events.push(renderPressureManagementEvent({ driver: actor.driver, rival: rival.driver, team: actor.team, lap, raceName: race.name, rng }));
    } else {
      events.push(renderWeatherEvent({ lap, raceName: race.name, rng, important: false }));
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
      events,
      startPosition: playerGrid,
      finalPosition: playerResult.position,
      entrantCount: entrants.length,
    }),
    results,
    playerResult,
    winner,
    podium,
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
  const reputationDelta = overDelivered ? objectives.reputationBonus + 6 : met ? objectives.reputationBonus : failed ? -10 : -3;
  const ratingDelta = overDelivered ? 3 : met ? 2 : failed ? -1 : 0;
  const nextProfile = {
    ...profile,
    seasons: profile.seasons + 1,
    reputation: clamp(profile.reputation + reputationDelta, 0, 100),
    rating: clamp(profile.rating + ratingDelta, 45, 99),
    consistency: clamp(profile.consistency + (met ? 2 : failed ? -1 : 0), 35, 92),
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
    fired: failed,
    reputationDelta,
    ratingDelta,
    champion: playerStanding?.position === 1,
    titleFight: playerStanding?.position <= 3 || (playerStanding?.points || 0) >= (season.driverStandings[0]?.points || 0) * 0.72,
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
