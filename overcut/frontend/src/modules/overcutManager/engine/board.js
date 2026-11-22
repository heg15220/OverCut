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
import { addInbox, addNews } from "./inbox";
import { constructorStandings, driverStandings } from "./standings";
import { expectedRankOf, teamsByPace } from "./world";

export const setObjectives = (career) => {
  const world = career.world;
  const teams = Object.keys(world.teams).length;
  const expected = expectedRankOf(world, career.teamId);
  const ranked = teamsByPace(world);
  const objectives = [];

  const target = clamp(expected <= 3 ? expected : expected + 1, 1, teams);
  objectives.push({ id: "constructors", type: "constructors", target, weight: 3 });

  if (expected <= 3) objectives.push({ id: "wins", type: "wins", target: expected === 1 ? 4 : 1, weight: 2 });
  else if (expected <= Math.ceil(teams / 2)) objectives.push({ id: "podium", type: "podium", target: 1, weight: 2 });
  else objectives.push({ id: "points", type: "points", target: 1, weight: 2 });

  const rival = expected > 1 ? ranked[expected - 2] : ranked[1];
  if (rival) objectives.push({ id: "rival", type: "rival", teamId: rival.id, ahead: expected > 1, weight: 1 });

  objectives.push({ id: "budget", type: "budget", weight: 1 });

  career.board.objectives = objectives;
  career.board.expected = expected;
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

/** After every Grand Prix the board looks at the result and the table. */
export const boardAfterRace = (career, summary) => {
  const expected = career.board.expected || 5;
  const ownRows = summary.rows.filter((row) => row.teamId === career.teamId);
  const best = Math.min(...ownRows.map((row) => (row.position && row.status === "finished" ? row.position : 30)));
  // A car expected fifth should put its better driver around ninth, a little
  // higher in eras when half the field broke down in front of it.
  const finishRate = eraProfileFor(career.year).finishRate;
  const par = Math.max(1, expected * 2 - 1 - (1 - finishRate) * expected * 2);
  const raceDelta = clamp((par - best) * 0.15, -2, 2) + (best === 1 ? 1.2 : 0);
  let tableDelta = 0;
  const status = objectiveStatus(career).find((objective) => objective.type === "constructors");
  if (career.season.results.length >= 3 && status) tableDelta = status.state === "on-track" ? 0.6 : status.state === "close" ? -0.8 : -2.2;
  const money = career.finances.balance < 0 ? -1.2 : 0;
  // Boards have short memories in both directions: confidence drifts back to neutral.
  const drift = (60 - career.board.confidence) * 0.06;
  career.board.confidence = clamp(career.board.confidence + raceDelta + tableDelta + money + drift, 0, 100);
  career.fans = clamp((career.fans ?? 60) + raceDelta * 0.8, 0, 100);
  return checkJobSecurity(career);
};

export const checkJobSecurity = (career) => {
  if (career.ended) return null;
  if (career.owner) {
    const floor = -0.35 * career.finances.seasonIncome;
    if (career.finances.balance < floor) {
      career.ended = { reason: "bankrupt", year: career.year, round: career.round };
      addInbox(career, { kind: "bankrupt", stop: true });
      return "bankrupt";
    }
  }
  const confidence = career.board.confidence;
  if (confidence < 25 && !career.board.warned) {
    career.board.warned = true;
    addInbox(career, { kind: career.owner ? "investors-warning" : "board-warning", confidence: Math.round(confidence), stop: true });
    return "warning";
  }
  if (confidence >= 38) career.board.warned = false;
  if (!career.owner && confidence < 10 && career.board.warned) {
    career.ended = { reason: "sacked", year: career.year, round: career.round };
    addInbox(career, { kind: "sacked", stop: true });
    addNews(career, { kind: "sacked", teamId: career.teamId, manager: career.managerName });
    return "sacked";
  }
  if (career.owner && confidence < 6 && career.board.warned) {
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
    score += objective.weight * (met ? (beat ? 1.25 : 1) : objective.state === "close" ? 0.4 : 0);
  });
  const grade = total ? score / total : 0.5;
  const confidenceDelta = Math.round((grade - 0.6) * 40);
  career.board.confidence = clamp(career.board.confidence + confidenceDelta, 0, 100);

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
