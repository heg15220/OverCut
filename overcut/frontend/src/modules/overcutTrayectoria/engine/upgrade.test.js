/**
 * The winter upgrade.
 *
 * A season of technical work only pays if the team had a season worth building
 * on, and it pays to the car rather than to the driver - which is why it is the
 * one preseason choice that can move you up the grid instead of up the order.
 */

import { PRESEASON_FOCUS } from "./attributes";
import { UPGRADE_GAIN, rollUpgrade, upgradeChanceFor, worldWithUpgrade } from "./upgrade";

const careerAt = (over = {}) => ({
  yearsAtTeam: 2,
  history: [{ year: 1988 }],
  contract: { teamId: "ferrari" },
  objective: { met: true, beatTeammate: true },
  driver: { attributes: { technical: 55 } },
  focus: PRESEASON_FOCUS.TECHNICAL,
  lastSeason: {
    player: { carRank: 3 },
    constructorStandings: [
      { teamId: "mclaren", position: 1 },
      { teamId: "ferrari", position: 3 },
    ],
  },
  ...over,
});

describe("whether the team earns an upgrade", () => {
  it("offers nothing in a debut season", () => {
    expect(upgradeChanceFor({ career: careerAt({ history: [] }) })).toBe(0);
  });

  it("offers nothing in your first winter at a new team", () => {
    // The upgrade is a year of your feedback coming good. Sign somewhere else
    // and that year went with the old team.
    expect(upgradeChanceFor({ career: careerAt({ yearsAtTeam: 1 }) })).toBe(0);
  });

  it("rates a season that met its objective above one that missed it", () => {
    const met = upgradeChanceFor({ career: careerAt({ objective: { met: true, beatTeammate: false } }) });
    const missed = upgradeChanceFor({ career: careerAt({ objective: { met: false, beatTeammate: false } }) });

    expect(met).toBeGreaterThan(missed);
  });

  it("rates beating your team-mate on top of meeting the objective", () => {
    const both = upgradeChanceFor({ career: careerAt({ objective: { met: true, beatTeammate: true } }) });
    const objectiveOnly = upgradeChanceFor({ career: careerAt({ objective: { met: true, beatTeammate: false } }) });

    expect(both).toBeGreaterThan(objectiveOnly);
  });

  it("rewards a team that finished above what its car was worth", () => {
    const overachieved = upgradeChanceFor({
      career: careerAt({
        lastSeason: {
          player: { carRank: 5 },
          constructorStandings: [{ teamId: "ferrari", position: 2 }],
        },
      }),
    });
    const underachieved = upgradeChanceFor({
      career: careerAt({
        lastSeason: {
          player: { carRank: 2 },
          constructorStandings: [{ teamId: "ferrari", position: 5 }],
        },
      }),
    });

    expect(overachieved).toBeGreaterThan(underachieved);
  });

  it("lets a driver who is good on the pit wall count for something", () => {
    const engineer = upgradeChanceFor({ career: careerAt({ driver: { attributes: { technical: 90 } } }) });
    const plain = upgradeChanceFor({ career: careerAt({ driver: { attributes: { technical: 40 } } }) });

    expect(engineer).toBeGreaterThan(plain);
  });

  it("is never certain and never impossible once you have earned the right to ask", () => {
    const best = upgradeChanceFor({
      career: careerAt({
        driver: { attributes: { technical: 99 } },
        lastSeason: {
          player: { carRank: 10 },
          constructorStandings: [{ teamId: "ferrari", position: 1 }],
        },
      }),
    });
    const worst = upgradeChanceFor({
      career: careerAt({
        objective: { met: false, beatTeammate: false },
        driver: { attributes: { technical: 30 } },
        lastSeason: {
          player: { carRank: 1 },
          constructorStandings: [{ teamId: "ferrari", position: 10 }],
        },
      }),
    });

    expect(best).toBeLessThanOrEqual(0.75);
    expect(worst).toBeGreaterThanOrEqual(0.05);
  });
});

describe("rolling for the upgrade", () => {
  const always = { chance: () => true };
  const never = { chance: () => false };

  it("only rolls when the winter was spent on technical work", () => {
    const other = rollUpgrade({ career: careerAt({ focus: PRESEASON_FOCUS.QUALIFYING }), stream: always });

    expect(other.granted).toBe(false);
    expect(other.gain).toBe(0);
    expect(other.chance).toBe(0);
  });

  it("hands the team a real step forward when it lands", () => {
    const won = rollUpgrade({ career: careerAt(), stream: always });

    expect(won.granted).toBe(true);
    expect(won.gain).toBe(UPGRADE_GAIN);
    expect(won.chance).toBeGreaterThan(0);
  });

  it("leaves the car exactly as it was when it does not", () => {
    const lost = rollUpgrade({ career: careerAt(), stream: never });

    expect(lost.granted).toBe(false);
    expect(lost.gain).toBe(0);
    // Failing is not a punishment: you spent the winter on it and it did not come.
    expect(lost.chance).toBeGreaterThan(0);
  });
});

describe("putting the upgrade on the car", () => {
  const world = {
    year: 1988,
    teams: [
      { id: "mclaren", name: "McLaren", carRating: 92 },
      { id: "ferrari", name: "Ferrari", carRating: 90 },
      { id: "benetton", name: "Benetton", carRating: 80 },
    ],
  };

  it("lifts only the team the player drives for, and reorders the grid", () => {
    const upgraded = worldWithUpgrade(world, "ferrari", 0.03);

    expect(upgraded.teams[0].name).toBe("Ferrari");
    expect(upgraded.teams[0].carRating).toBeCloseTo(92.7, 5);
    expect(upgraded.teams.find((team) => team.id === "mclaren").carRating).toBe(92);
  });

  it("never touches the world it was given", () => {
    // Worlds live in a cache shared by every season of the career, so an upgrade
    // that mutated one would follow the player into years they never raced.
    worldWithUpgrade(world, "ferrari", 0.03);

    expect(world.teams[1].carRating).toBe(90);
    expect(world.teams.map((team) => team.id)).toEqual(["mclaren", "ferrari", "benetton"]);
  });

  it("gives back the same world when nothing was granted", () => {
    expect(worldWithUpgrade(world, "ferrari", 0)).toBe(world);
  });
});
