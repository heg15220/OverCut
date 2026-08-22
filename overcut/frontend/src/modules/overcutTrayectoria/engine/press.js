/**
 * What the paddock says about you, and how much your own garage loves you.
 *
 * Two related systems:
 *
 *   headlines  the season told back to the player in someone else's words. They
 *              read the same numbers the summary screen shows, but they judge
 *              them - against the car, against the team-mate, against what you
 *              promised in the winter.
 *
 *   idolatry   standing inside your own team, 0..100. Built by years, wins and
 *              overperformance; spent by bad seasons and broken trust. It is not
 *              decoration: a beloved driver survives a season that would end
 *              somebody else's contract, which is the whole reason it exists.
 */

import { clamp } from "./rng.js";

export const IDOLATRY_LEVELS = [
  { at: 0, key: "unknown" },
  { at: 25, key: "accepted" },
  { at: 45, key: "trusted" },
  { at: 65, key: "leader" },
  { at: 82, key: "idol" },
  { at: 94, key: "legend" },
];

export const idolatryLevel = (value) => {
  let level = IDOLATRY_LEVELS[0];
  IDOLATRY_LEVELS.forEach((entry) => {
    if (value >= entry.at) level = entry;
  });
  return level.key;
};

/**
 * One season's movement in standing at the current team.
 *
 * Deliberately asymmetric: love is slow and leaving is fast. A driver earns
 * idolatry over years and can lose most of it in one winter of public rows.
 */
export const seasonIdolatry = ({ current, stats, objectiveMet, trustDelta, yearsAtTeam }) => {
  if (!stats) return current;

  const performance = clamp(stats.overperformance * 2.4, -14, 16);
  const winBonus = stats.wins * 3.1 + stats.podiums * 0.9;
  const titleBonus = stats.champion ? 14 : 0;
  const loyalty = clamp(yearsAtTeam * 1.6, 0, 8);
  const objectiveSwing = objectiveMet ? 4 : -7;
  const trust = trustDelta * 0.55;

  const gain = performance + winBonus + titleBonus + loyalty + objectiveSwing + trust;
  // Getting there is harder the higher you already are; falling is not.
  const damped = gain > 0 ? gain * (1 - current / 140) : gain;
  return clamp(current + damped, 0, 100);
};

/** Leaving a team costs you the standing you built there. */
export const resetIdolatryOnMove = (current) => clamp(current * 0.28, 0, 40);

// ------------------------------------------------------------------ headlines

const HEADLINES = {
  champion: {
    es: (s) => [
      `${s.driver} campeón del mundo ${s.year}`,
      `El ${s.team} número 1: ${s.driver} lo firma con ${s.points} puntos`,
      `De ${s.wins} victorias a la corona: ${s.driver} ya está en la historia`,
    ],
    en: (s) => [
      `${s.driver} is the ${s.year} world champion`,
      `Number 1 on the ${s.team}: ${s.driver} seals it with ${s.points} points`,
      `${s.wins} wins and a crown: ${s.driver} enters the history books`,
    ],
  },
  runnerUp: {
    es: (s) => [
      `Subcampeón: a ${s.driver} le faltó una carrera`,
      `${s.driver} pelea hasta el final y se queda a las puertas`,
    ],
    en: (s) => [
      `Runner-up: ${s.driver} was one race short`,
      `${s.driver} fights to the end and falls just short`,
    ],
  },
  overperformed: {
    es: (s) => [
      `${s.driver} saca del ${s.team} más de lo que tiene`,
      `El ${s.carRank}º coche de la parrilla, ${s.position}º en el mundial: nadie entiende cómo`,
      `Todo el paddock habla de lo que está haciendo ${s.driver}`,
    ],
    en: (s) => [
      `${s.driver} drags more out of the ${s.team} than it has`,
      `The ${s.carRank}th best car, ${s.position}th in the championship: nobody can explain it`,
      `The whole paddock is talking about what ${s.driver} is doing`,
    ],
  },
  underperformed: {
    es: (s) => [
      `Preguntas incómodas en ${s.team}: el coche daba para más`,
      `${s.driver} no encuentra la vuelta y el equipo empieza a mirar fuera`,
    ],
    en: (s) => [
      `Awkward questions at ${s.team}: that car was worth more`,
      `${s.driver} cannot find the lap and the team is starting to look elsewhere`,
    ],
  },
  firstWin: {
    es: (s) => [`Primera victoria para ${s.driver}`, `${s.driver} rompe el hielo en ${s.team}`],
    en: (s) => [`A first win for ${s.driver}`, `${s.driver} breaks through at ${s.team}`],
  },
  teammateBeaten: {
    es: (s) => [`${s.driver} gana el duelo interno a ${s.teammate}`],
    en: (s) => [`${s.driver} wins the intra-team duel against ${s.teammate}`],
  },
  teammateLost: {
    es: (s) => [`${s.teammate} le come la tostada a ${s.driver} en el mismo coche`],
    en: (s) => [`${s.teammate} has the measure of ${s.driver} in the same car`],
  },
  pointless: {
    es: (s) => [
      `Temporada en blanco para ${s.driver}`,
      `Ni un punto: el año que ${s.driver} querrá olvidar`,
    ],
    en: (s) => [
      `A blank season for ${s.driver}`,
      `Not a single point: the year ${s.driver} will want to forget`,
    ],
  },
  unreliable: {
    es: (s) => [`${s.retirements} abandonos: el ${s.team} se rompe más de lo que corre`],
    en: (s) => [`${s.retirements} retirements: the ${s.team} breaks more than it races`],
  },
  wetMaster: {
    es: (s) => [`Bajo el agua no hay nadie como ${s.driver}`],
    en: (s) => [`In the wet there is nobody like ${s.driver}`],
  },
};

/**
 * Two to four headlines for a season, chosen by what actually stood out. The
 * order is deliberate: the biggest fact first, so the player reads the verdict
 * before the detail.
 */
export const headlinesFor = ({ stats, season, career, locale = "es", stream }) => {
  if (!stats) return [];

  const subject = {
    driver: career.driver.name,
    team: stats.team,
    year: season.year,
    points: Math.round(stats.points),
    wins: stats.wins,
    position: stats.position,
    carRank: stats.carRank,
    retirements: stats.retirements,
    teammate: season.teammateName || "su compañero",
  };

  const keys = [];
  if (stats.champion) keys.push("champion");
  else if (stats.position === 2) keys.push("runnerUp");

  if (stats.overperformance >= 3.5) keys.push("overperformed");
  if (stats.overperformance <= -3.5) keys.push("underperformed");

  const previousWins = (career.history || []).reduce((sum, entry) => sum + entry.wins, 0);
  if (stats.wins > 0 && previousWins === 0) keys.push("firstWin");

  if (season.teammate) {
    keys.push(stats.points >= season.teammate.points ? "teammateBeaten" : "teammateLost");
  }

  if (stats.points === 0) keys.push("pointless");
  if (stats.retirements >= Math.max(4, season.raceCount * 0.35)) keys.push("unreliable");
  if (season.wetRaces >= 3 && career.driver.attributes.wet >= 72) keys.push("wetMaster");

  const chosen = keys.slice(0, 4);
  return chosen.map((key) => {
    const options = HEADLINES[key][locale === "en" ? "en" : "es"](subject);
    return { key, text: stream ? stream.pick(options) : options[0] };
  });
};
