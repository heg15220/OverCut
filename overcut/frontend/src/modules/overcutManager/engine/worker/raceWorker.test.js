/**
 * The race worker protocol (SRS 4: the engine in a Web Worker): the pure session
 * handler raceWorker.js wraps, run in-process (jsdom has no Worker), and the client
 * mirror the live view reads. RF-SIM-15 / RNF-05: the race behind the protocol is the
 * same race as the step sim run in-thread, byte for byte, with the same orders at the
 * same race time. RF-CMD-01/02 orders, RF-CMD-04 steps and "next event", RF-WKD-02
 * live and instant.
 */

import { serialize } from "v8";
import { classificationOf } from "../race";
import { completeRace, createLiveWeekendRace, createWeekendRace, weekendRaceArgs } from "../career";
import { createStepRace, requestPit, runStepToFinish, setErs, setMode, stepFor, stepToNextEvent, toRaceState } from "../sim";
import { weekend } from "../sim/simTestKit";
import { circuitFor } from "../venue";
import { liveCarAt, liveSafetyCarWindows, liveYellowsAt, standingsAt } from "../../components/raceClock";
import { NEXT_EVENT_TYPES, createRaceSession } from "./raceSession";
import { applyTick, createRaceClient, mirrorOf } from "./raceClient";

const sunday = (seed = "worker") => {
  const w = weekend({ seed });
  return { ...w, args: weekendRaceArgs(w.career) };
};

/** What the finished race says, as compared byte for byte (RNF-05). */
const fingerprint = (state) => JSON.stringify({ rows: classificationOf(state), events: state.events, duels: state.duels, radio: state.radio, fastest: state.fastestLap, history: state.cars.map((car) => car.history) });

describe("SRS 4 race worker: the session handler", () => {
  it("takes the career's race arguments as plain, cloneable data (postMessage)", () => {
    const { args } = sunday();
    expect(() => serialize(args)).not.toThrow();
    // And the race state as the view and career read it, too.
    const state = createStepRace(args);
    expect(() => serialize(toRaceState(state))).not.toThrow();
  });

  it("creates the race and replies with plain data, the era's orders and the step", () => {
    const { args } = sunday();
    const session = createRaceSession();
    const reply = session.handle({ id: 1, type: "create", args });
    expect(reply).toMatchObject({ id: 1, type: "created", dt: 0.25 });
    expect(() => serialize(reply)).not.toThrow();
    expect(reply.state._sim).toBeUndefined();
    expect(reply.state.cars).toHaveLength(args.entrants.length);
    expect(reply.commands.pace.length).toBeGreaterThan(0);
    expect(reply.view.snapshot).toHaveLength(args.entrants.length);
  });

  it("keeps the snapshot fields that hang on the array (start, sc, vsc, debris, weather, spray) through the copy", () => {
    // F1M24-GAMEPLAY §1.7 / F1M24-CHINA §1.5: JSON drops an array's own keys; the HUD fade (snapshot.start),
    // the safety car and the water/spray of the view and the sound read them from here.
    const { args } = sunday();
    const session = createRaceSession();
    const reply = session.handle({ id: 1, type: "create", args });
    const shot = reply.view.snapshot;
    ["start", "sc", "vsc", "debris", "weather", "spray"].forEach((key) => expect(Object.prototype.hasOwnProperty.call(shot, key)).toBe(true));
    expect(shot.spray).toHaveLength(args.entrants.length);
    expect(shot.weather).toEqual(expect.any(Object));
    expect(() => serialize(reply)).not.toThrow();
  });

  it("draws the weave behind the safety car on the view's line only (AUD-C9: trail lateral = lateral + weave)", () => {
    const { args } = sunday();
    const session = createRaceSession();
    const reply = session.handle({ id: 1, type: "create", args });
    const shot = reply.view.snapshot;
    const last = reply.view.trail[reply.view.trail.length - 1];
    shot.forEach((car, i) => expect(last.l[i]).toBeCloseTo((car.lateral ?? 0) + (car.weave || 0), 6));
  });

  it("RF-SIM-15 / RNF-05: the same messages give the same race as the sim in-thread, byte for byte", () => {
    const { args, career } = sunday("determinism");
    const userId = args.entrants.find((entrant) => entrant.isUser).id;

    // In-thread, straight on the sim API.
    const direct = createStepRace(args);
    stepFor(direct, 0.6);
    for (let k = 0; k < 400; k += 1) stepFor(direct, 1 / 60 * 8);
    setMode(direct, userId, "push");
    stepFor(direct, 300);
    setErs(direct, userId, "deploy");
    requestPit(direct, userId, "hard");
    stepToNextEvent(direct, NEXT_EVENT_TYPES);
    stepFor(direct, 120.5);
    runStepToFinish(direct);

    // The same race through the protocol.
    const session = createRaceSession();
    session.handle({ type: "create", args });
    session.handle({ type: "step", seconds: 0.6 });
    for (let k = 0; k < 400; k += 1) session.handle({ type: "step", seconds: 1 / 60 * 8 });
    session.handle({ type: "command", name: "setMode", args: [userId, "push"] });
    session.handle({ type: "step", seconds: 300 });
    session.handle({ type: "command", name: "setErs", args: [userId, "deploy"] });
    session.handle({ type: "command", name: "requestPit", args: [userId, "hard"] });
    session.handle({ type: "next" });
    session.handle({ type: "step", seconds: 120.5 });
    const done = session.handle({ type: "finish" });

    expect(done.type).toBe("finished");
    expect(fingerprint(done.state)).toBe(fingerprint(toRaceState(direct)));
    // The order log records when each order landed, for a replay of the same race.
    expect(done.commands.map((entry) => entry.name)).toEqual(["setMode", "setErs", "requestPit"]);
    done.commands.forEach((entry) => expect(entry.clock).toBeGreaterThan(0));

    // And the career commits it (completeRace reads the finished copy unchanged).
    const summary = completeRace(career, done.state);
    expect(summary.rows[0].position).toBe(1);
  });

  it("RF-CMD-04: steps advance the race clock by what the view asks (×1…×16 is just more seconds)", () => {
    const { args } = sunday();
    const session = createRaceSession();
    session.handle({ type: "create", args });
    [1, 2, 4, 8, 16].forEach((speed) => {
      const before = session.peek().clock;
      const tick = session.handle({ type: "step", seconds: 2 * speed });
      expect(tick.type).toBe("tick");
      expect(tick.clock - before).toBeCloseTo(2 * speed, 6);
    });
  });

  it("RF-CMD-04: 'next' stops at a relevant event and the tick carries it, stamped with its race time", () => {
    const { args } = sunday();
    const session = createRaceSession();
    session.handle({ type: "create", args });
    session.handle({ type: "step", seconds: 10 });
    const tick = session.handle({ type: "next" });
    expect(tick.events.some((event) => NEXT_EVENT_TYPES.includes(event.type))).toBe(true);
    tick.events.forEach((event) => expect(event.at).toBeCloseTo(tick.clock, 3));
  });

  it("ticks are incremental: every event, radio call and line crossing reaches the view exactly once", () => {
    const { args } = sunday("incremental");
    const session = createRaceSession();
    const created = session.handle({ type: "create", args });
    const mirror = mirrorOf(created);
    let final = null;
    while (!final) {
      const tick = session.handle({ type: "step", seconds: 37 });
      applyTick(mirror, tick);
      final = tick.final;
    }
    const truth = final.state;
    expect(mirror.finished).toBe(true);
    expect(mirror.events.map(({ at, ...event }) => event)).toEqual(truth.events);
    expect(mirror.radio.map(({ at, ...message }) => message)).toEqual(truth.radio);
    expect(mirror.duels.map(({ at, ...duel }) => duel)).toEqual(truth.duels);
    mirror.cars.forEach((car, index) => {
      expect(car.history).toEqual(truth.cars[index].history);
      expect(car.status).toBe(truth.cars[index].status);
      expect(car.position).toBe(truth.cars[index].position);
    });
  });

  it("rejects unknown orders and messages before a race exists, without throwing", () => {
    const session = createRaceSession();
    expect(session.handle({ id: 3, type: "step", seconds: 1 })).toMatchObject({ id: 3, type: "error" });
    session.handle({ type: "create", args: sunday().args });
    expect(session.handle({ type: "command", name: "eval", args: [] })).toMatchObject({ type: "error" });
  });

  it("'lap' runs until the leader starts a new lap", () => {
    const session = createRaceSession();
    session.handle({ type: "create", args: sunday().args });
    const tick = session.handle({ type: "lap" });
    expect(tick.lap).toBe(1);
    expect(session.handle({ type: "lap" }).lap).toBe(2);
  });
});

describe("SRS 4 race client: in-thread fallback where there is no Worker (jsdom)", () => {
  it("runs the same session synchronously and replays identically", () => {
    const { args } = sunday("client");
    const replies = [];
    const client = createRaceClient({ listener: (reply) => replies.push(reply) });
    expect(client.kind).toBe("inline");
    client.create(args);
    client.step(30);
    client.command("requestPit", args.entrants.find((entrant) => entrant.isUser).id, "medium");
    client.finish();
    expect(client.busy).toBe(false);
    expect(replies.map((reply) => reply.type)).toEqual(["created", "tick", "tick", "finished"]);
    client.dispose();

    const session = createRaceSession();
    session.handle({ type: "create", args });
    session.handle({ type: "step", seconds: 30 });
    session.handle({ type: "command", name: "requestPit", args: [args.entrants.find((entrant) => entrant.isUser).id, "medium"] });
    expect(fingerprint(replies[3].state)).toBe(fingerprint(session.handle({ type: "finish" }).state));
  });
});

describe("RF-WKD-02 career: live Sunday in steps, instant Sunday in the quick mode", () => {
  it("builds the live race as the step sim and the instant one as the quick mode, from the same arguments", () => {
    const { career } = sunday("career");
    const live = createLiveWeekendRace(career);
    const quick = createWeekendRace(career);
    expect(live.mode).toBe("step");
    expect(live._sim).toBeDefined();
    expect(quick.mode).not.toBe("step");
    expect(quick.cars.map((car) => car.id)).toEqual(live.cars.map((car) => car.id));
  });

  it("completeRace finishes a step race in its simulator, and refuses a stripped unfinished one", () => {
    const a = sunday("complete");
    const stripped = toRaceState(createLiveWeekendRace(a.career));
    expect(() => completeRace(a.career, stripped)).toThrow(/step race/);
    const summary = completeRace(a.career, createLiveWeekendRace(a.career));
    expect(summary.rows.length).toBeGreaterThan(0);
    expect(a.career.weekend.result).toBeTruthy();
  });

  it("completeRace still runs a quick race to the flag (simulate)", () => {
    const b = sunday("quick");
    const summary = completeRace(b.career, createWeekendRace(b.career));
    expect(summary.rows[0].position).toBe(1);
  });
});

describe("RNF-09 / SRS 4 live view: positions from the worker's snapshots (raceClock.liveCarAt)", () => {
  it("puts every car where the simulator has it at each step, and in between on the road", () => {
    const { args } = sunday("live-pose");
    const session = createRaceSession();
    const mirror = mirrorOf(session.handle({ type: "create", args }));
    for (let k = 0; k < 40; k += 1) applyTick(mirror, session.handle({ type: "step", seconds: 4 }));
    const circuit = circuitFor(mirror.race, mirror.year);
    const lapRef = mirror.race.baseLap;
    const shots = mirror.snapshots;
    expect(shots.length).toBeGreaterThan(100);
    const shot = shots[shots.length - 10];
    mirror.cars.forEach((car, index) => {
      const pose = liveCarAt(mirror, car, shot.clock, circuit, lapRef);
      expect(Number.isFinite(pose.x) && Number.isFinite(pose.y)).toBe(true);
      if (car.status === "running") expect(pose.progress).toBeCloseTo(shot.p[index], 6);
    });
    // Half a step later: between the two snapshots, never behind the first.
    const next = shots[shots.length - 9];
    const mid = (shot.clock + next.clock) / 2;
    mirror.cars.forEach((car, index) => {
      if (car.status !== "running") return;
      const pose = liveCarAt(mirror, car, mid, circuit, lapRef);
      expect(pose.progress).toBeGreaterThanOrEqual(Math.min(shot.p[index], next.p[index]) - 1e-9);
      expect(pose.progress).toBeLessThanOrEqual(Math.max(shot.p[index], next.p[index]) + 1e-9);
    });
    // The timing tower reads the same rows the replay does (RNF-09: tables without 3D).
    const rows = standingsAt(mirror.cars, shot.clock, circuit, lapRef, (car, tau) => liveCarAt(mirror, car, tau, circuit, lapRef));
    expect(rows).toHaveLength(mirror.cars.length);
    rows.forEach((row, index) => expect(row.position).toBe(index + 1));
    expect(rows.filter((row) => !row.out && row.position > 1).every((row) => row.gap === undefined || row.gap >= 0)).toBe(true);
  });

  it("puts the grid on the grid before the lights", () => {
    const { args } = sunday("grid");
    const session = createRaceSession();
    const mirror = mirrorOf(session.handle({ type: "create", args }));
    const circuit = circuitFor(mirror.race, mirror.year);
    mirror.cars.forEach((car) => expect(liveCarAt(mirror, car, 0, circuit, 90).onGrid).toBe(true));
  });
});

describe("RF-SIM-10 race control reaches the view", () => {
  it("ticks carry local yellows and the safety-car spells, red flags marked as such", () => {
    const session = createRaceSession();
    const mirror = mirrorOf(session.handle({ type: "create", args: sunday("control").args }));
    applyTick(mirror, session.handle({ type: "step", seconds: 30 }));
    expect(Array.isArray(mirror.yellowZones)).toBe(true);
    expect(Array.isArray(mirror.safetyCarSpells)).toBe(true);
    mirror.safetyCarSpells = [{ from: 10, to: null, virtual: false, red: true }, { from: 100, to: 160, virtual: true }];
    expect(liveSafetyCarWindows(mirror)).toEqual([
      { from: 10, to: Infinity, virtual: false, red: true },
      { from: 100, to: 160, virtual: true, red: false },
    ]);
    mirror.yellowZones = [{ corner: 4, until: 50 }, { corner: 9, until: 20 }];
    expect(liveYellowsAt(mirror, 30).map((zone) => zone.corner)).toEqual([4]);
  });
});
