/**
 * History in a career (SRS 6.1, 6.4, 6.5; RF-INB-02, RF-INB-03, RF-HIS-00).
 *
 * The season pack fixes who is entered in every Grand Prix; this module adds the
 * fixed and guided facts that the entries alone cannot express, all read from
 * the curated events (`data/seasons/curated/events.json`, copied into every
 * pack as `pack.events`):
 *
 *   race-starters          only these teams take the start (Indianapolis 2005:
 *                          the six Bridgestone cars). Fixed: every mode, whoever
 *                          the player is.
 *   constructors-exclusion a team's constructors' points count as zero (McLaren
 *                          2007). Fixed in strict mode only.
 *   drivers-exclusion      a driver is removed from the drivers' table
 *                          (Schumacher 1997). Guided: strict mode only, and only
 *                          when its condition reproduces in the simulated season.
 *   driver-absent          a real driver misses these rounds (Lauda 1976), even
 *                          when the player employs him.
 *
 * Sensitive events (RF-HIS-00: real fatal accidents) are sober notes on their
 * date and nothing else: `effectOf` never returns an effect for them, whatever
 * the data says.
 *
 * Every function here is pure except `deliverHistoryEvents`, which writes the
 * due events into the inbox and the news the way the rest of the engine does.
 */

import curatedEvents from "../../data/seasons/curated/events.json";
import { addInbox, addNews } from "../inbox";

const DAY = 24 * 3600 * 1000;
const STATUS_FINISHED = "finished";

// ------------------------------------------------------------------ mode

/**
 * RF-CAR-05 / RF-INB-03. Reads `career.mode`; like career.js `modeOf`, anything but
 * "free" is the historical strict mode (a career without the flag is strict).
 */
export const isStrict = (career) => career?.mode !== "free";

/** RF-INB-03: regulation votes exist only in Libre; in strict mode next year's rules are the real ones. */
export const regulationVoteAllowed = (career) => !isStrict(career);

/** Where next season's regulations come from: the real pack ("real") or the player's vote ("vote"). */
export const nextRegulationsSource = (career) => (isStrict(career) ? "real" : "vote");

// ---------------------------------------------------------------- events

/**
 * The events of a season: the pack's when given, then the world's (if the world
 * builder carries them), then the curated list the packs are generated from.
 */
export const seasonEvents = (year, { pack = null, world = null } = {}) => {
  if (pack && pack.year === year && Array.isArray(pack.events)) return pack.events;
  if (world && world.year === year && Array.isArray(world.events)) return world.events;
  return curatedEvents[String(year)] || [];
};

const eventsOf = (career, events) => events || seasonEvents(career.year, { world: career.world });

/** One event by id, for the interface (the inbox stores only the id). */
export const findHistoryEvent = (year, id, options) => seasonEvents(year, options).find((event) => event.id === id) || null;

/**
 * The effect an event has in this career, or null. Never for a sensitive event
 * (RF-HIS-00) nor a note; "strict" effects only in strict mode.
 */
export const effectOf = (event, career) => {
  if (!event?.effect || event.sensitive || event.kind !== "constraint") return null;
  if (event.effect.mode === "strict" && !isStrict(career)) return null;
  return event.effect;
};

// ------------------------------------------------------------------ clock

const shift = (iso, days) => new Date(Date.parse(`${iso}T00:00:00Z`) + days * DAY).toISOString().slice(0, 10);

const seasonOver = (career) => career.round >= (career.world?.races?.length || 0);

/**
 * "Today" in a career: the Thursday before the next Grand Prix (three days before
 * its date), or 31 December once the season's last race is done.
 */
export const historyClock = (career) => {
  if (seasonOver(career)) return `${career.year}-12-31`;
  const next = career.world.races[career.round];
  return shift(next.date, -3);
};

/**
 * Is an event due (RF-INB-02)? A note tied to a race comes after that race; a
 * constraint tied to a race comes in the week before it (it changes the weekend);
 * anything else comes once its date has passed on the career's clock.
 */
export const isDue = (event, career) => {
  const completed = career.round; // races already run this season
  if (event.round !== null && event.round !== undefined) {
    if (event.kind === "constraint") return completed + 1 >= event.round || seasonOver(career);
    return completed >= event.round;
  }
  return event.date <= historyClock(career);
};

const deliveredOf = (career) => new Set(career.historical?.delivered || []);

/** The events due now and not delivered yet, in date order (pure). */
export const dueHistoryEvents = (career, { events } = {}) => {
  const delivered = deliveredOf(career);
  return eventsOf(career, events)
    .filter((event) => !delivered.has(event.id) && isDue(event, career))
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
};

/**
 * RF-INB-02: put the due events in the news (all of them) and the inbox (as a
 * read-only message, never a decision). Call after createCareer, after every
 * closeWeekend round change and after startNextSeason. A spectator career (no
 * principal) gets no mail. Returns the ids delivered.
 */
export const deliverHistoryEvents = (career, options = {}) => {
  if (career.spectator) return [];
  const due = dueHistoryEvents(career, options);
  if (!due.length) return [];
  const delivered = deliveredOf(career);
  due.forEach((event) => {
    const item = {
      kind: "history-event",
      eventId: event.id,
      eventYear: career.year,
      date: event.date,
      anchor: event.anchor,
      sensitive: Boolean(event.sensitive),
      constraint: event.kind === "constraint",
    };
    addNews(career, item);
    addInbox(career, { ...item, stop: false });
    delivered.add(event.id);
  });
  career.historical = { ...(career.historical || {}), delivered: [...delivered] };
  return due.map((event) => event.id);
};

// ------------------------------------------------------------- the grid

/**
 * Fixed anchor (SRS 6.4, Indianapolis 2005): the cars that really take the start of
 * this Grand Prix. `entrants` is what career.entrantsFor returns; the result is the
 * subset the race engine must receive. Qualifying is untouched (everyone set a time).
 */
export const raceStarters = (career, entrants, { events } = {}) => {
  const round = career.round + 1;
  const rule = eventsOf(career, events).find((event) => event.round === round && effectOf(event, career)?.type === "race-starters");
  if (!rule) return entrants;
  const teams = new Set(rule.effect.teams);
  return entrants.filter((entrant) => teams.has(entrant.teamId));
};

const enteredIn = (race, driverId) => Object.values(race?.entries || {}).some((ids) => ids.includes(driverId));

const teamOfIn = (race, driverId) => Object.keys(race?.entries || {}).find((teamId) => race.entries[teamId].includes(driverId)) || null;

/**
 * Did a real driver miss this round of the current season for a reason outside the
 * team's control (injury, ban)? Either an explicit `driver-absent` effect, or the
 * pack says so: his own team raced, he was not entered by anyone, and he came back
 * later in the year (a driver who never returns was dropped - a team decision, Libre).
 */
export const isAbsent = (career, driverId, { round = career.round + 1, events } = {}) => {
  const explicit = eventsOf(career, events).some((event) => {
    const effect = effectOf(event, career);
    return effect?.type === "driver-absent" && effect.driverId === driverId && (effect.rounds || []).includes(round);
  });
  if (explicit) return true;
  const races = career.world?.races || [];
  const race = races[round - 1];
  if (!race?.entries || enteredIn(race, driverId)) return false;
  let ownTeam = null;
  for (let index = round - 2; index >= 0 && !ownTeam; index -= 1) ownTeam = teamOfIn(races[index], driverId);
  if (!ownTeam || !race.entries[ownTeam]) return false;
  return races.slice(round).some((later) => enteredIn(later, driverId));
};

/**
 * The player's cars for this round with real absences applied: an absent driver is
 * replaced by the team's reserve (when he is free to drive), otherwise the car stays
 * in the garage. Rivals already field their real entries (packWorld.roundLineup).
 */
export const lineupWithAbsences = (career, team, lineup, options = {}) => {
  if (!team || team.custom) return lineup;
  const out = [];
  lineup.forEach((driver) => {
    if (!isAbsent(career, driver.id, options)) {
      out.push(driver);
      return;
    }
    const reserve = team.reserve ? career.world.drivers[team.reserve] : null;
    if (reserve && !lineup.includes(reserve) && !out.includes(reserve) && !isAbsent(career, reserve.id, options)) out.push(reserve);
  });
  return out;
};

// ------------------------------------------------------------- standings

const ranked = (rows) => rows.map((row, index) => ({ ...row, position: index + 1 }));

/** Constructors' table with the fixed exclusions that are due (McLaren 2007, strict mode). */
export const adjustConstructorStandings = (career, rows, { events } = {}) => {
  const excluded = new Set(
    eventsOf(career, events)
      .filter((event) => effectOf(event, career)?.type === "constructors-exclusion" && isDue(event, career))
      .map((event) => event.effect.teamId),
  );
  if (!excluded.size || !rows.some((row) => excluded.has(row.teamId))) return rows;
  const kept = rows.filter((row) => !excluded.has(row.teamId));
  const out = rows.filter((row) => excluded.has(row.teamId)).map((row) => ({ ...row, total: 0, points: 0, excluded: true }));
  return ranked([...kept, ...out]);
};

/** Points of every driver before a round of the career's season (from the season's summaries). */
const pointsBefore = (career, round) => {
  const totals = {};
  (career.season?.results || [])
    .filter((summary) => summary.round < round)
    .forEach((summary) => summary.rows.forEach((row) => {
      totals[row.driverId] = (totals[row.driverId] || 0) + (row.points || 0);
    }));
  return totals;
};

/**
 * The guided condition of a drivers' exclusion (Jerez 1997): it applies only if the
 * simulated season reproduces the situation. "title-decider-contact": the driver led
 * the championship going into the given round with the rival second, retired from
 * that round after a collision, and the rival finished it.
 */
export const exclusionConditionMet = (career, effect) => {
  const condition = effect.condition;
  if (!condition) return true;
  if (condition.type !== "title-decider-contact") return false;
  const decider = (career.season?.results || []).find((summary) => summary.round === condition.round);
  if (!decider) return false;
  const before = Object.entries(pointsBefore(career, condition.round)).sort((a, b) => b[1] - a[1]);
  if (before[0]?.[0] !== effect.driverId || before[1]?.[0] !== condition.rivalId) return false;
  const own = decider.rows.find((row) => row.driverId === effect.driverId);
  const rival = decider.rows.find((row) => row.driverId === condition.rivalId);
  return Boolean(own && rival && own.status === "collision" && rival.status === STATUS_FINISHED);
};

/** Drivers' table with the guided exclusions whose situation reproduced (strict mode). */
export const adjustDriverStandings = (career, rows, { events } = {}) => {
  const excluded = new Set(
    eventsOf(career, events)
      .filter((event) => {
        const effect = effectOf(event, career);
        return effect?.type === "drivers-exclusion" && isDue(event, career) && exclusionConditionMet(career, effect);
      })
      .map((event) => event.effect.driverId),
  );
  if (!excluded.size || !rows.some((row) => excluded.has(row.driverId))) return rows;
  const kept = rows.filter((row) => !excluded.has(row.driverId));
  const out = rows.filter((row) => excluded.has(row.driverId)).map((row) => ({ ...row, total: 0, excluded: true }));
  return ranked([...kept, ...out]);
};

/** Both tables at once: { drivers, constructors } in, the same shape out. */
export const applyHistoricalStandings = (career, { drivers, constructors }, options = {}) => ({
  drivers: drivers ? adjustDriverStandings(career, drivers, options) : drivers,
  constructors: constructors ? adjustConstructorStandings(career, constructors, options) : constructors,
});
