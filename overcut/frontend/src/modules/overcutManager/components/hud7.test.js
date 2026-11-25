/**
 * HUD-7 of docs/manager/F1M24-GAMEPLAY.md (tacticas and danos-visibles, the UI part; §2.8, §2.10, §1.7 `damage[i]`;
 * RF-CMD-01, RF-CMD-02, RF-SIM-05, RF-SIM-09, RF-DEV-08, RNF-05, RNF-07, RNF-09):
 *   - hud.json (driverPanel.tactics, driverPanel.damage) validates against its schema
 *   - the tactics tab offers only what the engine behind the view takes and the era allows: without setTactics
 *     nothing new (current behaviour); the battle energy assist only with KERS or ERS (SRS §6)
 *   - one changed tactic sends the whole set (setTactics(state, carId, {avoidKerbs, cleanAir, battleAssist}))
 *   - damage in the §1.7 shape (SIM-7) or, before it, the engine's own front-wing loss and puncture; the advice to
 *     change the nose comes from the engine's repair threshold, never a literal in the view
 *   - a worker tick's damage reaches the mirror by car id; without it the mirror is untouched
 *   - in a real race the card says the damage in words, and reading it changes nothing (RNF-05)
 */

import React from "react";
import fs from "fs";
import path from "path";
import Ajv from "ajv";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import hudSchema from "../engine/packs/schema/hud.schema.json";
import HUD from "../data/balance/hud.json";
import RELIABILITY from "../data/balance/race-reliability.json";
import { fallbackBootstrap } from "../../overcutTrayectoria/data/fallbackBootstrap";
import { reference } from "../data/reference";
import { createContext, createCareer, runPractice, runQualifyingSession, weekendRaceArgs } from "../engine/career";
import { loadSeasonPack } from "../engine/packs/seasonPacks";
import { commandsFor, createRace, rulesOf, stepLap } from "../engine/race";
import { COMMANDS as STEP_COMMANDS } from "../engine/worker/raceSession";
import { DEFENCE_KEYS, RISK_KEYS } from "../engine/sim";
import { ManagerContext } from "./context";
import LiveRace from "./LiveRace";
import { REPAIR_ABOVE, adviceText, damageLines, damageOf, damageVerdict, engineSupports, mirrorDamage, tacticValue, tacticsFor, tacticsPatch } from "./tacticsHud";

jest.mock("../../../helpers/sourceTictactoeImages", () => {
  const resolve = () => "logo.png";
  resolve.keys = () => [];
  return { sourceTictactoeImages: resolve };
});

// The quick engine with SIM-7's setTactics (§2.8), so the tab can be seen working before SIM-7 is merged: it only
// records the set it is given on the car, as the contract says the engine will. A plain function (CRA's jest
// resets jest.fn implementations before every test).
const mockTacticsCalls = [];
jest.mock("../engine/race", () => {
  const actual = jest.requireActual("../engine/race");
  const setTactics = (state, carId, patch) => {
    mockTacticsCalls.push([carId, patch]);
    const car = state.cars.find((entry) => entry.id === carId);
    if (car) car.tactics = { ...(car.tactics || {}), ...patch };
    return state;
  };
  return { ...actual, setTactics };
});

const source = (name) => fs.readFileSync(path.join(__dirname, name), "utf8");
const has = (...names) => (name) => names.includes(name);

describe("HUD-7 · data (RNF-07)", () => {
  it("hud.json with driverPanel.tactics and driverPanel.damage passes the schema", () => {
    const ajv = new Ajv({ allErrors: true, strict: false });
    expect(ajv.validate(hudSchema, HUD)).toBe(true);
  });

  it("the damage states are RF-DEV-08's four (development.json damage.states)", () => {
    const DEV = require("../data/balance/development.json");
    expect(HUD.driverPanel.damage.states).toEqual(DEV.damage.states);
    HUD.driverPanel.damage.severeStates.forEach((state) => expect(HUD.driverPanel.damage.states).toContain(state));
    Object.values(HUD.driverPanel.damage.stateAlias).forEach((state) => expect(HUD.driverPanel.damage.states).toContain(state));
  });

  it("the repair advice uses the engine's own threshold, not a literal in the view", () => {
    expect(REPAIR_ABOVE).toBe(RELIABILITY.contact.repairAbove);
    const code = source("LiveRace.js") + source("tacticsHud.js");
    expect(code).not.toMatch(/repairAbove\s*[:=]\s*\d/);
    expect(code).not.toMatch(/lossSec\w*\s*>=?\s*\d/);
  });
});

describe("HUD-7 · tactics by era and engine (RF-CMD-01, SRS §6)", () => {
  const kers = commandsFor(rulesOf("2012", 2012));
  const none = commandsFor(rulesOf("2010", 2010));

  it("without setTactics in the engine the tab has no on/off tactics (current behaviour)", () => {
    const tactics = tacticsFor({ commands: kers, supports: has("setDefence", "setOvertakeRisk"), energyModes: kers.energy, defenceKeys: DEFENCE_KEYS, riskKeys: RISK_KEYS });
    expect(tactics.toggles).toEqual([]);
    expect(tactics.defence).toEqual(DEFENCE_KEYS);
    expect(tactics.overtakeRisk).toEqual(RISK_KEYS);
  });

  it("defence and overtaking risk only when the engine takes them", () => {
    const tactics = tacticsFor({ commands: kers, supports: has(), energyModes: kers.energy, defenceKeys: DEFENCE_KEYS, riskKeys: RISK_KEYS });
    expect(tactics).toEqual({ defence: [], overtakeRisk: [], toggles: [] });
  });

  it("the battle energy assist only in an era with KERS or ERS", () => {
    expect(kers.energy.length).toBeGreaterThan(0);
    expect(none.energy).toEqual([]);
    const withEnergy = tacticsFor({ commands: kers, supports: has("setTactics"), energyModes: kers.energy });
    const without = tacticsFor({ commands: none, supports: has("setTactics"), energyModes: none.energy });
    expect(withEnergy.toggles).toEqual(["avoidKerbs", "cleanAir", "battleAssist"]);
    expect(without.toggles).toEqual(["avoidKerbs", "cleanAir"]);
  });

  it("follows commandsFor's tactics when SIM-7 gives them (list or table), even against the engine", () => {
    expect(tacticsFor({ commands: { ...kers, tactics: ["cleanAir"] }, supports: has("setTactics"), energyModes: kers.energy }).toggles).toEqual(["cleanAir"]);
    const table = { avoidKerbs: true, cleanAir: false, battleAssist: true, defence: ["block"], overtakeRisk: ["low", "high"] };
    const tactics = tacticsFor({ commands: { ...kers, tactics: table }, supports: has("setTactics", "setDefence", "setOvertakeRisk"), energyModes: kers.energy, defenceKeys: DEFENCE_KEYS, riskKeys: RISK_KEYS });
    expect(tactics).toEqual({ defence: ["block"], overtakeRisk: ["low", "high"], toggles: ["avoidKerbs", "battleAssist"] });
    // An era table saying yes to the assist never beats an era without energy.
    expect(tacticsFor({ commands: { ...none, tactics: table }, supports: has("setTactics"), energyModes: [] }).toggles).toEqual(["avoidKerbs"]);
  });

  it("the step race's worker takes defence and risk; an unknown order is never offered", () => {
    const supports = engineSupports(STEP_COMMANDS);
    expect(supports("setDefence")).toBe(true);
    expect(supports("setOvertakeRisk")).toBe(true);
    expect(supports("noSuchOrder")).toBe(false);
    expect(engineSupports(null)("setMode")).toBe(false);
  });

  it("one changed tactic sends the whole set, the rest as the engine has them", () => {
    const car = { tactics: { cleanAir: true } };
    expect(tacticValue(car, "cleanAir")).toBe(true);
    expect(tacticValue(car, "avoidKerbs")).toBe(false);
    expect(tacticValue({}, "avoidKerbs")).toBe(false);
    expect(tacticsPatch(car, ["avoidKerbs", "cleanAir", "battleAssist"], "avoidKerbs", true)).toEqual({ avoidKerbs: true, cleanAir: true, battleAssist: false });
    expect(tacticsPatch(car, ["avoidKerbs", "cleanAir"], "cleanAir", false)).toEqual({ avoidKerbs: false, cleanAir: false });
  });
});

describe("HUD-7 · damage (§1.7 damage[i], RF-DEV-08, RF-SIM-09)", () => {
  it("no damage is null; the engine's own wing loss and puncture before SIM-7", () => {
    expect(damageOf({ damage: 0, puncture: false })).toBeNull();
    expect(damageOf({ damage: HUD.driverPanel.damage.minShownSec / 2 })).toBeNull();
    expect(damageOf({ damage: 1.2 })).toEqual({ parts: { frontWing: { lossSec: 1.2, state: null } }, puncture: null, lossSecPerLap: 1.2 });
    expect(damageOf({ damage: 0, puncture: true })).toEqual({ parts: {}, puncture: { wheel: null }, lossSecPerLap: null });
  });

  it("reads the §1.7 shape in seconds, in states or both, with the engine's total", () => {
    const live = { damageLive: { frontWing: 0.4, floor: { lossSecPerLap: 0.3, state: "severe" }, puncture: "rl", lossSecPerLap: 0.8 } };
    expect(damageOf(live)).toEqual({ parts: { frontWing: { lossSec: 0.4, state: null }, floor: { lossSec: 0.3, state: "heavy" } }, puncture: { wheel: "rl" }, lossSecPerLap: 0.8 });
    expect(damageOf({ damage: { frontWing: "light", floor: "perfect", puncture: "none" } })).toEqual({ parts: { frontWing: { lossSec: null, state: "light" } }, puncture: null, lossSecPerLap: null });
    expect(damageOf({ damageLive: { frontWing: 0, floor: null, puncture: false } })).toBeNull();
  });

  it("advises a new nose from the engine's repair threshold, a stop for a puncture, nothing for a scratch", () => {
    const over = damageOf({ damage: REPAIR_ABOVE + 0.1 });
    const under = damageOf({ damage: Math.max(HUD.driverPanel.damage.minShownSec, REPAIR_ABOVE - 0.3) });
    expect(damageVerdict(over)).toEqual({ tone: "bad", advice: "wing", handled: false });
    expect(damageVerdict(under)).toEqual({ tone: "warn", advice: null, handled: false });
    expect(damageVerdict(damageOf({ damage: 0, puncture: true }))).toEqual({ tone: "bad", advice: "puncture", handled: false });
    expect(damageVerdict(damageOf({ damageLive: { frontWing: "destroyed" } }))).toMatchObject({ tone: "bad", advice: "wing" });
    // An era whose stop cannot change the nose gets no such advice; a stop already called changes it.
    expect(damageVerdict(over, { canChangeWing: false }).advice).toBeNull();
    expect(damageVerdict(over, { pitCalled: true }).handled).toBe(true);
    expect(damageVerdict(null)).toBeNull();
  });

  it("says it in words (RNF-09)", () => {
    const damage = damageOf({ damageLive: { frontWing: { lossSecPerLap: 1.1, state: "heavy" }, puncture: "fl" } });
    expect(damageLines(damage).map((line) => line.text)).toEqual(["Front wing · heavy · +1.1 s/lap", "Puncture front left"]);
    expect(adviceText(damageVerdict(damage))).toBe("Box now: puncture");
    expect(adviceText(damageVerdict(damageOf({ damage: REPAIR_ABOVE + 0.5 })))).toBe("Change the nose at the stop");
    expect(adviceText(damageVerdict(damageOf({ damage: REPAIR_ABOVE + 0.5 }), { pitCalled: true }))).toBe("Stop called: the nose is changed");
  });

  it("a tick's snapshot[i].damage reaches the mirror by car id; a tick without it leaves the mirror alone", () => {
    const mirror = { cars: [{ id: "a" }, { id: "b", damageLive: { floor: 0.2 } }] };
    mirrorDamage(mirror, { snapshot: [{ id: "b", damage: { frontWing: 0.7 } }, { id: "a" }] });
    expect(mirror.cars[1].damageLive).toEqual({ frontWing: 0.7 });
    expect(mirror.cars[0].damageLive).toBeUndefined();
    mirrorDamage(mirror, { cars: [] });
    expect(mirror.cars[1].damageLive).toEqual({ frontWing: 0.7 });
    mirrorDamage(mirror, { damage: [{ puncture: true }, null] });
    expect(mirror.cars[0].damageLive).toEqual({ puncture: true });
    expect(mirror.cars[1].damageLive).toBeNull();
  });
});

describe("HUD-7 · the panel in a real race", () => {
  // The season packs of the two eras (2013 with KERS, 2008 without), loaded on demand as the game does.
  let packs = {};
  beforeAll(async () => {
    const loaded = await Promise.all([2013, 2008].map((year) => loadSeasonPack(year)));
    packs = Object.fromEntries(loaded.map(({ pack }) => [pack.year, pack]));
  });

  const raceFor = (year, teamId = "ferrari") => {
    const context = createContext(fallbackBootstrap, reference, packs);
    const career = createCareer(context, { year, teamId, seed: `hud7-${year}` });
    runPractice(career, {});
    runQualifyingSession(career, {});
    return { career, args: weekendRaceArgs(career) };
  };

  const mount = (career, state) => {
    jest.useFakeTimers();
    const view = render(
      <ManagerContext.Provider value={{ career }}>
        <LiveRace state={state} onFinished={() => {}} title="Race" />
      </ManagerContext.Provider>,
    );
    act(() => {
      jest.advanceTimersByTime(120);
    });
    return view;
  };

  afterEach(() => {
    jest.useRealTimers();
    mockTacticsCalls.length = 0;
  });

  const openTactics = (card) => fireEvent.click(within(card).getByRole("tab", { name: "Tactics" }));

  it("2013 (KERS): the tab has the three tactics; one click sends the whole set to the engine", () => {
    const { career, args } = raceFor(2013);
    const state = createRace({ ...args, seed: `${args.seed}-tactics` });
    const me = state.cars.find((car) => car.isUser);
    mount(career, state);
    const card = screen.getByRole("region", { name: me.name });
    openTactics(card);
    expect(within(card).getByRole("radiogroup", { name: "Avoid kerbs" })).toBeInTheDocument();
    expect(within(card).getByRole("radiogroup", { name: "Find clean air" })).toBeInTheDocument();
    const assist = within(card).getByRole("radiogroup", { name: "Battle energy assist" });
    fireEvent.click(within(assist).getByRole("radio", { name: "On" }));
    expect(mockTacticsCalls).toEqual([[me.id, { avoidKerbs: false, cleanAir: false, battleAssist: true }]]);
    expect(me.tactics).toEqual({ avoidKerbs: false, cleanAir: false, battleAssist: true });
    act(() => {
      jest.advanceTimersByTime(60);
    });
    expect(within(assist).getByRole("radio", { name: "On" })).toHaveAttribute("aria-checked", "true");
  });

  it("2008 (no KERS): no battle energy assist; defence only if the quick engine takes it", () => {
    const { career, args } = raceFor(2008, "williams");
    const state = createRace({ ...args, seed: `${args.seed}-tactics` });
    const me = state.cars.find((car) => car.isUser);
    mount(career, state);
    const card = screen.getByRole("region", { name: me.name });
    openTactics(card);
    expect(within(card).getByRole("radiogroup", { name: "Avoid kerbs" })).toBeInTheDocument();
    expect(within(card).queryByRole("radiogroup", { name: "Battle energy assist" })).toBeNull();
    const quick = jest.requireActual("../engine/race");
    expect(Boolean(within(card).queryByRole("radiogroup", { name: "Defence" }))).toBe(typeof quick.setDefence === "function");
  });

  it("a broken nose shows on the card in words with the advice; the race is unchanged (RNF-05)", () => {
    const { career, args } = raceFor(2013);
    const state = createRace({ ...args, seed: `${args.seed}-damage` });
    const twin = createRace({ ...args, seed: `${args.seed}-damage` });
    stepLap(state);
    stepLap(twin);
    const me = state.cars.find((car) => car.isUser && car.status === "running");
    const loss = REPAIR_ABOVE + 0.4;
    me.damage = loss;
    twin.cars.find((car) => car.id === me.id).damage = loss;
    mount(career, state);
    const card = screen.getByRole("region", { name: me.name });
    expect(within(card).getByTestId("damage-tag")).toHaveTextContent("Damage");
    const row = within(card).getByTestId("damage-row");
    expect(row).toHaveAttribute("data-tone", "bad");
    expect(row).toHaveTextContent(`Front wing · +${loss.toFixed(1)} s/lap`);
    expect(row).toHaveTextContent("Change the nose at the stop");
    fireEvent.click(within(card).getByRole("tab", { name: "Pit" }));
    expect(within(card).getByTestId("damage-advice")).toHaveTextContent("Change the nose at the stop");
    while (twin.lap < state.lap && !twin.finished) stepLap(twin);
    const strip = (s) => s.cars.map((car) => [car.id, car.position, car.totalTime, car.lap, car.compound, car.damage]);
    expect(strip(state)).toEqual(strip(twin));
  });

  it("an undamaged car has no damage tag or row", () => {
    const { career, args } = raceFor(2013);
    const state = createRace({ ...args, seed: `${args.seed}-clean` });
    const me = state.cars.find((car) => car.isUser);
    me.damage = 0;
    me.puncture = false;
    mount(career, state);
    const card = screen.getByRole("region", { name: me.name });
    expect(within(card).queryByTestId("damage-tag")).toBeNull();
    expect(within(card).queryByTestId("damage-row")).toBeNull();
  });
});
