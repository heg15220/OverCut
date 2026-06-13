import {
  createDriverCard,
  computeOverall,
  ageGrowthMultiplier,
  attributeGrowthMultiplier,
  xpForNextPoint,
  analyzeRaceXp,
  applyRaceXp,
  applySeasonAging,
} from "./driverCard";

const season = {
  grid: [
    { name: "Ferrari", rating: 95, drivers: [{ name: "A" }, { name: "B" }] },
    { name: "Mercedes", rating: 90, drivers: [{ name: "C" }, { name: "D" }] },
    { name: "Williams", rating: 72, drivers: [{ name: "Player", isPlayer: true }, { name: "Mate" }] },
    { name: "Sauber", rating: 65, drivers: [{ name: "E" }, { name: "F" }] },
  ],
};

// Minimal race-result shape consumed by analyzeRaceXp. Williams is expected to
// finish ~P5 (third-best car, lead seat ~2k-1).
const raceResult = (overrides = {}) => {
  const { playerResult: playerOverride, ...rest } = overrides;
  const playerResult = {
    team: "Williams",
    isPlayer: true,
    position: 5,
    gridPosition: 6,
    status: "FIN",
    fastestLap: false,
    ...(playerOverride || {}),
  };
  return {
    startingPosition: playerResult.gridPosition,
    playerResult,
    results: Array.from({ length: 8 }, (_, index) => ({ position: index + 1, team: "x", isPlayer: false })),
    conditions: { degradation: 0.3 },
    wetLevel: 0,
    teammate: { startingPosition: 7, finalPosition: 8 },
    ...rest,
  };
};

describe("computeOverall", () => {
  test("weights Pace the most and rounds", () => {
    expect(computeOverall({ pace: 58, racecraft: 56, awareness: 60, experience: 18 })).toBe(54);
    // Raising Pace moves the overall more than raising Experience by the same amount.
    const base = { pace: 60, racecraft: 60, awareness: 60, experience: 60 };
    const pacier = computeOverall({ ...base, pace: 70 });
    const wiser = computeOverall({ ...base, experience: 70 });
    expect(pacier).toBeGreaterThan(wiser);
  });
});

describe("createDriverCard", () => {
  test("starts as a young rookie around overall 55", () => {
    const card = createDriverCard();
    expect(card).toEqual({ pace: 58, racecraft: 56, awareness: 60, experience: 18 });
    expect(computeOverall(card)).toBeLessThan(60);
  });
});

describe("ageGrowthMultiplier", () => {
  test("peaks in the 28-33 prime window", () => {
    expect(ageGrowthMultiplier(18)).toBeLessThan(ageGrowthMultiplier(28));
    expect(ageGrowthMultiplier(30)).toBeCloseTo(1.12);
    expect(ageGrowthMultiplier(33)).toBeCloseTo(ageGrowthMultiplier(30));
    expect(ageGrowthMultiplier(41)).toBeLessThan(ageGrowthMultiplier(33));
  });

  test("keeps experience and racecraft more trainable than pace after the prime", () => {
    expect(attributeGrowthMultiplier(38, "experience")).toBeGreaterThan(attributeGrowthMultiplier(38, "pace"));
    expect(attributeGrowthMultiplier(38, "racecraft")).toBeGreaterThan(attributeGrowthMultiplier(38, "pace"));
  });
});

describe("xpForNextPoint", () => {
  test("costs more XP to improve a high attribute than a low one", () => {
    expect(xpForNextPoint(80)).toBeGreaterThan(xpForNextPoint(40));
  });
});

describe("analyzeRaceXp", () => {
  const profile = { age: 20 };

  test("rewards Racecraft for gaining positions", () => {
    const gained = analyzeRaceXp(raceResult({ playerResult: { gridPosition: 12, position: 4 } }), season, profile);
    const lost = analyzeRaceXp(raceResult({ playerResult: { gridPosition: 4, position: 12 } }), season, profile);
    expect(gained.racecraft).toBeGreaterThan(lost.racecraft);
  });

  test("gives almost no Awareness on a DNF", () => {
    const clean = analyzeRaceXp(raceResult(), season, profile);
    const dnf = analyzeRaceXp(raceResult({ playerResult: { status: "DNF", position: 8 } }), season, profile);
    expect(dnf.awareness).toBeLessThan(clean.awareness);
    expect(dnf.awareness).toBeLessThanOrEqual(1);
  });

  test("always awards Experience, even on a DNF", () => {
    const dnf = analyzeRaceXp(raceResult({ playerResult: { status: "DNF", position: 8 } }), season, profile);
    expect(dnf.experience).toBeGreaterThan(0);
  });

  test("gates performance XP on beating the car's expected finish", () => {
    const over = analyzeRaceXp(raceResult({ playerResult: { gridPosition: 6, position: 2 } }), season, profile);
    const under = analyzeRaceXp(raceResult({ playerResult: { gridPosition: 6, position: 8 } }), season, profile);
    expect(over.pace).toBeGreaterThan(under.pace);
  });

  test("adds a wet-weather bonus when overperforming in the rain", () => {
    const dry = analyzeRaceXp(raceResult({ playerResult: { position: 2 }, wetLevel: 0 }), season, profile);
    const wet = analyzeRaceXp(raceResult({ playerResult: { position: 2 }, wetLevel: 0.8 }), season, profile);
    expect(wet.pace).toBeGreaterThan(dry.pace);
  });
});

describe("applyRaceXp", () => {
  const card = { pace: 58, racecraft: 56, awareness: 60, experience: 18 };
  const cardXp = { pace: 0, racecraft: 0, awareness: 0, experience: 0 };
  const gains = { pace: 300, racecraft: 300, awareness: 300, experience: 300 };

  test("a young driver gains more than a veteran for the same performance", () => {
    const young = applyRaceXp(card, cardXp, gains, 18);
    const veteran = applyRaceXp(card, cardXp, gains, 40);
    const sum = (deltas) => Object.values(deltas).reduce((a, b) => a + b, 0);
    expect(sum(young.deltas)).toBeGreaterThan(sum(veteran.deltas));
  });

  test("never lowers an attribute and recomputes overall", () => {
    const result = applyRaceXp(card, cardXp, gains, 18);
    Object.keys(card).forEach((key) => expect(result.card[key]).toBeGreaterThanOrEqual(card[key]));
    expect(result.overall).toBe(computeOverall(result.card));
  });

  test("caps attributes at 99", () => {
    const maxed = { pace: 99, racecraft: 99, awareness: 99, experience: 99 };
    const result = applyRaceXp(maxed, cardXp, { pace: 99999, racecraft: 99999, awareness: 99999, experience: 99999 }, 18);
    expect(result.card).toEqual(maxed);
    expect(result.deltas).toEqual({ pace: 0, racecraft: 0, awareness: 0, experience: 0 });
  });

  test("zero XP produces no change", () => {
    const result = applyRaceXp(card, cardXp, { pace: 0, racecraft: 0, awareness: 0, experience: 0 }, 18);
    expect(result.card).toEqual(card);
    expect(result.deltas).toEqual({ pace: 0, racecraft: 0, awareness: 0, experience: 0 });
  });
});

describe("applySeasonAging", () => {
  test("does not reduce pace during the prime", () => {
    const prime = applySeasonAging({ pace: 96, racecraft: 92, awareness: 90, experience: 70 }, 33);
    expect(prime.deltas.pace).toBe(0);
    expect(prime.card.pace).toBe(96);
  });

  test("progressively lowers pace after the prime and recalculates overall", () => {
    const aged = applySeasonAging({ pace: 96, racecraft: 94, awareness: 92, experience: 82 }, 41);
    expect(aged.card.pace).toBeLessThan(96);
    expect(aged.deltas.pace).toBeLessThan(0);
    expect(aged.overall).toBe(computeOverall(aged.card));
  });
});
