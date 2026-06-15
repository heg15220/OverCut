// Driver card progression — F1 25-style attributes (Pace, Racecraft, Awareness,
// Experience) plus a derived Overall. Pure, deterministic logic: the engine and
// UI feed it race results and an age, it returns XP and the resulting card.
//
// Design: docs/superpowers/specs/2026-06-13-driver-card-progression-design.md

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

// Overall weights — Pace has the biggest impact, matching EA's F1 25.
const OVERALL_WEIGHTS = { pace: 0.45, racecraft: 0.25, awareness: 0.2, experience: 0.1 };
const XP_BASE = 185; // XP for the first point of an attribute at value 0
const MAX_ATTRIBUTE = 99;

export const ATTRIBUTE_KEYS = ["pace", "racecraft", "awareness", "experience"];

export const computeOverall = (card) =>
  Math.round(
    ATTRIBUTE_KEYS.reduce((sum, key) => sum + OVERALL_WEIGHTS[key] * (card[key] || 0), 0)
  );

// A freshly created 18-year-old rookie: decent instincts, little experience.
export const createDriverCard = () => ({ pace: 58, racecraft: 56, awareness: 60, experience: 18 });

// Converts earned XP into attribute points faster when young, decaying to a
// floor. It only slows growth — it never lowers attributes.
export const ageGrowthMultiplier = (age) => {
  if (age <= 22) return clamp(0.78 + (age - 18) * 0.04, 0.78, 0.94);
  if (age <= 27) return clamp(0.96 + (age - 23) * 0.035, 0.96, 1.1);
  if (age <= 33) return 1.12;
  if (age <= 36) return clamp(0.76 - (age - 34) * 0.08, 0.6, 0.76);
  return clamp(0.48 - (age - 37) * 0.075, 0.18, 0.48);
};

export const attributeGrowthMultiplier = (age, attribute) => {
  const base = ageGrowthMultiplier(age);
  if (attribute === "pace" && age > 33) return clamp(base * 0.35, 0.04, 0.32);
  if (attribute === "experience") return clamp(base * 0.55 + 0.42, 0.5, 1.12);
  if (attribute === "racecraft" && age > 33) return clamp(base * 0.7 + 0.18, 0.34, 0.8);
  if (attribute === "awareness") return clamp(base * 0.82 + 0.08, 0.24, 1);
  return base;
};

// Diminishing returns: improving a high attribute costs far more XP than a low one.
export const xpForNextPoint = (value) => XP_BASE * (1 + (value / MAX_ATTRIBUTE) ** 2.55);

export const paceDeclineForAge = (age, pace) => {
  if (age <= 33 || pace <= 65) return 0;
  const raw =
    age <= 34 ? 0 :
    age <= 37 ? 1 :
    age <= 39 ? 2 :
    3;
  return Math.min(raw, Math.max(0, pace - 65));
};

export const applySeasonAging = (card, age) => {
  const nextCard = { ...card };
  const deltas = { pace: 0, racecraft: 0, awareness: 0, experience: 0 };
  const paceLoss = paceDeclineForAge(age, nextCard.pace);
  if (paceLoss > 0) {
    nextCard.pace = Math.max(65, nextCard.pace - paceLoss);
    deltas.pace = nextCard.pace - card.pace;
  }
  return { card: nextCard, deltas, overall: computeOverall(nextCard) };
};

// The finish the player's CAR is expected to deliver this race, from its rating
// rank against the field (lead seat ~ 2k-1). Falls back to the grid slot when
// the season grid is unavailable.
const expectedFinishFromCar = (raceResult, season) => {
  const pr = raceResult.playerResult;
  const fieldSize = raceResult.results?.length || pr.position || 1;
  const ratings = (season?.grid || []).map((team) => team.rating).filter(Number.isFinite);
  const playerTeam = (season?.grid || []).find((team) => team.name === pr.team);
  if (!ratings.length || !playerTeam || !Number.isFinite(playerTeam.rating)) {
    return clamp(pr.gridPosition || pr.position || 1, 1, fieldSize);
  }
  const carRank = ratings.filter((rating) => rating > playerTeam.rating).length + 1;
  return clamp(carRank * 2 - 1, 1, fieldSize);
};

// Analyse a finished race into raw XP per channel (before age scaling). Experience
// is always awarded; the performance channels are gated by how the player did
// versus the car's expected finish.
export const analyzeRaceXp = (raceResult, season, profile) => {
  const pr = raceResult.playerResult;
  const finished = pr.status !== "DNF";
  const fieldSize = raceResult.results?.length || pr.position || 1;
  const grid = pr.gridPosition ?? raceResult.startingPosition ?? pr.position;
  const expected = expectedFinishFromCar(raceResult, season);
  const playerTeam = (season?.grid || []).find((team) => team.name === pr.team);
  const teamRating = Number.isFinite(playerTeam?.rating) ? playerTeam.rating : null;
  const actual = finished ? pr.position : fieldSize;
  const delta = expected - actual; // > 0 means the driver beat the car's potential
  const resultFactor = clamp(1 + delta * 0.12, 0.4, 1.8);
  const lowCarPodiumBonus =
    finished && pr.position <= 3 && teamRating != null && teamRating < 70
      ? 1.75
      : finished && pr.position <= 3 && teamRating != null && teamRating < 76
      ? 1.4
      : 1;

  const positionsGained = finished ? Math.max(0, grid - pr.position) : 0;
  const degradation = raceResult.conditions?.degradation ?? 0;
  const wetLevel = raceResult.wetLevel ?? 0;
  const teammate = raceResult.teammate;
  const overperformedWet = finished && wetLevel > 0.25 && delta > 0;

  const experience = finished ? 60 : 25;

  const racecraftRaw =
    25 + positionsGained * 14 + (finished && degradation > 0.66 ? 20 * degradation : 0);

  const paceRaw =
    25 +
    (teammate && grid < teammate.startingPosition ? 20 : 0) +
    (pr.fastestLap ? 25 : 0) +
    (finished && teammate && pr.position < teammate.finalPosition ? 18 : 0) +
    (overperformedWet ? wetLevel * 30 : 0);

  const awarenessRaw = finished ? 50 + (overperformedWet ? wetLevel * 20 : 0) : 0;

  return {
    pace: paceRaw * resultFactor * lowCarPodiumBonus,
    racecraft: racecraftRaw * resultFactor * lowCarPodiumBonus,
    awareness: awarenessRaw * resultFactor * lowCarPodiumBonus,
    experience: experience * lowCarPodiumBonus,
    resultFactor,
    lowCarPodiumBonus,
    expected,
    actual,
  };
};

// Apply earned XP to a card. Age scales the XP, diminishing returns govern how
// many points it buys, attributes cap at 99 and never fall. Returns the new card,
// the carried-over XP accumulators, per-attribute deltas, and the new overall.
export const applyRaceXp = (card, cardXp, xpGains, age) => {
  const nextCard = { ...card };
  const nextXp = { ...cardXp };
  const deltas = {};

  ATTRIBUTE_KEYS.forEach((key) => {
    const multiplier = attributeGrowthMultiplier(age, key);
    let value = card[key];
    let accumulated = (cardXp[key] || 0) + (xpGains[key] || 0) * multiplier;
    while (value < MAX_ATTRIBUTE && accumulated >= xpForNextPoint(value)) {
      accumulated -= xpForNextPoint(value);
      value += 1;
    }
    nextCard[key] = value;
    nextXp[key] = value >= MAX_ATTRIBUTE ? 0 : accumulated;
    deltas[key] = value - card[key];
  });

  return { card: nextCard, cardXp: nextXp, deltas, overall: computeOverall(nextCard) };
};
