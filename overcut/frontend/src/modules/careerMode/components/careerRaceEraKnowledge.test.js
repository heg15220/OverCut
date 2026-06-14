import {
  renderLeaderEvent,
  renderOvertakeEvent,
  renderStrategyEvent,
} from "./careerRaceEventCatalog";
import { getRaceEraKnowledge, renderEraContextEvent } from "./careerRaceEraKnowledge";

const rngSequence = (values) => {
  let index = 0;
  return () => values[Math.min(index++, values.length - 1)];
};

describe("career race era knowledge", () => {
  test("classifies historical eras with their available race-control tools", () => {
    expect(getRaceEraKnowledge(1970).drs).toBe(false);
    expect(getRaceEraKnowledge(1970).vsc).toBe(false);
    expect(getRaceEraKnowledge(2004).refuelling).toBe(true);
    expect(getRaceEraKnowledge(2024).drs).toBe(true);
    expect(getRaceEraKnowledge(2024).vsc).toBe(true);
  });

  test("does not use DRS wording in a pre-DRS overtake or lead battle", () => {
    const overtake = renderOvertakeEvent({
      driver: "Player",
      rival: "Rival",
      lap: 10,
      raceName: "British Grand Prix",
      year: 1970,
      rng: rngSequence([0, 4 / 12, 0]),
      player: true,
    });
    const leader = renderLeaderEvent({
      leader: "Leader",
      chaser: "Chaser",
      third: "Third",
      lap: 12,
      year: 1970,
      rng: rngSequence([0]),
    });

    expect(`${overtake.text} ${leader.text}`).not.toMatch(/DRS/i);
  });

  test("does not use VSC or undercut/overcut strategy wording before those concepts fit the era", () => {
    const event = renderStrategyEvent({
      driver: "Player",
      rival: "Rival",
      team: "Team",
      lap: 20,
      year: 1970,
      rng: rngSequence([0]),
      state: { year: 1970, condition: "seco" },
    });

    expect(event.text).not.toMatch(/VSC|undercut|overcut/i);
  });

  test("adds an era context event for natural-language race flavour", () => {
    const event = renderEraContextEvent({ year: 2004, lap: 1, rng: rngSequence([0]) });
    expect(event.era).toBe("refuelling");
    expect(event.text).toMatch(/combustible|repostaje/i);
  });
});
