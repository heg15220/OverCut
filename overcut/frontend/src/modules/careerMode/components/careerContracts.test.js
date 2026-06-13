import { fallbackBootstrap } from "../../overcutRacing/components/fallbackData";
import {
  prepareCareerBootstrap,
  generateContracts,
  buildContractObjectives,
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
});
