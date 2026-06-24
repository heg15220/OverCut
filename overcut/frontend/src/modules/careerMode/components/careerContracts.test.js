import { fallbackBootstrap } from "../../overcutRacing/components/fallbackData";
import {
  prepareCareerBootstrap,
  createCareerSeason,
  generateContracts,
  buildContractObjectives,
  realTeamsForYear,
  maxOfferRatingForProfile,
  sillySeasonMarketWindow,
} from "./careerModeEngine";

const MODERN = { years: "2010-2018", points: [25, 18, 15, 12, 10, 8, 6, 4, 2, 1], fastestLap: 0 };
const SIXTIES = { years: "1963-1964", points: [9, 6, 4, 3, 2, 1], fastestLap: 0 };

// Synthetic 11-team field with ratings spread 60..90.
const FIELD = Array.from({ length: 11 }, (_, i) => ({ name: `Team ${i}`, rating: 90 - i * 3 }));
const topTeam = FIELD[0]; // rating 90
const midTeam = FIELD[5]; // rating 75
const backTeam = FIELD[10]; // rating 60

describe("buildContractObjectives is realistic for the era and the team", () => {
  test("points scale with the era's scoring system", () => {
    const modern = buildContractObjectives({ team: midTeam, field: FIELD, scoring: MODERN, raceCount: 20 });
    const sixties = buildContractObjectives({ team: midTeam, field: FIELD, scoring: SIXTIES, raceCount: 20 });
    // A 25-points-for-a-win era must demand more points than a 9-point era.
    expect(modern.points).toBeGreaterThan(sixties.points);
  });

  test("no objective asks for more points than a perfect lead-car season", () => {
    [MODERN, SIXTIES].forEach((scoring) => {
      FIELD.forEach((team) => {
        const objective = buildContractObjectives({ team, field: FIELD, scoring, raceCount: 18 });
        expect(objective.points).toBeGreaterThanOrEqual(1);
        expect(objective.points).toBeLessThanOrEqual(scoring.points[0] * 18);
      });
    });
  });

  test("better teams get more demanding objectives", () => {
    const top = buildContractObjectives({ team: topTeam, field: FIELD, scoring: MODERN, raceCount: 20 });
    const back = buildContractObjectives({ team: backTeam, field: FIELD, scoring: MODERN, raceCount: 20 });
    expect(top.points).toBeGreaterThan(back.points);
    expect(top.constructorPosition).toBeLessThan(back.constructorPosition);
  });

  test("a backmarker is never asked to reach the top of the constructors", () => {
    const back = buildContractObjectives({ team: backTeam, field: FIELD, scoring: MODERN, raceCount: 20 });
    expect(back.constructorPosition).toBeGreaterThanOrEqual(7);
    expect(back.constructorPosition).toBeLessThanOrEqual(10);
  });

  test("real constructor points set a lead-driver target, not the firing minimum", () => {
    const objective = buildContractObjectives({
      team: { ...midTeam, realConstructorPoints: 100, realConstructorPosition: 5, scaledRealConstructorPosition: 5 },
      field: FIELD,
      scoring: MODERN,
      raceCount: 20,
    });

    expect(objective.points).toBe(44);
    expect(objective.minimumPoints).toBe(19);
    expect(objective.minimumPoints).toBeLessThan(objective.points);
    expect(objective.objectiveSource).toBe("realConstructorPoints");
  });

  test("zero-point real teams still get a small target instead of a free season", () => {
    const objective = buildContractObjectives({
      team: { ...backTeam, realConstructorPoints: 0, realConstructorPosition: 10, scaledRealConstructorPosition: 10 },
      field: FIELD,
      scoring: MODERN,
      raceCount: 20,
    });

    expect(objective.points).toBeGreaterThanOrEqual(1);
    expect(objective.points).toBeLessThanOrEqual(4);
    expect(objective.minimumPoints).toBeLessThanOrEqual(objective.points);
  });
});

describe("real-season competitiveness feeds contracts", () => {
  const bootstrap = prepareCareerBootstrap({
    decades: [{ key: "2010s", label: "2010s", from: 2010, to: 2019 }],
    seasonYears: [2010],
    teamsByDecade: {},
    driversByDecade: {},
    racesByYear: { "2010": Array.from({ length: 20 }, (_, index) => ({ round: index + 1, name: `Race ${index + 1}` })) },
    constructorStandingsByYear: {
      "2010": [
        { team: "Fast", position: 1, points: 500 },
        { team: "Mid", position: 5, points: 80 },
        { team: "Slow", position: 10, points: 0 },
      ],
    },
    lineupsByYear: {
      "2010": [
        { id: "fast", team: "Fast", rating: 58, races: 20, drivers: [{ name: "A", rating: 80, races: 20 }] },
        { id: "mid", team: "Mid", rating: 90, races: 20, drivers: [{ name: "B", rating: 78, races: 20 }] },
        { id: "slow", team: "Slow", rating: 90, races: 20, drivers: [{ name: "C", rating: 72, races: 20 }] },
      ],
    },
  });

  test("season rating follows real constructor performance more than historical rating", () => {
    const teams = realTeamsForYear(bootstrap, 2010);
    const fast = teams.find((team) => team.name === "Fast");
    const slow = teams.find((team) => team.name === "Slow");

    expect(fast.rating).toBeGreaterThan(slow.rating);
    expect(fast.historicalRating).toBeLessThan(slow.historicalRating);
    expect(slow.scaledRealConstructorPosition).toBe(10);
  });
});

describe("generated contracts stay within realistic bounds across decades", () => {
  const bootstrap = prepareCareerBootstrap(fallbackBootstrap, true);
  const profile = {
    name: "Realism Tester",
    rating: 60,
    reputation: 30,
    status: "rookie",
    consistency: 58,
    aggression: 55,
    seasons: 0,
    stats: { points: 0, wins: 0, podiums: 0, titles: 0, teams: [] },
  };

  test("constructor targets and points are bounded and ordered by car strength", () => {
    (bootstrap.seasonYears || []).forEach((year) => {
      const contracts = generateContracts({ bootstrap, year, playerProfile: profile });
      contracts.forEach((contract) => {
        expect(contract.objectives.constructorPosition).toBeGreaterThanOrEqual(1);
        expect(contract.objectives.constructorPosition).toBeLessThanOrEqual(10);
        expect(contract.objectives.points).toBeGreaterThanOrEqual(1);
      });
      // Within an offer set, a stronger car never has a softer constructor target.
      const orderingBreaks = [];
      for (let i = 0; i < contracts.length; i += 1) {
        for (let j = 0; j < contracts.length; j += 1) {
          const stronger = contracts[i];
          const weaker = contracts[j];
          if (
            stronger.team.rating > weaker.team.rating &&
            stronger.objectives.constructorPosition > weaker.objectives.constructorPosition
          ) {
            orderingBreaks.push(`${stronger.team.name} (${stronger.team.rating}) softer than ${weaker.team.name}`);
          }
        }
      }
      expect(orderingBreaks).toEqual([]);
    });
  });

  test("drivers below 75 rating cannot receive offers above 78-rated teams", () => {
    const bootstrap = prepareCareerBootstrap({
      decades: [{ key: "2010s", label: "2010s", from: 2010, to: 2019 }],
      seasonYears: [2010],
      teamsByDecade: {
        "2010s": [
          { name: "Backmarker", rating: 66, firstYear: 2010, lastYear: 2010, decade: "2010s" },
          { name: "Lower Mid", rating: 74, firstYear: 2010, lastYear: 2010, decade: "2010s" },
          { name: "Upper Mid", rating: 78, firstYear: 2010, lastYear: 2010, decade: "2010s" },
          { name: "Top Team", rating: 91, firstYear: 2010, lastYear: 2010, decade: "2010s" },
        ],
      },
      driversByDecade: { "2010s": [] },
      racesByYear: { "2010": [{ round: 1, name: "Race A" }] },
    });
    const lowRatedProfile = { ...profile, rating: 74, overall: 74, reputation: 95, status: "estrella" };
    const contracts = generateContracts({ bootstrap, year: 2010, playerProfile: lowRatedProfile });

    expect(maxOfferRatingForProfile(lowRatedProfile)).toBe(78);
    expect(contracts.length).toBeGreaterThan(0);
    expect(contracts.every((contract) => contract.team.rating <= 78)).toBe(true);
  });
});

describe("contract offers display the same team-mate used by the simulation", () => {
  const baseProfile = {
    name: "Realism Tester",
    rating: 60,
    reputation: 30,
    status: "rookie",
    consistency: 58,
    aggression: 55,
    seasons: 0,
    stats: { points: 0, wins: 0, podiums: 0, titles: 0, teams: [] },
  };

  const bootstrap = prepareCareerBootstrap({
    decades: [{ key: "2010s", label: "2010s", from: 2010, to: 2019 }],
    seasonYears: [2010, 2011],
    teamsByDecade: {
      "2010s": [
        { name: "Current", rating: 72, firstYear: 2010, lastYear: 2011, decade: "2010s" },
        { name: "Target", rating: 84, firstYear: 2010, lastYear: 2011, decade: "2010s" },
      ],
    },
    driversByDecade: { "2010s": [] },
    racesByYear: {
      "2010": Array.from({ length: 10 }, (_, index) => ({ round: index + 1, name: `Race ${index + 1}` })),
      "2011": Array.from({ length: 10 }, (_, index) => ({ round: index + 1, name: `Race ${index + 1}` })),
    },
    lineupsByYear: {
      "2010": [
        { id: "current", team: "Current", rating: 72, races: 10, drivers: [{ name: "Current Mate", rating: 76, races: 10 }] },
        { id: "target", team: "Target", rating: 84, races: 10, drivers: [{ name: "Old Seat Holder", rating: 50, races: 10 }, { name: "Future Sim Mate", rating: 85, races: 10 }] },
      ],
      "2011": [
        { id: "current", team: "Current", rating: 72, races: 10, drivers: [{ name: "Current Mate", rating: 76, races: 10 }] },
        { id: "target", team: "Target", rating: 84, races: 10, drivers: [{ name: "Old Seat Holder", rating: 50, races: 10 }, { name: "Future Sim Mate", rating: 85, races: 10 }] },
      ],
    },
  });

  const veteranProfile = {
    ...baseProfile,
    name: "Contract Matcher",
    rating: 82,
    overall: 82,
    reputation: 80,
    status: "promesa",
    seasons: 1,
    stats: { ...baseProfile.stats, teams: ["Current"] },
  };

  const teammateFromSeason = (season, teamName) =>
    season.grid.find((team) => team.name === teamName)?.drivers.find((driver) => !driver.isPlayer);

  test("final-season contracts name the market-grid team-mate", () => {
    const contracts = generateContracts({ bootstrap, year: 2011, playerProfile: veteranProfile });
    const target = contracts.find((contract) => contract.team.name === "Target");
    const season = createCareerSeason({ bootstrap, profile: veteranProfile, year: 2011, contract: target });
    const simulatedTeammate = teammateFromSeason(season, "Target");

    expect(target.teammate.name).toBe(simulatedTeammate.name);
    expect(target.teammate.rating).toBe(simulatedTeammate.rating);
    expect(target.team.drivers[0].name).toBe(simulatedTeammate.name);
  });

  test("precontracts forecast the next-season team-mate, not the current real lead driver", () => {
    const rookieProfile = {
      ...baseProfile,
      name: "Ayrton Test",
      rating: 88,
      overall: 88,
      reputation: 99,
      status: "estrella",
    };
    const currentSeason = {
      year: 2010,
      contract: {
        team: { name: "Current", rating: 72, color: "#0090ff" },
        objectives: { points: 20, minimumPoints: 5, constructorPosition: 5, reputationBonus: 8 },
      },
      races: Array.from({ length: 10 }, (_, index) => ({ round: index + 1, completed: index < 5 })),
      completedRaces: Array.from({ length: 5 }, (_, index) => ({ race: { name: `Race ${index + 1}` } })),
      grid: [{ name: "Current", drivers: [{ name: "Ayrton Test", isPlayer: true }, { name: "Current Mate" }] }],
      driverStandings: [
        { id: "career-player", name: "Ayrton Test", team: "Current", isPlayer: true, points: 60, wins: 1, podiums: 3, position: 2 },
        { id: "Current Mate-Current", name: "Current Mate", team: "Current", isPlayer: false, points: 6, wins: 0, podiums: 0, position: 12 },
      ],
      constructorStandings: [{ name: "Current", position: 2, points: 66 }],
    };

    const market = sillySeasonMarketWindow({ bootstrap, season: currentSeason, profile: rookieProfile });
    expect(market).not.toBeNull();
    const offer = market.offers.find((contract) => contract.team.name === "Target");
    const nextProfile = {
      ...rookieProfile,
      seasons: 1,
      stats: { ...rookieProfile.stats, teams: ["Current"] },
    };
    const season = createCareerSeason({ bootstrap, profile: nextProfile, year: offer.targetYear, contract: offer });
    const simulatedTeammate = teammateFromSeason(season, "Target");

    expect(offer.teammate.name).toBe(simulatedTeammate.name);
    expect(offer.teammate.rating).toBe(simulatedTeammate.rating);
    expect(offer.teammate.name).toBe("Future Sim Mate");
  });
});
