import {
  prepareCareerBootstrap,
  createCareerSeason,
  simulateCareerRace,
} from "./careerModeEngine";

// The intra-team duel must be driven by the rating gap, NOT by how strong the
// car is. A weaker car must not flip the result: a higher-rated player should
// still finish ahead of a lower-rated team-mate most of the time even in a
// back-of-the-grid seat, where the car-reality grounding is at its strongest.
const SEEDS = 200;

// Builds a full grid where the player's team sits at `playerTeamRating`. The
// player's team-mate gets `mateRating`; every rival team fields two drivers
// roughly at the team's level so the field is realistic.
const makeBootstrap = (playerTeamRating, mateRating) => {
  const pool = [95, 90, 86, 82, 78, 74, 70, 66, 62, 58];
  const others = pool.filter((r) => r !== playerTeamRating);
  const teams = [{ name: "Mine", rating: playerTeamRating }, ...others.map((r, i) => ({ name: `T${i}`, rating: r }))]
    .sort((a, b) => b.rating - a.rating);
  return prepareCareerBootstrap({
    decades: [{ key: "2010s", label: "2010s", from: 2010, to: 2019 }],
    seasonYears: [2010],
    teamsByDecade: {
      "2010s": teams.map((t) => ({ ...t, firstYear: 2010, lastYear: 2010, decade: "2010s" })),
    },
    driversByDecade: { "2010s": [{ name: "X", rating: 70, firstYear: 2010, lastYear: 2010, decade: "2010s" }] },
    racesByYear: { "2010": [{ round: 1, name: "Race A" }] },
    lineupsByYear: {
      "2010": teams.map((t) => ({
        id: t.name.toLowerCase(),
        team: t.name,
        rating: t.rating,
        races: 1,
        drivers:
          t.name === "Mine"
            ? [{ name: "Mate", rating: mateRating, races: 1 }, { name: "Filler", rating: mateRating - 1, races: 1 }]
            : [{ name: `${t.name}a`, rating: t.rating, races: 1 }, { name: `${t.name}b`, rating: t.rating - 2, races: 1 }],
      })),
    },
  });
};

// Returns the share (0..1) of races in which the player finishes ahead of the
// team-mate over SEEDS independent simulations of the same single race.
const playerAheadShare = ({ playerTeamRating, playerRating, mateRating }) => {
  const bootstrap = makeBootstrap(playerTeamRating, mateRating);
  let ahead = 0;
  let compared = 0;
  for (let s = 0; s < SEEDS; s += 1) {
    const profile = {
      name: `P${s}`,
      helmetColor: "#123456",
      rating: playerRating,
      reputation: 45,
      consistency: 60,
      aggression: 55,
      seasons: 0,
      status: "rookie",
      stats: { points: 0, wins: 0, podiums: 0, titles: 0, teams: [] },
    };
    const contract = { id: "c", team: { name: "Mine", rating: playerTeamRating, color: "#0090ff" }, objectives: {}, duration: 1 };
    const season = createCareerSeason({ bootstrap, profile, year: 2010, contract });
    const result = simulateCareerRace({ season, raceIndex: 0, profile });
    const p = result.results.find((row) => row.isPlayer);
    const m = result.results.find((row) => !row.isPlayer && row.team === "Mine");
    if (!p || !m) continue;
    compared += 1;
    if (p.position < m.position) ahead += 1;
  }
  return ahead / compared;
};

describe("intra-team duel is decided by rating, not by car strength", () => {
  test("a higher-rated player beats a weaker team-mate even in a back-of-grid car", () => {
    const weakCar = playerAheadShare({ playerTeamRating: 58, playerRating: 54, mateRating: 48 });
    const strongCar = playerAheadShare({ playerTeamRating: 92, playerRating: 54, mateRating: 48 });
    // +6 rating edge must win out in BOTH cars, not just the fast one.
    expect(strongCar).toBeGreaterThan(0.6);
    expect(weakCar).toBeGreaterThan(0.6);
  });

  test("near-equal ratings are split roughly 50/50 regardless of car strength", () => {
    const weakCar = playerAheadShare({ playerTeamRating: 58, playerRating: 54, mateRating: 54 });
    const strongCar = playerAheadShare({ playerTeamRating: 92, playerRating: 54, mateRating: 54 });
    // eslint-disable-next-line no-console
    console.log(`\nEQUAL-RATING player-ahead share — weak car ${(weakCar * 100).toFixed(1)}%, strong car ${(strongCar * 100).toFixed(1)}%`);
    expect(weakCar).toBeGreaterThan(0.4);
    expect(weakCar).toBeLessThan(0.62);
    expect(strongCar).toBeGreaterThan(0.4);
    expect(strongCar).toBeLessThan(0.62);
  });

  test("a much stronger team-mate finishes ahead most of the time", () => {
    const weakCar = playerAheadShare({ playerTeamRating: 58, playerRating: 54, mateRating: 70 });
    const strongCar = playerAheadShare({ playerTeamRating: 92, playerRating: 54, mateRating: 70 });
    expect(weakCar).toBeLessThan(0.35);
    expect(strongCar).toBeLessThan(0.35);
  });
});
