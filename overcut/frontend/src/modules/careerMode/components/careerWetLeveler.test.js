import { fallbackBootstrap } from "../../overcutRacing/components/fallbackData";
import {
  prepareCareerBootstrap,
  generateContracts,
  createCareerSeason,
  simulateCareerRace,
  wetLevelFromPlan,
  levelledCarRating,
} from "./careerModeEngine";

describe("levelledCarRating compresses the car advantage in the wet", () => {
  const mean = 75;

  test("does nothing on a dry track", () => {
    expect(levelledCarRating(90, mean, 0)).toBe(90);
    expect(levelledCarRating(60, mean, 0)).toBe(60);
  });

  test("pulls strong and weak cars towards the mean without overshooting", () => {
    const strong = levelledCarRating(90, mean, 1);
    const weak = levelledCarRating(60, mean, 1);
    expect(strong).toBeLessThan(90);
    expect(strong).toBeGreaterThan(mean);
    expect(weak).toBeGreaterThan(60);
    expect(weak).toBeLessThan(mean);
  });

  test("preserves the ordering of the field", () => {
    const a = levelledCarRating(90, mean, 1);
    const b = levelledCarRating(75, mean, 1);
    const c = levelledCarRating(60, mean, 1);
    expect(a).toBeGreaterThan(b);
    expect(b).toBeGreaterThan(c);
  });
});

describe("wetLevelFromPlan measures how much of the race is wet", () => {
  const lapCount = 40;
  const plan = (phases) => ({ phases, scStart: null, scEnd: null, redFlagLap: null, rainArrivalLap: null, dryReturnLap: null });

  test("fully dry race", () => {
    expect(wetLevelFromPlan(plan([{ fromLap: 1, condition: "seco" }]), lapCount)).toBe(0);
  });

  test("fully wet race", () => {
    expect(wetLevelFromPlan(plan([{ fromLap: 1, condition: "lluvia" }]), lapCount)).toBe(1);
  });

  test("half-wet race lands around 0.5", () => {
    const level = wetLevelFromPlan(
      plan([
        { fromLap: 1, condition: "seco" },
        { fromLap: 21, condition: "lluvia" },
      ]),
      lapCount
    );
    expect(level).toBeGreaterThan(0.4);
    expect(level).toBeLessThan(0.6);
  });
});

describe("weaker teams finish better in the wet than in the dry", () => {
  const bootstrap = prepareCareerBootstrap(fallbackBootstrap, true);
  const baseProfile = (name) => ({
    name,
    helmetColor: "#123456",
    rating: 62,
    reputation: 34,
    consistency: 58,
    aggression: 58,
    seasons: 0,
    status: "rookie",
    stats: { points: 0, wins: 0, podiums: 0, titles: 0, teams: [] },
  });
  const NAMES = ["Wet A", "Wet B", "Wet C", "Wet D", "Wet E", "Wet F", "Wet G", "Wet H"];
  const SIM_CAP = 1400;

  // Average finishing position of the bottom-third (by car rating) of each race.
  const weakAverageFinish = (runs) => {
    let sum = 0;
    let count = 0;
    runs.forEach((run) => {
      const ratings = run.rows.map((row) => row.rating).sort((a, b) => a - b);
      const cutoff = ratings[Math.floor(ratings.length / 3)];
      run.rows.forEach((row) => {
        if (row.rating <= cutoff) {
          sum += row.position;
          count += 1;
        }
      });
    });
    return count ? sum / count : 0;
  };

  const dry = [];
  const wet = [];
  outer: for (const name of NAMES) {
    const profile = baseProfile(name);
    for (const year of bootstrap.seasonYears || []) {
      const contracts = generateContracts({ bootstrap, year, playerProfile: profile });
      if (!contracts.length) continue;
      const season = createCareerSeason({ bootstrap, profile, year, contract: contracts[0] });
      const ratingByTeam = new Map(season.grid.map((team) => [team.name, team.rating]));
      for (let raceIndex = 0; raceIndex < season.races.length; raceIndex += 1) {
        const result = simulateCareerRace({ season, raceIndex, profile });
        const level = wetLevelFromPlan(result.conditions, result.race.lapCount);
        const rows = result.results
          .map((row) => ({ position: row.position, rating: ratingByTeam.get(row.team) }))
          .filter((row) => Number.isFinite(row.rating));
        const run = { rows };
        if (level === 0) dry.push(run);
        else if (level > 0.3) wet.push(run);
        if (dry.length + wet.length >= SIM_CAP) break outer;
      }
    }
  }

  test("collected enough dry and wet races", () => {
    expect(dry.length).toBeGreaterThan(30);
    expect(wet.length).toBeGreaterThan(30);
  });

  test("bottom-third teams average a better finishing position when it rains", () => {
    expect(weakAverageFinish(wet)).toBeLessThan(weakAverageFinish(dry));
  });

  test("midfield cars do not turn safety-car track position into routine podiums", () => {
    const profile = {
      ...baseProfile("Midfield Reality"),
      rating: 72,
      reputation: 45,
      consistency: 64,
      aggression: 60,
    };
    const samples = [];
    outer: for (const year of bootstrap.seasonYears || []) {
      const contracts = generateContracts({ bootstrap, year, playerProfile: profile });
      const contract = contracts.find((item) => item.team.rating >= 76 && item.team.rating <= 84) || contracts[0];
      if (!contract) continue;
      const season = createCareerSeason({ bootstrap, profile, year, contract });
      for (let raceIndex = 0; raceIndex < season.races.length; raceIndex += 1) {
        const result = simulateCareerRace({ season, raceIndex, profile });
        if (result.playerResult.gridPosition <= 8) continue;
        samples.push(result.playerResult.position);
        if (samples.length >= 80) break outer;
      }
    }
    const podiumRate = samples.filter((position) => position <= 3).length / samples.length;
    const topFiveRate = samples.filter((position) => position <= 5).length / samples.length;
    expect(samples.length).toBeGreaterThan(30);
    expect(podiumRate).toBeLessThan(0.12);
    expect(topFiveRate).toBeLessThan(0.35);
  });
});
