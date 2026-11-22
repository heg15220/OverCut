/**
 * RF-INB-01: the typed effects of each answer to a dilemma, shown before the
 * player picks it. They mirror the branches in engine/events.js: which kind of
 * thing moves (money, morale, the board's confidence, the car, deadlines) and in
 * which direction. Only amounts the event already carries (its params) are
 * printed; the engine's balance numbers stay in the engine (RNF-07), so a
 * branch that rolls a die says "uncertain" rather than a percentage.
 *
 * effect: { type, dir: 1 | -1 | 0, amount?, who? }
 *   type: money | morale | confidence | car | reliability | facility | fans |
 *         target | uncertain | deadline | departure | scouting | role
 */

const M = (amount) => ({ type: "money", dir: amount >= 0 ? 1 : -1, amount: Math.abs(amount) });

const TABLE = {
  "sponsor-offer": {
    accept: (p) => [{ type: "money", dir: 1, amount: p.amount, perRace: true }],
    negotiate: (p) => [{ type: "money", dir: 1, amount: Math.round(p.amount * 1.3), perRace: true }, { type: "uncertain", dir: 0 }],
    decline: () => [],
  },
  "driver-role": {
    equal: (p) => [{ type: "role", dir: 0 }, { type: "morale", dir: 1, who: p.driverId }, { type: "morale", dir: -1, who: p.otherId }],
    promise: (p) => [{ type: "morale", dir: 1, who: p.driverId }, { type: "deadline", dir: 0 }],
    keep: (p) => [{ type: "morale", dir: -1, who: p.driverId }],
  },
  "poach-staff": {
    counter: (p) => [{ type: "money", dir: -1, amount: p.raise, perYear: true }],
    release: () => [{ type: "money", dir: 1 }, { type: "departure", dir: -1, staff: true }],
  },
  "rule-clarification": {
    comply: (p) => [{ type: "car", dir: -1, area: p.area }],
    appeal: (p) => [M(-p.cost), { type: "uncertain", dir: 0 }],
  },
  "press-criticism": {
    back: (p) => [{ type: "morale", dir: 1, who: p.driverId }, { type: "confidence", dir: -1 }],
    fine: (p) => [{ type: "morale", dir: -1, who: p.driverId }, { type: "confidence", dir: 1 }],
  },
  "supplier-price": {
    pay: (p) => [M(-p.cost)],
    refuse: () => [{ type: "reliability", dir: -1 }],
  },
  "facility-upgrade": {
    invest: (p) => [M(-p.cost), { type: "facility", dir: 1 }],
    later: () => [],
  },
  "junior-test": {
    test: (p) => [M(-p.cost), { type: "scouting", dir: 1, who: p.driverId }],
    skip: () => [],
  },
  "fan-day": {
    host: (p) => [M(p.income), { type: "fans", dir: 1 }, { type: "morale", dir: -1 }],
    skip: () => [],
  },
  "reliability-scare": {
    rebuild: (p) => [M(-p.cost), { type: "reliability", dir: 1 }],
    ignore: () => [],
  },
  "poach-driver": {
    sell: (p) => [M(p.fee), { type: "departure", dir: -1, who: p.driverId }],
    refuse: (p) => [{ type: "morale", dir: -1, who: p.driverId }],
  },
  investor: {
    accept: (p) => [M(p.amount), { type: "target", dir: -1 }],
    decline: () => [],
  },
  "driver-unhappy": {
    talk: (p) => [{ type: "morale", dir: 1, who: p.driverId }, { type: "uncertain", dir: 0 }],
    release: (p) => [{ type: "departure", dir: -1, who: p.driverId }],
  },
};

/** The effects of one option of an event, or [] when nothing measurable changes. */
export const effectsOf = (event, option) => {
  const branch = TABLE[event?.template]?.[option];
  return branch ? branch(event.params || {}) : [];
};

export const EFFECT_TEMPLATES = Object.keys(TABLE);
