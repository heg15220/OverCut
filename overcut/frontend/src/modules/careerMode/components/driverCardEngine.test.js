import {
  prepareCareerBootstrap,
  createCareerSeason,
  simulateCareerRace,
  engineInputsFromProfile,
  evaluateSeason,
} from "./careerModeEngine";
import { createDriverCard, computeOverall } from "./driverCard";

const cardProfile = (overrides = {}) => {
  const card = { ...createDriverCard(), ...(overrides.card || {}) };
  return {
    name: "Player",
    helmetColor: "#123456",
    reputation: 40,
    seasons: 0,
    status: "rookie",
    age: 18,
    card,
    cardXp: { pace: 0, racecraft: 0, awareness: 0, experience: 0 },
    overall: computeOverall(card),
    rating: computeOverall(card),
    stats: { points: 0, wins: 0, podiums: 0, titles: 0, teams: [] },
    ...overrides,
  };
};

describe("engineInputsFromProfile", () => {
  test("derives the engine rating from the card overall and exposes attributes", () => {
    const profile = cardProfile();
    const inputs = engineInputsFromProfile(profile);
    expect(inputs.rating).toBe(profile.overall);
    expect(inputs.pace).toBe(profile.card.pace);
    expect(inputs.awareness).toBe(profile.card.awareness);
    expect(inputs.consistency).toBeGreaterThan(0);
    expect(inputs.aggression).toBeGreaterThan(0);
  });

  test("falls back for a legacy profile that only has a flat rating", () => {
    const inputs = engineInputsFromProfile({ rating: 70 });
    expect(inputs.rating).toBe(70);
    expect(inputs.pace).toBe(70);
    expect(inputs.awareness).toBe(70);
  });
});

describe("simulateCareerRace with a card profile", () => {
  const bootstrap = prepareCareerBootstrap({
    decades: [{ key: "2010s", label: "2010s", from: 2010, to: 2019 }],
    seasonYears: [2010],
    teamsByDecade: {
      "2010s": [
        { name: "Williams", rating: 72, firstYear: 2010, lastYear: 2010, decade: "2010s" },
        { name: "Ferrari", rating: 95, firstYear: 2010, lastYear: 2010, decade: "2010s" },
      ],
    },
    driversByDecade: { "2010s": [{ name: "X", rating: 70, firstYear: 2010, lastYear: 2010, decade: "2010s" }] },
    racesByYear: { "2010": [{ round: 1, name: "Race A" }] },
    lineupsByYear: {
      "2010": [
        { id: "williams", team: "Williams", rating: 72, races: 1, drivers: [{ name: "Rubens Barrichello", rating: 78, races: 1 }, { name: "Nico Hulkenberg", rating: 75, races: 1 }] },
        { id: "ferrari", team: "Ferrari", rating: 95, races: 1, drivers: [{ name: "Felipe Massa", rating: 80, races: 1 }, { name: "Fernando Alonso", rating: 92, races: 1 }] },
      ],
    },
  });
  const contract = { id: "c", team: { name: "Williams", rating: 72, color: "#0090ff" }, objectives: {}, duration: 1 };

  test("exposes wetLevel for the XP analysis and still returns the team-mate", () => {
    const profile = cardProfile();
    const season = createCareerSeason({ bootstrap, profile, year: 2010, contract });
    const result = simulateCareerRace({ season, raceIndex: 0, profile });
    expect(typeof result.wetLevel).toBe("number");
    expect(result.wetLevel).toBeGreaterThanOrEqual(0);
    expect(result.teammate).not.toBeNull();
  });
});

describe("evaluateSeason ages the driver and leaves rating to the card", () => {
  const season = {
    year: 2010,
    contract: { team: { name: "Williams" }, objectives: { points: 30, minimumPoints: 8, constructorPosition: 8, reputationBonus: 8 } },
    grid: [{ name: "Williams", drivers: [{ name: "Player", isPlayer: true }, { name: "Mate" }] }],
    driverStandings: [
      { id: "career-player", name: "Player", team: "Williams", isPlayer: true, points: 24, position: 5 },
      { id: "Mate-Williams", name: "Mate", team: "Williams", isPlayer: false, points: 12, position: 8 },
    ],
    constructorStandings: [{ name: "Williams", position: 6, points: 36 }],
    completedRaces: [],
  };

  test("increments age and keeps the card-derived rating untouched", () => {
    const profile = cardProfile({ age: 20 });
    const evaluation = evaluateSeason({ season, profile });
    expect(evaluation.nextProfile.age).toBe(21);
    expect(evaluation.nextProfile.rating).toBe(profile.overall);
    expect(evaluation.nextProfile.card).toEqual(profile.card);
  });

  test("applies late-career pace decline when aging into 41", () => {
    const card = { pace: 96, racecraft: 94, awareness: 92, experience: 82 };
    const profile = cardProfile({ age: 40, card, overall: computeOverall(card), rating: computeOverall(card) });
    const evaluation = evaluateSeason({ season, profile });
    expect(evaluation.nextProfile.age).toBe(41);
    expect(evaluation.nextProfile.card.pace).toBeLessThan(card.pace);
    expect(evaluation.nextProfile.card.racecraft).toBe(card.racecraft);
    expect(evaluation.nextProfile.rating).toBe(computeOverall(evaluation.nextProfile.card));
  });
});
