/**
 * Season pack validator (SRS 6, fase 1).
 *
 * A season cannot be played without a valid pack. Validation runs in two
 * layers:
 *
 *   1. Shape: the JSON Schema in data/seasons/season-pack.schema.json (Ajv).
 *   2. Meaning: everything a schema cannot express -
 *      - era coherence (criterio 7.2): the regulations must satisfy every rule
 *        in curated/era-rules.json whose years include the season, so DRS can
 *        never appear in 2008 nor refuelling in 2012;
 *      - referential integrity: entries, results, standings, ratings and
 *        events point at teams, drivers and rounds that exist;
 *      - "Fijo" anchors (6.1): one seat per driver per round, the tyre
 *        suppliers and qualifying formats the regulations declare are the ones
 *        the entries and calendar actually use;
 *      - the points every real result and sprint carries match the points
 *        scheme (with the round's real points factor: half points, double
 *        points), and both tables add up under the year's rules (dropped
 *        scores, best car only) plus the documented adjustments;
 *      - rounds f1db has not raced yet (current season) carry only the
 *        projected grid and no results;
 *      - RF-HIS-00: a sensitive event is only ever a note.
 *
 * Returns { ok, errors, warnings }. Warnings never block play: today they
 * list regulation values still marked "pending" (de memoria, sin verificar).
 */

import Ajv from "ajv";
import schema from "../../data/seasons/season-pack.schema.json";
import eraRules from "../../data/seasons/curated/era-rules.json";

const ajv = new Ajv({ allErrors: true, strict: true });
const validateShape = ajv.compile(schema);

const NEVER_IN_CALENDAR = new Set(["hanoi"]);

const getPath = (object, path) => path.split(".").reduce((value, key) => (value == null ? undefined : value[key]), object);

const sameJson = (a, b) => JSON.stringify(a) === JSON.stringify(b);

/** Does `value` satisfy one era rule? */
const satisfies = (rule, value) => {
  if ("equals" in rule) return sameJson(value, rule.equals);
  if ("oneOf" in rule) return rule.oneOf.some((option) => sameJson(value, option));
  if ("notNull" in rule) return value !== null && value !== undefined;
  if ("subsetOf" in rule) return Array.isArray(value) && value.every((item) => rule.subsetOf.includes(item));
  throw new Error(`era rule for ${rule.field} has no condition`);
};

/** Exported for engine/rules.test.js: the era-defaults of years without a pack must pass the same rules. */
export const satisfiesEraRule = (rule, value) => satisfies(rule, value);

export const eraRulesFor = (year, rules = eraRules.rules) => rules.filter((rule) => year >= rule.from && year <= rule.to);

const checkEra = (pack, errors, rules) => {
  eraRulesFor(pack.year, rules).forEach((rule) => {
    const value = getPath(pack.regulations, rule.field);
    if (!satisfies(rule, value)) {
      errors.push(
        `era: regulations.${rule.field} = ${JSON.stringify(value)} no es válido en ${pack.year} ` +
          `(regla ${rule.from}-${rule.to}: ${JSON.stringify(rule.equals ?? rule.oneOf ?? rule.subsetOf ?? "no nulo")})`
      );
    }
  });
};

const duplicates = (items) => {
  const seen = new Set();
  const repeated = new Set();
  items.forEach((item) => (seen.has(item) ? repeated.add(item) : seen.add(item)));
  return [...repeated];
};

const checkReferences = (pack, errors) => {
  const { calendar, teams, drivers, entries, realResults, sprintResults, standings, standingsAdjustments, ratings, events } = pack;
  const rounds = new Set(calendar.map((race) => race.round));
  const teamIds = new Set(teams.map((team) => team.id));
  const driverIds = new Set(drivers.map((driver) => driver.id));

  duplicates(teams.map((team) => team.id)).forEach((id) => errors.push(`teams: id repetido ${id}`));
  duplicates(drivers.map((driver) => driver.id)).forEach((id) => errors.push(`drivers: id repetido ${id}`));

  // Calendar: rounds 1..n, in date order, inside the season, never a venue that held no GP.
  calendar.forEach((race, index) => {
    if (race.round !== index + 1) errors.push(`calendar: la ronda ${race.round} está en la posición ${index + 1}`);
    if (!race.date.startsWith(`${pack.year}-`)) errors.push(`calendar: la ronda ${race.round} (${race.date}) no es de ${pack.year}`);
    if (index > 0 && race.date <= calendar[index - 1].date) errors.push(`calendar: la ronda ${race.round} no va después de la ${race.round - 1}`);
    if (NEVER_IN_CALENDAR.has(race.circuitId)) errors.push(`calendar: ${race.circuitId} nunca albergó un GP`);
  });

  // Entries: real seats only, one seat per driver per round, every round has a grid.
  const seat = new Map();
  entries.forEach((entry) => {
    if (!rounds.has(entry.round)) errors.push(`entries: ronda inexistente ${entry.round}`);
    if (!teamIds.has(entry.teamId)) errors.push(`entries: equipo desconocido ${entry.teamId} (ronda ${entry.round})`);
    if (!driverIds.has(entry.driverId)) errors.push(`entries: piloto desconocido ${entry.driverId} (ronda ${entry.round})`);
    const key = `${entry.round}:${entry.driverId}`;
    if (seat.has(key)) errors.push(`entries: ${entry.driverId} tiene dos asientos en la ronda ${entry.round}`);
    seat.set(key, entry.teamId);
  });
  calendar.forEach((race) => {
    if (entries.filter((entry) => entry.round === race.round).length < 2) errors.push(`entries: la ronda ${race.round} no tiene parrilla`);
  });

  const raced = new Set(calendar.filter((race) => race.resultsAvailable).map((race) => race.round));
  realResults.forEach((result) => {
    if (seat.get(`${result.round}:${result.driverId}`) !== result.teamId) {
      errors.push(`realResults: ${result.driverId} no estaba inscrito con ${result.teamId} en la ronda ${result.round}`);
    }
    if (!raced.has(result.round)) errors.push(`realResults: la ronda ${result.round} tiene resultados pero figura sin disputar`);
  });
  sprintResults.forEach((result) => {
    if (seat.get(`${result.round}:${result.driverId}`) !== result.teamId) {
      errors.push(`sprintResults: ${result.driverId} no estaba inscrito con ${result.teamId} en la ronda ${result.round}`);
    }
    if (!calendar.find((race) => race.round === result.round)?.sprint) errors.push(`sprintResults: la ronda ${result.round} no es un fin de semana sprint`);
  });
  // A round not raced yet (current season) only has the projected grid; a raced one never has a projected seat.
  entries.forEach((entry) => {
    if (Boolean(entry.projected) === raced.has(entry.round)) {
      errors.push(`entries: ${entry.driverId} en la ronda ${entry.round} ${entry.projected ? "es una proyección en una ronda disputada" : "no puede ser real en una ronda sin disputar"}`);
    }
  });
  standingsAdjustments.forEach((adjustment) => {
    const known = adjustment.table === "drivers" ? driverIds : teamIds;
    if (!known.has(adjustment.id)) errors.push(`standingsAdjustments: ${adjustment.id} no está en la temporada`);
    if (adjustment.round !== null && !rounds.has(adjustment.round)) errors.push(`standingsAdjustments: ronda inexistente ${adjustment.round}`);
    if (adjustment.provenance.status === "pending") errors.push(`standingsAdjustments: ${adjustment.id} no tiene fuente`);
  });
  duplicates(standings.drivers.map((row) => row.driverId)).forEach((id) => errors.push(`standings: piloto repetido ${id}`));
  duplicates(standings.constructors.map((row) => row.teamId)).forEach((id) => errors.push(`standings: equipo repetido ${id}`));
  standings.drivers.forEach((row) => driverIds.has(row.driverId) || errors.push(`standings: piloto desconocido ${row.driverId}`));
  standings.constructors.forEach((row) => teamIds.has(row.teamId) || errors.push(`standings: equipo desconocido ${row.teamId}`));
  ratings.teams.forEach((row) => teamIds.has(row.teamId) || errors.push(`ratings: equipo desconocido ${row.teamId}`));
  ratings.drivers.forEach((row) => driverIds.has(row.driverId) || errors.push(`ratings: piloto desconocido ${row.driverId}`));
  if (ratings.teams.length !== teams.length) errors.push("ratings: falta el rating de algún equipo");

  events.forEach((event) => {
    if (!event.date.startsWith(`${pack.year}-`)) errors.push(`events: ${event.id} no es de ${pack.year}`);
    if (event.round !== null) {
      const race = calendar.find((item) => item.round === event.round);
      if (!race) errors.push(`events: ${event.id} apunta a la ronda ${event.round}, que no existe`);
      else if (race.date !== event.date) errors.push(`events: ${event.id} tiene fecha ${event.date} y su ronda es el ${race.date}`);
    }
    if (event.sensitive && event.kind !== "note") errors.push(`events: ${event.id} es sensible y solo puede ser una nota (RF-HIS-00)`);
  });
  duplicates(events.map((event) => event.id)).forEach((id) => errors.push(`events: id repetido ${id}`));
};

const checkRegulationsAgainstData = (pack, errors) => {
  const { regulations, calendar, entries, teams } = pack;

  const usedSuppliers = [...new Set(entries.map((entry) => entry.tyreSupplier))].sort();
  if (!sameJson(usedSuppliers, [...regulations.tyreSuppliers].sort())) {
    errors.push(`regulations.tyreSuppliers ${JSON.stringify(regulations.tyreSuppliers)} no coincide con los inscritos ${JSON.stringify(usedSuppliers)}`);
  }
  calendar.forEach((race) => {
    if (!regulations.qualifyingFormats.includes(race.qualifyingFormat)) {
      errors.push(`calendar: la ronda ${race.round} usa clasificación ${race.qualifyingFormat}, no declarada en regulations.qualifyingFormats`);
    }
  });
  const sprints = calendar.filter((race) => race.sprint).length;
  if (sprints !== regulations.sprintWeekends) errors.push(`regulations.sprintWeekends = ${regulations.sprintWeekends} pero el calendario tiene ${sprints}`);

  teams.forEach((team) =>
    team.engines.forEach((engine) => {
      if (!regulations.engineFormulas.includes(engine.formula)) {
        errors.push(`teams: el motor ${engine.id} de ${team.id} es ${engine.formula}, fuera de ${JSON.stringify(regulations.engineFormulas)}`);
      }
    })
  );
};

/** A season total under the dropped-scores rules: best N, or best N of each block of rounds (1976). */
const counted = (byRound, scheme, lastRound) => {
  const best = (values, n) => [...values].sort((a, b) => b - a).slice(0, n).reduce((sum, value) => sum + value, 0);
  const span = (from, to) => Array.from({ length: to - from + 1 }, (_, index) => byRound[from + index] || 0);
  if (scheme.bestResultsSplit) return scheme.bestResultsSplit.reduce((sum, block) => sum + best(span(block.fromRound, block.toRound), block.best), 0);
  if (scheme.bestResults) return best(span(1, lastRound), scheme.bestResults);
  return Object.values(byRound).reduce((sum, value) => sum + value, 0);
};

/**
 * What the drivers' and constructors' tables must say, from the pack's own
 * results and rules: race and sprint points, best car only, dropped scores
 * (for the constructors only when `dropScoresConstructors`), adjustments.
 */
export const standingsFromResults = (pack) => {
  const scheme = pack.regulations.pointsScheme;
  const lastRound = pack.calendar.length;
  const drivers = {};
  const teams = {};
  const add = (table, id, round, points, keepBest = false) => {
    const row = (table[id] ||= {});
    row[round] = keepBest ? Math.max(row[round] || 0, points) : (row[round] || 0) + points;
  };
  pack.realResults.forEach((result) => {
    add(drivers, result.driverId, result.round, result.points);
    add(teams, result.teamId, result.round, result.points, scheme.constructorsBestCarOnly);
  });
  pack.sprintResults.forEach((result) => {
    add(drivers, result.driverId, result.round, result.points);
    add(teams, result.teamId, result.round, result.points);
  });
  const teamScheme = scheme.dropScoresConstructors ? scheme : { ...scheme, bestResults: null, bestResultsSplit: null };
  const totals = {
    drivers: Object.fromEntries(Object.entries(drivers).map(([id, byRound]) => [id, counted(byRound, scheme, lastRound)])),
    constructors: Object.fromEntries(Object.entries(teams).map(([id, byRound]) => [id, counted(byRound, teamScheme, lastRound)])),
  };
  pack.standingsAdjustments.forEach((adjustment) => {
    totals[adjustment.table][adjustment.id] = (totals[adjustment.table][adjustment.id] || 0) + adjustment.points;
  });
  return totals;
};

const checkPoints = (pack, errors) => {
  const { pointsScheme } = pack.regulations;
  const lastRound = pack.calendar.length;
  const factor = Object.fromEntries(pack.calendar.map((race) => [race.round, race.pointsFactor]));
  if (pointsScheme.doubleLastRace !== (factor[lastRound] === 2)) {
    errors.push(`points: doubleLastRace = ${pointsScheme.doubleLastRace} pero la última ronda tiene factor ${factor[lastRound]}`);
  }
  pack.realResults.forEach((result) => {
    let expected = 0;
    if (result.position !== null && result.position <= pointsScheme.race.length) expected = pointsScheme.race[result.position - 1];
    if (result.position !== null && result.fastestLap && pointsScheme.fastestLap && result.position <= 10) expected += pointsScheme.fastestLap;
    expected *= factor[result.round] ?? 1;
    if (Math.abs(result.points - expected) > 1e-9) {
      errors.push(`points: ${result.driverId} en la ronda ${result.round} tiene ${result.points} y el esquema da ${expected}`);
    }
  });
  pack.sprintResults.forEach((result) => {
    const expected = result.position !== null && result.position <= pointsScheme.sprint.length ? pointsScheme.sprint[result.position - 1] : 0;
    if (Math.abs(result.points - expected) > 1e-9) {
      errors.push(`points: ${result.driverId} en el sprint de la ronda ${result.round} tiene ${result.points} y el esquema da ${expected}`);
    }
  });

  const totals = standingsFromResults(pack);
  [
    ["drivers", "driverId"],
    ["constructors", "teamId"],
  ].forEach(([table, key]) =>
    pack.standings[table].forEach((row) => {
      const total = totals[table][row[key]] || 0;
      if (Math.abs(total - row.points) > 1e-9) {
        errors.push(`standings: ${row[key]} suma ${total} con el reglamento del año y la tabla dice ${row.points}`);
      }
    }),
  );
};

const checkProvenance = (pack, errors, warnings) => {
  Object.keys(pack.regulations).forEach((field) => {
    const provenance = pack.regulationsProvenance[field];
    if (!provenance) errors.push(`regulationsProvenance: falta la procedencia de ${field}`);
    else if (provenance.status === "source" && !provenance.url) errors.push(`regulationsProvenance: ${field} dice 'source' sin url`);
    else if (provenance.status === "pending") warnings.push(`regulations.${field}: pendiente de verificar contra el reglamento FIA`);
  });
};

/** Does a decade release (`coches-80s`) cover the year? */
const decadeCovers = (release, year) => {
  const match = /coches-(\d)0s\b/.exec(release);
  if (!match) return false;
  const digit = Number(match[1]);
  const start = (digit >= 5 ? 1900 : 2000) + digit * 10;
  return year >= start && year <= start + 9;
};

const checkAssets = (pack, errors) => {
  pack.teams.forEach((team) => {
    const named = team.car && (team.car.release.includes(String(pack.year)) || team.car.file.includes(String(pack.year)));
    // A decade release only proves the decade: the curated entry (car-assets.json) vouches for the year.
    if (team.car && !named && !decadeCovers(team.car.release, pack.year)) {
      errors.push(`teams: el GLB ${team.car.file} de ${team.id} no es de ${pack.year}`);
    }
  });
};

/** Validate a season pack. `options.rules` lets tests pass a different era table. */
export const validateSeasonPack = (pack, options = {}) => {
  const errors = [];
  const warnings = [];
  if (!validateShape(pack)) {
    validateShape.errors.forEach((error) => errors.push(`schema: ${error.instancePath || "/"} ${error.message}`));
    return { ok: false, errors, warnings };
  }
  checkEra(pack, errors, options.rules);
  checkReferences(pack, errors);
  checkRegulationsAgainstData(pack, errors);
  checkPoints(pack, errors);
  checkProvenance(pack, errors, warnings);
  checkAssets(pack, errors);
  return { ok: errors.length === 0, errors, warnings };
};

export default validateSeasonPack;
