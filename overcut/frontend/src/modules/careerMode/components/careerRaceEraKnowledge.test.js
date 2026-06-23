import {
  renderExtraDynamicEvent,
  renderLeaderEvent,
  renderOvertakeEvent,
  renderPlayerSpecificEvent,
  renderPressureManagementEvent,
  renderRestartEvent,
  renderStrategyEvent,
} from "./careerRaceEventCatalog";
import { getRaceEraKnowledge, isEraFeatureAllowed, renderEraContextEvent } from "./careerRaceEraKnowledge";

const rngSequence = (values) => {
  let index = 0;
  return () => values[Math.min(index++, values.length - 1)];
};

// Deterministic generator that sweeps the template space across many calls.
const lcg = (seed) => {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
};

// Drive every player/strategy renderer that can carry ERS/battery wording.
const renderBatterySurface = (year) => {
  const rng = lcg(0x9e3779b1 ^ year);
  const texts = [];
  for (let i = 0; i < 400; i += 1) {
    const common = {
      driver: "Player",
      rival: "Rival",
      team: "Team",
      lap: 20,
      raceName: "British Grand Prix",
      rng,
      year,
      state: { year, condition: "seco", scActive: true, scHappenedBefore: true },
    };
    texts.push(renderStrategyEvent({ ...common, player: true }).text);
    texts.push(renderExtraDynamicEvent({ ...common, player: true }).text);
    texts.push(renderPressureManagementEvent({ ...common, player: true }).text);
    texts.push(renderPlayerSpecificEvent(common).text);
    texts.push(renderRestartEvent({ ...common, leader: "Leader", kind: "safetyCar" }).text);
  }
  return texts;
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

  test("strategy mini-stories carry the position result they describe", () => {
    const gain = renderStrategyEvent({
      driver: "Player",
      rival: "Rival",
      team: "Team",
      lap: 20,
      year: 2024,
      rng: rngSequence([0]),
      player: true,
      state: { year: 2024, condition: "seco" },
    });
    const loss = renderStrategyEvent({
      driver: "Player",
      rival: "Rival",
      team: "Team",
      lap: 21,
      year: 2024,
      rng: rngSequence([0.42]),
      player: true,
      state: { year: 2024, condition: "seco" },
    });

    expect(gain.text).toMatch(/undercut|overcut|plaza|delante/i);
    expect(gain.positionDelta).toBe(-1);
    expect(loss.text).toMatch(/Rival|pierde|completa el undercut|cruza por delante/i);
    expect(loss.positionDelta).toBe(1);
  });

  test("only allows ERS/battery as a feature from the hybrid era onward", () => {
    expect(isEraFeatureAllowed(1985, "ers")).toBeFalsy();
    expect(isEraFeatureAllowed(2002, "ers")).toBeFalsy();
    expect(isEraFeatureAllowed(2008, "ers")).toBeFalsy();
    expect(isEraFeatureAllowed(2015, "ers")).toBe(true);
    expect(isEraFeatureAllowed(2023, "ers")).toBe(true);
  });

  test("never narrates ERS/battery wording in a pre-hybrid season", () => {
    const offenders = renderBatterySurface(2002).filter((text) => /bateria|battery/i.test(text));
    expect(offenders).toEqual([]);
  });

  test("still narrates ERS/battery wording in the hybrid era", () => {
    const mentions = renderBatterySurface(2023).filter((text) => /bateria|battery/i.test(text));
    expect(mentions.length).toBeGreaterThan(0);
  });

  test("adds an era context event for natural-language race flavour", () => {
    const event = renderEraContextEvent({ year: 2004, lap: 1, rng: rngSequence([0]) });
    expect(event.era).toBe("refuelling");
    expect(event.text).toMatch(/combustible|repostaje/i);
  });
});

describe("player duel narration stays internally coherent", () => {
  test("a gaining setup never resolves into a loss, nor a losing setup into a gain", () => {
    const rng = lcg(0xc0ffee);
    const GAIN_SETUP = /prepara el adelantamiento|completa una vuelta de salida mejor/;
    const LOSS_RESULT = /pierde una posicion|pierde dos posiciones|sacrifica la trazada y queda vulnerable|el coche subvira/;
    const LOSS_SETUP = /queda sin bateria para defenderse|pierde temperatura tras el safety car/;
    const GAIN_RESULT = /ganancia doble|sale por delante y corta el DRS/;
    const broken = [];
    for (let i = 0; i < 3000; i += 1) {
      const { text } = renderPlayerSpecificEvent({
        driver: "Player",
        rival: "Rival",
        team: "Team",
        lap: 20,
        raceName: "British Grand Prix",
        rng,
        state: { year: 2023, condition: "seco", scActive: true, scHappenedBefore: true },
      });
      if (GAIN_SETUP.test(text) && LOSS_RESULT.test(text)) broken.push({ type: "gain->loss", text });
      if (LOSS_SETUP.test(text) && GAIN_RESULT.test(text)) broken.push({ type: "loss->gain", text });
    }
    expect(broken).toEqual([]);
  });
});
