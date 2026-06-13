import { applyFinalTitleShock, finalTitleShockPlan } from "./racingEngine";

const scoringSystem = {
  points: [25, 18, 15, 12, 10, 8, 6, 4, 2, 1],
  fastestLap: 1,
};

const contenders = [
  { id: "p1", name: "Leader", team: "A", points: 100 },
  { id: "p2", name: "Second", team: "B", points: 96 },
  { id: "p3", name: "Third", team: "C", points: 74 },
  { id: "p4", name: "Fourth", team: "D", points: 73 },
];

const entrant = (id, score) => ({
  id,
  score,
  dnf: false,
  driver: { name: id.toUpperCase() },
  team: { name: `Team ${id}` },
});

describe("finalTitleShockPlan", () => {
  test("creates a last-race shock when third/fourth need leader collapses", () => {
    const rng = jest.fn()
      .mockReturnValueOnce(0.01) // trigger below chance
      .mockReturnValueOnce(0.0) // pick first shockable target
      .mockReturnValueOnce(0.95) // no double shock
      .mockReturnValueOnce(0.1); // DNF kind
    const plan = finalTitleShockPlan({ finalRoundContenders: contenders, scoringSystem, rng });
    expect(plan).not.toBeNull();
    expect(plan.kind).toBe("dnf");
    expect(plan.targets).toEqual(["p1"]);
    expect(plan.outsiderIds).toEqual(["p3", "p4"]);
  });

  test("does not force a shock when outsiders can win without a collapse", () => {
    const closeContenders = [
      { ...contenders[0], points: 100 },
      { ...contenders[1], points: 96 },
      { ...contenders[2], points: 88 },
    ];
    const plan = finalTitleShockPlan({
      finalRoundContenders: closeContenders,
      scoringSystem,
      rng: () => 0,
    });
    expect(plan).toBeNull();
  });
});

describe("applyFinalTitleShock", () => {
  test("can turn a leading title contender into a DNF", () => {
    const scored = [entrant("p1", 100), entrant("p2", 96), entrant("p3", 91)];
    const result = applyFinalTitleShock({
      scored,
      plan: { kind: "dnf", targets: ["p1"] },
      scoringSystem,
      rng: () => 0,
    });
    expect(result.find((entry) => entry.id === "p1").dnf).toBe(true);
    expect(result.find((entry) => entry.id === "p1").titleShock).toBe("dnf");
  });

  test("can apply a non-DNF shock that drops score heavily", () => {
    const scored = [entrant("p1", 100), entrant("p2", 96), entrant("p3", 91)];
    const result = applyFinalTitleShock({
      scored,
      plan: { kind: "strategy", targets: ["p2"] },
      scoringSystem,
      rng: () => 0,
    });
    const shocked = result.find((entry) => entry.id === "p2");
    expect(shocked.dnf).toBe(false);
    expect(shocked.titleShock).toBe("strategy");
    expect(shocked.score).toBeLessThan(70);
  });
});
