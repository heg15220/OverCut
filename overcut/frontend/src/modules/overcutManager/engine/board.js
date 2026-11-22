/**
 * The people above the team principal.
 *
 * For a real team that is a board; for a team the player built from nothing it
 * is the investors who paid for it. They want the same things - the car to
 * finish where its pace says it should, a target or two on top, and the books
 * not to sink - and they show it the same way, as confidence. The difference is
 * the ending: a board sacks its principal, investors pull the money.
 */

import { clamp, substream } from "../../overcutTrayectoria/engine/rng";
import { eraProfileFor } from "../../overcutTrayectoria/engine/eras";
import boardData from "../data/balance/board.json";
import { addInbox, addNews } from "./inbox";
import { constructorStandings, driverStandings } from "./standings";
import { expectedRankOf, teamsByPace } from "./world";

// ------------------------------------------------------------ rating (RF-FIN-04)

/**
 * The team's rating, 0..1000, from where its car should finish and the weight
 * of its name (board.json `rating`). Bands: champion 600–1000, podium 450–599,
 * points 0–449 (SRS 2.2).
 */
export const teamRating = (career, teamId = career.teamId) => {
  const world = career.world;
  const teams = Object.keys(world.teams).length;
  const expected = expectedRankOf(world, teamId);
  const pace = teams > 1 ? 1 - (expected - 1) / (teams - 1) : 1;
  const prestige = world.teams[teamId]?.prestige ?? 0.4;
  const w = boardData.rating;
  return Math.round(1000 * clamp(w.wPace * pace + w.wPrestige * prestige, 0, 1));
};

export const BOARD_BANDS = boardData.bands;

export const ratingBand = (rating) => BOARD_BANDS.find((band) => rating >= band.min && rating <= band.max) || BOARD_BANDS[BOARD_BANDS.length - 1];

/** RNF-06: board fields added after version 1 (idempotent). */
export const ensureBoard = (career) => {
  const board = career.board || (career.board = { objectives: [], confidence: boardData.start.board, warned: false, expected: 5 });
  if (!Array.isArray(board.history)) board.history = [];
  if (!board.band && career.world?.teams?.[career.teamId]) {
    board.rating = teamRating(career);
    board.band = ratingBand(board.rating).id;
  }
  return board;
};

/** Move confidence by `delta` (clamped 0..100) and remember why (board.history). */
export const adjustConfidence = (career, delta, reason) => {
  const board = ensureBoard(career);
  board.confidence = clamp(board.confidence + delta, 0, 100);
  board.history.push({ year: career.year, round: career.round, confidence: Math.round(board.confidence * 10) / 10, delta: Math.round(delta * 10) / 10, reason });
  if (board.history.length > boardData.historyLimit) board.history.splice(0, board.history.length - boardData.historyLimit);
  return board.confidence;
};

/** Objectives by the team's rating band (RF-FIN-04, board.json `bands`). */
export const setObjectives = (career) => {
  const world = career.world;
  const teams = Object.keys(world.teams).length;
  const expected = expectedRankOf(world, career.teamId);
  const ranked = teamsByPace(world);
  const rating = teamRating(career);
  const band = ratingBand(rating);
  const objectives = [];

  band.objectives.forEach((spec) => {
    if (spec.type === "constructors") objectives.push({ id: "constructors", type: "constructors", target: clamp(expected + (spec.offset || 0), 1, teams), weight: spec.weight });
    else if (spec.type === "wins") objectives.push({ id: "wins", type: "wins", target: expected === 1 ? spec.targetIfLeader ?? spec.target : spec.target, weight: spec.weight });
    else if (spec.type === "podium" || spec.type === "points") objectives.push({ id: spec.type, type: spec.type, target: spec.target, weight: spec.weight });
    else if (spec.type === "rival") {
      const rival = expected > 1 ? ranked[expected - 2] : ranked[1];
      if (rival) objectives.push({ id: "rival", type: "rival", teamId: rival.id, ahead: expected > 1, weight: spec.weight });
    } else if (spec.type === "budget") objectives.push({ id: "budget", type: "budget", weight: spec.weight });
  });

  career.board.objectives = objectives;
  career.board.expected = expected;
  career.board.rating = rating;
  career.board.band = band.id;
  ensureBoard(career);
  return objectives;
};

/** Where every objective stands right now. */
export const objectiveStatus = (career) => {
  const constructors = constructorStandings(career);
  const own = constructors.find((row) => row.teamId === career.teamId);
  const raced = career.season.results.length;
  const stats = Object.values(career.season.drivers).filter((row) => row.teamId === career.teamId);
  const wins = stats.reduce((sum, row) => sum + row.wins, 0);
  const podiums = stats.reduce((sum, row) => sum + row.podiums, 0);
  const points = own?.points ?? 0;

  return career.board.objectives.map((objective) => {
    if (objective.type === "constructors") {
      const position = own?.position ?? constructors.length;
      const state = raced === 0 ? "pending" : position <= objective.target ? "on-track" : position <= objective.target + 1 ? "close" : "off-track";
      return { ...objective, current: position, state };
    }
    if (objective.type === "wins") return { ...objective, current: wins, state: wins >= objective.target ? "done" : raced === 0 ? "pending" : "on-track" };
    if (objective.type === "podium") return { ...objective, current: podiums, state: podiums >= objective.target ? "done" : raced === 0 ? "pending" : "on-track" };
    if (objective.type === "points") return { ...objective, current: points, state: points >= objective.target ? "done" : raced === 0 ? "pending" : "on-track" };
    if (objective.type === "rival") {
      const rival = constructors.find((row) => row.teamId === objective.teamId);
      const ahead = rival && own ? own.position < rival.position : false;
      return { ...objective, current: ahead, state: raced === 0 ? "pending" : ahead ? "on-track" : "off-track" };
    }
    if (objective.type === "budget") return { ...objective, current: career.finances.balance, state: career.finances.balance >= 0 ? "on-track" : "off-track" };
    return { ...objective, state: "pending" };
  });
};

/** The expected best finish of the player's cars in one race (par). */
export const racePar = (career) => {
  const expected = career.board.expected || 5;
  // A car expected fifth should put its better driver around ninth, a little
  // higher in eras when half the field broke down in front of it.
  const finishRate = eraProfileFor(career.year).finishRate;
  return Math.max(boardData.race.parFloor, expected * 2 - 1 - (1 - finishRate) * expected * 2);
};

/**
 * After every Grand Prix the board looks at the result and the table
 * (RF-FIN-04): −6 below what was expected, +8 above it by more than one
 * position (board.json `race`), the table from round 3, money, and a drift
 * back to neutral. Half way through the year it reviews the objectives.
 */
export const boardAfterRace = (career, summary) => {
  ensureBoard(career);
  const r = boardData.race;
  const ownRows = summary.rows.filter((row) => row.teamId === career.teamId);
  const best = Math.min(...ownRows.map((row) => (row.position && row.status === "finished" ? row.position : 30)));
  const par = racePar(career);
  let raceDelta = 0;
  if (best > par + r.belowTolerance) raceDelta = r.belowExpected * r.scale;
  else if (best < par - r.aboveMargin) raceDelta = r.aboveExpected * r.scale;
  if (best === 1) raceDelta += r.winBonus;
  let tableDelta = 0;
  const status = objectiveStatus(career).find((objective) => objective.type === "constructors");
  if (career.season.results.length >= r.tableFromRound && status) tableDelta = status.state === "on-track" ? r.tableOnTrack : status.state === "close" ? r.tableClose : r.tableOffTrack;
  const money = career.finances.balance < 0 ? r.negativeBalance : 0;
  // Boards have short memories in both directions: confidence drifts back to neutral.
  const gap = r.driftTo - career.board.confidence;
  const drift = gap * (gap > 0 ? r.driftRateBelow : r.driftRate);
  adjustConfidence(career, raceDelta + tableDelta + money + drift, raceDelta > 0 ? "above" : raceDelta < 0 ? "below" : "par");
  career.fans = clamp((career.fans ?? 60) + raceDelta * r.fansPerDelta, 0, 100);
  const raceCount = career.world.races.length;
  if (raceCount > 2 && career.round + 1 === Math.ceil(raceCount * boardData.midSeason.share)) midSeasonReview(career);
  return checkJobSecurity(career);
};

/** Half-way review of the objectives (RF-FIN-04): a small move and a letter. */
export const midSeasonReview = (career) => {
  const m = boardData.midSeason;
  const status = objectiveStatus(career);
  let delta = 0;
  let weight = 0;
  status.forEach((objective) => {
    if (objective.state === "pending") return;
    weight += objective.weight;
    delta += objective.weight * (objective.state === "done" || objective.state === "on-track" ? m.onTrack : objective.state === "close" ? m.close : m.offTrack);
  });
  const change = weight ? Math.round((delta / weight) * 10) / 10 : 0;
  adjustConfidence(career, change, "mid-season");
  career.board.midSeason = { year: career.year, round: career.round, delta: change, status: status.map((objective) => ({ id: objective.id, state: objective.state })) };
  addInbox(career, { kind: "board-midseason", delta: change, confidence: Math.round(career.board.confidence) });
  return career.board.midSeason;
};

export const checkJobSecurity = (career) => {
  if (career.ended) return null;
  const sec = boardData.security;
  if (career.owner) {
    const floor = sec.bankruptFloorShare * career.finances.seasonIncome;
    if (career.finances.balance < floor) {
      career.ended = { reason: "bankrupt", year: career.year, round: career.round };
      addInbox(career, { kind: "bankrupt", stop: true });
      return "bankrupt";
    }
  }
  const confidence = career.board.confidence;
  if (confidence < sec.warnBelow && !career.board.warned) {
    career.board.warned = true;
    addInbox(career, { kind: career.owner ? "investors-warning" : "board-warning", confidence: Math.round(confidence), stop: true });
    return "warning";
  }
  if (confidence >= sec.reArmAbove) career.board.warned = false;
  // RF-FIN-04: sacked when confidence reaches zero, always after one warning.
  if (!career.owner && confidence <= sec.sackAt && career.board.warned) {
    career.ended = { reason: "sacked", year: career.year, round: career.round };
    addInbox(career, { kind: "sacked", stop: true });
    addNews(career, { kind: "sacked", teamId: career.teamId, manager: career.managerName });
    return "sacked";
  }
  if (career.owner && confidence <= sec.investorsOutAt && career.board.warned) {
    career.ended = { reason: "investors", year: career.year, round: career.round };
    addInbox(career, { kind: "investors-out", stop: true });
    return "investors";
  }
  return null;
};

/** The verdict on a whole season, and what it does to the principal's name. */
export const seasonReview = (career) => {
  const status = objectiveStatus(career);
  let score = 0;
  let total = 0;
  status.forEach((objective) => {
    total += objective.weight;
    const met = objective.state === "done" || objective.state === "on-track";
    const beat = objective.type === "constructors" && objective.current < objective.target;
    score += objective.weight * (met ? (beat ? boardData.season.beatTargetBonus : 1) : objective.state === "close" ? boardData.season.closeCredit : 0);
  });
  const grade = total ? score / total : 0.5;
  const confidenceDelta = Math.round((grade - boardData.season.neutralGrade) * boardData.season.scale);
  adjustConfidence(career, confidenceDelta, "season");

  const constructors = constructorStandings(career);
  const drivers = driverStandings(career);
  const titles = (constructors[0]?.teamId === career.teamId ? 1 : 0) + (drivers[0]?.teamId === career.teamId ? 1 : 0);
  const before = career.reputation;
  career.reputation = clamp(career.reputation + (grade - 0.55) * 14 + titles * 6, 1, 100);
  return { status, grade, confidenceDelta, reputationDelta: Math.round((career.reputation - before) * 10) / 10, titles };
};

/**
 * Teams that want the principal for next season. A good year brings offers from
 * bigger teams; being sacked brings offers from smaller ones, if any.
 */
export const generateJobOffers = (career, reason = "season") => {
  const stream = substream(career.seed, "jobs", career.year, reason);
  const level = career.reputation / 100;
  const current = career.world.teams[career.teamId];
  const pool = Object.values(career.world.teams).filter((team) => {
    if (team.id === career.teamId || team.custom) return false;
    if (reason === "sacked") return team.prestige <= Math.max(0.25, (current?.prestige ?? 0.4) - 0.05);
    return team.prestige >= (current?.prestige ?? 0) - 0.05 && team.prestige <= level + 0.15;
  });
  const offers = [];
  stream.shuffle(pool).slice(0, 3).forEach((team) => {
    if (reason === "season" && stream.chance(0.5)) return;
    offers.push({ id: `job-${career.year}-${team.id}`, teamId: team.id, name: team.name, prestige: team.prestige });
  });
  if (offers.length) addInbox(career, { kind: "job-offers", offers: offers.map((offer) => offer.teamId), stop: reason !== "season" });
  return offers;
};
