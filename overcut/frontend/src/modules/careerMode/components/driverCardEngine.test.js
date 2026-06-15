import {
  prepareCareerBootstrap,
  createCareerSeason,
  generateContracts,
  simulateCareerRace,
  engineInputsFromProfile,
  evaluateSeason,
  sillySeasonMarketWindow,
} from "./careerModeEngine";
import { createDriverCard, computeOverall } from "./driverCard";
import { analyzeRaceXp } from "./driverCard";

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

  test("keeps the race feed coherent around neutralisations and retirements", () => {
    const profile = cardProfile({ name: "HEG" });
    const season = createCareerSeason({ bootstrap, profile, year: 2010, contract });
    const result = simulateCareerRace({ season, raceIndex: 0, profile });
    const activeNeutralisedLaps = new Set();
    for (let lap = 1; lap <= result.race.lapCount; lap += 1) {
      const state = result.conditions.neutralizations?.some(
        (period) => lap >= period.startLap && lap <= period.endLap
      );
      if (state) activeNeutralisedLaps.add(lap);
    }
    result.events.forEach((event) => {
      expect(event.text).not.toMatch(/1 posiciones/);
      const isPlayerAttack = event.type === "player" && /ataca|adelantamiento|se tira por dentro|por fuera/i.test(event.text);
      if (activeNeutralisedLaps.has(event.lap)) {
        expect(isPlayerAttack).toBe(false);
      }
    });
  });
});

describe("generateContracts real constructor objectives", () => {
  test("uses real constructor points as a lead-driver objective with a softer minimum", () => {
    const bootstrap = prepareCareerBootstrap({
      decades: [{ key: "2010s", label: "2010s", from: 2010, to: 2019 }],
      seasonYears: [2010],
      teamsByDecade: {
        "2010s": [
          { name: "Williams", rating: 72, firstYear: 2010, lastYear: 2010, decade: "2010s" },
          { name: "Lotus", rating: 61, firstYear: 2010, lastYear: 2010, decade: "2010s" },
        ],
      },
      driversByDecade: { "2010s": [] },
      racesByYear: { "2010": [{ round: 1, name: "Race A" }] },
      lineupsByYear: {
        "2010": [
          {
            id: "williams",
            team: "Williams",
            rating: 72,
            races: 19,
            points: 69,
            standingPosition: 6,
            drivers: [{ name: "Rubens Barrichello", rating: 78, races: 19 }],
          },
          {
            id: "lotus",
            team: "Lotus",
            rating: 61,
            races: 19,
            points: 0,
            standingPosition: 10,
            drivers: [{ name: "Jarno Trulli", rating: 70, races: 18 }],
          },
        ],
      },
    });
    const profile = cardProfile({ reputation: 76, status: "promesa" });
    const contracts = generateContracts({ bootstrap, year: 2010, playerProfile: profile });
    const williams = contracts.find((item) => item.team.name === "Williams");
    expect(williams.objectives.points).toBe(33);
    expect(williams.objectives.minimumPoints).toBe(14);
    expect(williams.objectives.constructorPosition).toBe(6);
    expect(williams.objectives.objectiveSource).toBe("realConstructorPoints");
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

describe("sillySeasonMarketWindow", () => {
  const bootstrap = prepareCareerBootstrap({
    decades: [{ key: "2010s", label: "2010s", from: 2010, to: 2019 }],
    seasonYears: [2010, 2011],
    teamsByDecade: {
      "2010s": [
        { name: "Lotus", rating: 61, firstYear: 2010, lastYear: 2011, decade: "2010s" },
        { name: "Williams", rating: 72, firstYear: 2010, lastYear: 2011, decade: "2010s" },
        { name: "Renault", rating: 80, firstYear: 2010, lastYear: 2011, decade: "2010s" },
        { name: "Mercedes", rating: 84, firstYear: 2010, lastYear: 2011, decade: "2010s" },
        { name: "Ferrari", rating: 94, firstYear: 2010, lastYear: 2011, decade: "2010s" },
      ],
    },
    driversByDecade: { "2010s": [] },
    racesByYear: {
      "2010": Array.from({ length: 10 }, (_, index) => ({ round: index + 1, name: `Race ${index + 1}` })),
      "2011": Array.from({ length: 10 }, (_, index) => ({ round: index + 1, name: `Race ${index + 1}` })),
    },
  });

  const marketSeason = (completedRaces) => ({
    year: 2010,
    contract: {
      team: { name: "Williams", rating: 72, color: "#0090ff" },
      objectives: { points: 20, minimumPoints: 5, constructorPosition: 5, reputationBonus: 8 },
    },
    races: Array.from({ length: 10 }, (_, index) => ({ round: index + 1, completed: index < completedRaces })),
    completedRaces: Array.from({ length: completedRaces }, (_, index) => ({ race: { name: `Race ${index + 1}` } })),
    grid: [{ name: "Williams", drivers: [{ name: "Player", isPlayer: true }, { name: "Mate" }] }],
    driverStandings: [
      { id: "career-player", name: "Player", team: "Williams", isPlayer: true, points: 28, wins: 1, podiums: 2, position: 4 },
      { id: "Mate-Williams", name: "Mate", team: "Williams", isPlayer: false, points: 6, wins: 0, podiums: 0, position: 12 },
    ],
    constructorStandings: [{ name: "Williams", position: 3, points: 34 }],
  });

  test("does not open outside the mid-season market rounds", () => {
    const profile = cardProfile({ reputation: 92, status: "estrella", rating: 85, overall: 85 });
    expect(sillySeasonMarketWindow({ bootstrap, season: marketSeason(2), profile })).toBeNull();
  });

  test("can create pre-contract offers for a standout driver", () => {
    const profile = cardProfile({ name: "Ayrton Test", reputation: 92, status: "estrella", rating: 88, overall: 88 });
    const market = sillySeasonMarketWindow({ bootstrap, season: marketSeason(5), profile });
    expect(market).not.toBeNull();
    expect(market.targetYear).toBe(2011);
    expect(market.offers.length).toBeGreaterThan(0);
    expect(market.offers[0].kind).toBe("precontract");
    expect(market.offers[0].team.name).not.toBe("Williams");
  });

  test("does not offer teams above 78 rating to a standout driver below 75 rating", () => {
    const profile = cardProfile({ name: "Low Rated Standout", reputation: 99, status: "estrella", rating: 74, overall: 74 });
    const market = sillySeasonMarketWindow({ bootstrap, season: marketSeason(5), profile });
    if (market) {
      expect(market.offers.every((offer) => offer.team.rating <= 78)).toBe(true);
    }
  });
});

describe("race XP breakthroughs", () => {
  const podiumResult = {
    playerResult: {
      team: "Backmarker",
      status: "FIN",
      position: 2,
      gridPosition: 14,
      fastestLap: false,
    },
    results: Array.from({ length: 20 }, (_, index) => ({
      position: index + 1,
      isPlayer: index === 1,
    })),
    conditions: { degradation: 0.5 },
    wetLevel: 0,
    teammate: { startingPosition: 16, finalPosition: 11 },
  };

  test("podium with a low-rating car heavily boosts post-race XP", () => {
    const lowCarSeason = { grid: [{ name: "Backmarker", rating: 66 }] };
    const midCarSeason = { grid: [{ name: "Backmarker", rating: 80 }] };
    const profile = cardProfile();

    const lowCarXp = analyzeRaceXp(podiumResult, lowCarSeason, profile);
    const midCarXp = analyzeRaceXp(podiumResult, midCarSeason, profile);

    expect(lowCarXp.lowCarPodiumBonus).toBe(1.75);
    expect(lowCarXp.pace).toBeGreaterThan(midCarXp.pace * 1.5);
    expect(lowCarXp.experience).toBeGreaterThan(midCarXp.experience);
  });
});
