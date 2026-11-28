/**
 * HUD-5 of docs/manager/F1M24-GAMEPLAY.md (sc-pose-from-sim, the HUD; §2.11, §1.5, §1.7 `sc`/`vsc`;
 * RF-SIM-10, RF-3D-04, RNF-05, RNF-07, RNF-09, SRS §6.2):
 *   - hud.json (sc) validates against its schema
 *   - the 90 m ahead of the leader are gone from LiveRace.js: the safety car is the engine's or none
 *   - raceClock.liveSafetyCarAt eases the engine's safety car between the worker's snapshots (across the
 *     line too), uses the tick's when the snapshots carry none, and gives null without either
 *   - "in this lap": the engine's IN_THIS_LAP; without it, the engine's own spell count - in a real quick
 *     race, only during the leader's lap that ends the spell
 *   - VSC delta and VSC ending only from snapshot.vsc, only from 2015; no safety car before 1993
 *   - the view only reads: nothing it computes changes the mirror (RNF-05)
 */

import React from "react";
import fs from "fs";
import path from "path";
import Ajv from "ajv";
import hudSchema from "../engine/packs/schema/hud.schema.json";
import HUD from "../data/balance/hud.json";
import { fallbackBootstrap } from "../../overcutTrayectoria/data/fallbackBootstrap";
import { reference } from "../data/reference";
import { createContext, createCareer, runPractice, runQualifyingSession, weekendRaceArgs } from "../engine/career";
import { createRace, rulesOf, runToFinish } from "../engine/race";
import { circuitFor } from "../engine/venue";
import { poseAt } from "../engine/trackGeometry";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { ManagerContext } from "./context";
import LiveRace from "./LiveRace";
import { liveSafetyCarAt, liveVscAt, safetyCarWindows, standingsAt } from "./raceClock";
import { SC_PHASES, scBannerOf, scInThisLap, scMapPose, scPhaseLabel, scPhaseOf, vscDeltaOf, vscDeltaText, vscEnding } from "./hudSafetyCar";

jest.mock("../../../helpers/sourceTictactoeImages", () => {
  const resolve = () => "logo.png";
  resolve.keys = () => [];
  return { sourceTictactoeImages: resolve };
});

const source = (name) => fs.readFileSync(path.join(__dirname, name), "utf8");

const RULES_2024 = rulesOf(null, 2024);
const rulesForYear = (year) => ({ raceControl: { safetyCar: year >= 1993, vsc: year >= 2015 } });

describe("HUD-5 · data (RNF-07)", () => {
  it("hud.json with its sc block passes the schema", () => {
    const ajv = new Ajv({ allErrors: true, strict: false });
    expect(ajv.validate(hudSchema, HUD)).toBe(true);
    expect(ajv.errors).toBeNull();
    expect(HUD.sc.vscDelta.positiveMeans).toBe("margin");
  });

  it("LiveRace.js no longer places the safety car 90 m ahead of the leader (§1.5)", () => {
    const code = source("LiveRace.js");
    expect(code).not.toMatch(/90\s*\/\s*circuit\.length/);
    expect(code).not.toMatch(/poseAt\(/);
    expect(code).toMatch(/scMapPose\(/);
  });

  it("the era's rules expose the safety car from 1993 and the VSC from 2015 (SRS §6.2)", () => {
    expect(rulesOf(null, 2014).raceControl.vsc).toBe(false);
    expect(rulesOf(null, 2015).raceControl.vsc).toBe(true);
    expect(RULES_2024.raceControl.safetyCar).toBe(true);
  });
});

describe("HUD-5 · the engine's safety car at the pictures' clock (raceClock)", () => {
  const shot = (clock, sc, vsc) => ({ clock, p: [], l: [], pit: [], duel: [], ...(sc !== undefined ? { sc } : {}), ...(vsc !== undefined ? { vsc } : {}) });

  it("eases forward between two snapshots, across the line too", () => {
    const mirror = { snapshots: [shot(10, { phase: "TRAIN", s: 0.98, v: 40, lap: 7, lightsOn: true }), shot(10.25, { phase: "TRAIN", s: 0.02, v: 44, lap: 8, lightsOn: true })] };
    const half = liveSafetyCarAt(mirror, 10.125);
    expect(half.s).toBeCloseTo(0, 6);
    expect(half.v).toBeCloseTo(42, 6);
    expect(half.phase).toBe("TRAIN");
    const quarter = liveSafetyCarAt(mirror, 10.0625);
    expect(quarter.s).toBeCloseTo(0.99, 6);
  });

  it("is null when the engine sends none (no safety car invented), and too far from the pictures", () => {
    expect(liveSafetyCarAt({ snapshots: [shot(1), shot(1.25)] }, 1.1)).toBeNull();
    expect(liveSafetyCarAt({ snapshots: [shot(1, null), shot(1.25, null)] }, 1.1)).toBeNull();
    expect(liveSafetyCarAt({ snapshots: [], sc: { phase: "PICKUP", s: 0.4 }, scClock: 100 }, 50, 5)).toBeNull();
    const tick = liveSafetyCarAt({ snapshots: [], sc: { phase: "PICKUP", s: 1.4 }, scClock: 100 }, 98, 5);
    expect(tick.s).toBeCloseTo(0.4, 9);
  });

  it("reads the VSC of the nearer snapshot, or the tick's", () => {
    const vsc = { deltaSec: [0.8, -0.2], ending: false };
    expect(liveVscAt({ snapshots: [shot(5, undefined, vsc), shot(5.25, undefined, { ...vsc, ending: true })] }, 5.2).ending).toBe(true);
    expect(liveVscAt({ snapshots: [], vsc }, 3)).toBe(vsc);
    expect(liveVscAt({ snapshots: [] }, 3)).toBeNull();
  });

  it("only reads: the mirror is the same after it (RNF-05)", () => {
    const mirror = { snapshots: [shot(10, { phase: "TRAIN", s: 0.5, v: 40 }, { deltaSec: [0.3], ending: false }), shot(10.25, { phase: "TRAIN", s: 0.51, v: 40 })], sc: null };
    const before = JSON.stringify(mirror);
    liveSafetyCarAt(mirror, 10.1);
    liveVscAt(mirror, 10.1);
    expect(JSON.stringify(mirror)).toBe(before);
  });
});

describe("HUD-5 · phases, banner, map (hudSafetyCar)", () => {
  it("knows the §1.7 phases and says each one in words", () => {
    SC_PHASES.forEach((phase) => {
      expect(scPhaseOf({ phase })).toBe(phase);
      expect(scPhaseLabel(phase).length).toBeGreaterThan(0);
    });
    expect(scPhaseOf({ phase: "PARKED" })).toBeNull();
    expect(scPhaseOf(null)).toBeNull();
  });

  it("follows the engine's IN_THIS_LAP when it sends the phase", () => {
    const window = { from: 0, to: Infinity, virtual: false };
    expect(scInThisLap({ sc: { phase: "IN_THIS_LAP", s: 0.2 }, window, tau: 10, rules: RULES_2024 })).toBe(true);
    expect(scInThisLap({ sc: { phase: "TRAIN", s: 0.2 }, window, tau: 10, rules: RULES_2024, engineSc: { laps: 1, since: 2 }, engineLap: 5 })).toBe(false);
    expect(scBannerOf({ inThisLap: true }).kind).toBe("scIn");
  });

  it("has no safety car before 1993 and no VSC before 2015 (SRS §6.2)", () => {
    const window = { from: 0, to: Infinity, virtual: false };
    expect(scInThisLap({ sc: { phase: "IN_THIS_LAP", s: 0.2 }, window, tau: 10, rules: rulesForYear(1990) })).toBe(false);
    expect(scMapPose({ length: 5000 }, { phase: "TRAIN", s: 0.2 }, rulesForYear(1990))).toBeNull();
    const vsc = { deltaSec: [0.6], ending: true };
    expect(vscDeltaOf(vsc, 0, rulesForYear(2014))).toBeNull();
    expect(vscEnding({ vsc, window: { virtual: true }, rules: rulesForYear(2014) })).toBe(false);
    expect(vscEnding({ vsc, window: { virtual: true }, rules: rulesForYear(2015) })).toBe(true);
    expect(vscEnding({ vsc: { deltaSec: [], ending: false }, window: { virtual: true }, rules: rulesForYear(2015) })).toBe(false);
  });

  it("the open step-race spell: one lap left past the deployment lap", () => {
    const window = { from: 30, to: Infinity, virtual: false };
    const base = { sc: null, window, tau: 100, rules: RULES_2024 };
    expect(scInThisLap({ ...base, engineSc: { laps: 1, since: 4 }, engineLap: 5 })).toBe(true);
    expect(scInThisLap({ ...base, engineSc: { laps: 2, since: 4 }, engineLap: 5 })).toBe(false);
    expect(scInThisLap({ ...base, engineSc: { laps: 1, since: 6 }, engineLap: 5 })).toBe(false);
    expect(scInThisLap({ ...base, engineSc: { laps: 1, since: 4, virtual: true }, engineLap: 5 })).toBe(false);
    expect(scInThisLap({ ...base, window: { ...window, virtual: true }, engineSc: { laps: 1, since: 4 }, engineLap: 5 })).toBe(false);
  });

  it("the VSC delta: margin, tight and below it, with words (RNF-09)", () => {
    const vsc = { deltaSec: [1.2, 0.2, -0.4], ending: false };
    expect(vscDeltaOf(vsc, 0, RULES_2024).state).toBe("margin");
    expect(vscDeltaOf(vsc, 1, RULES_2024).state).toBe("tight");
    const under = vscDeltaOf(vsc, 2, RULES_2024);
    expect(under.state).toBe("under");
    const text = vscDeltaText(under);
    expect(text.value).toBe("−0.4 s");
    expect(text.word.length).toBeGreaterThan(0);
    expect(text.tone).toBe("is-bad");
    expect(vscDeltaOf(vsc, 7, RULES_2024)).toBeNull();
    expect(vscDeltaOf(null, 0, RULES_2024)).toBeNull();
  });
});

describe("HUD-5 · a real quick race with a safety car", () => {
  const context = createContext(fallbackBootstrap, reference);
  const career = createCareer(context, { year: 2024, teamId: "ferrari", seed: "hud5" });
  runPractice(career, {});
  runQualifyingSession(career, {});
  const args = weekendRaceArgs(career);
  const raceWithSc = () => {
    for (let k = 0; k < 40; k += 1) {
      const state = createRace({ ...args, seed: `${args.seed}-hud5-${k}` });
      runToFinish(state);
      const deployed = state.events.findIndex((event) => event.type === "sc");
      // The live check below steps to the first neutralisation the flag names: a VSC before the SC
      // would be that one (a race that has both is not what it measures).
      const vscFirst = state.events.slice(0, Math.max(0, deployed)).some((event) => event.type === "vsc");
      if (deployed >= 0 && !vscFirst && state.events.slice(deployed).some((event) => event.type === "sc-in" && !event.virtual)) return state;
    }
    return null;
  };
  const state = raceWithSc();

  it("finds a race with a safety car that comes in", () => {
    expect(state).not.toBeNull();
  });

  it("says 'in this lap' only during the leader's lap that ends the spell, and draws no safety car", () => {
    const circuit = circuitFor(state.race, state.year);
    const lapRef = state.race.baseLap;
    const byId = Object.fromEntries(state.cars.map((car) => [car.id, car]));
    const rules = rulesOf(state.era, state.year);
    const windowAt = (tau, leaderId) => safetyCarWindows(state.events, byId, circuit, leaderId).find((w) => tau >= w.from && tau < w.to);
    const spell = safetyCarWindows(state.events, byId, circuit, state.cars[0].id).find((w) => !w.virtual && Number.isFinite(w.to));
    let seen = 0;
    for (let tau = spell.from; tau < spell.to + lapRef; tau += lapRef / 40) {
      const leader = standingsAt(state.cars, tau, circuit, lapRef).find((row) => !row.out);
      const window = windowAt(tau, leader.car.id);
      if (!window || window.virtual) continue;
      const inLap = scInThisLap({ sc: null, window, leaderHistory: leader.car.history, tau, rules });
      const ending = leader.car.history.find((entry) => !entry.retired && Math.abs(entry.end - window.to) < 1e-6);
      expect(inLap).toBe(Boolean(ending && tau >= ending.start && tau < ending.end));
      if (inLap) seen += 1;
      // §1.5: the quick mode has no safety car on the road, so the map shows none.
      expect(scMapPose(circuit, null, rules)).toBeNull();
    }
    expect(seen).toBeGreaterThan(0);
  });

  it("places the engine's safety car at its lap share on the map", () => {
    const circuit = circuitFor(state.race, state.year);
    const pose = scMapPose(circuit, { phase: "PICKUP", s: 0.25, v: 50, lightsOn: true }, rulesOf(state.era, state.year));
    const expected = poseAt(circuit, 0.25);
    expect(pose.x).toBeCloseTo(expected.x, 9);
    expect(pose.y).toBeCloseTo(expected.y, 9);
    expect(pose.lightsOn).toBe(true);
    expect(pose.phase).toBe("PICKUP");
  });

  it("live view: the banner and the flag say it in the lap it comes in, and the map draws no safety car of its own", () => {
    jest.useFakeTimers();
    try {
      const fresh = createRace({ ...args, seed: state.seed });
      render(
        <ManagerContext.Provider value={{ career }}>
          <LiveRace state={fresh} onFinished={() => {}} title="Race" />
        </ManagerContext.Provider>,
      );
      const tick = () =>
        act(() => {
          jest.advanceTimersByTime(60);
        });
      tick();
      const flagText = () => screen.getByTestId("live-race").textContent;
      for (let k = 0; k < 60 && !/Safety car/.test(flagText()); k += 1) {
        fireEvent.click(screen.getByRole("button", { name: /^next event$/i }));
        tick();
      }
      expect(flagText()).toMatch(/Safety car/);
      let banner = null;
      for (let k = 0; k < 12 && !banner; k += 1) {
        banner = screen.queryByText(/^safety car in this lap$/i);
        if (!banner) {
          fireEvent.click(screen.getByRole("button", { name: /^one lap$/i }));
          tick();
        }
      }
      expect(banner).not.toBeNull();
      expect(flagText()).toMatch(/Safety car · in this lap/);
      // §1.5: no engine safety car in the quick mode, so none on the 2D map.
      expect(screen.queryByText("Safety car", { selector: ".lv-sc-tag" })).toBeNull();
    } finally {
      jest.useRealTimers();
    }
  });
});
