/**
 * CAM-3 replays (F1M24-GAMEPLAY §2.5 replays, buffer-repeticion, §1.5; RF-3D-04, RF-SIM-15,
 * RNF-05, RNF-07): the view's buffer of the last 25 s, what triggers a replay, the queue, the
 * plan of each replay - and the acceptance test of §3.3: watching a replay does not change the
 * race (RNF-05), byte for byte.
 */

import { classificationOf } from "../../engine/race";
import { weekendRaceArgs } from "../../engine/career";
import { weekend } from "../../engine/sim/simTestKit";
import { circuitFor } from "../../engine/venue";
import { createRaceSession } from "../../engine/worker/raceSession";
import { applyTick, mirrorOf } from "../../engine/worker/raceClient";
import { liveCarAt } from "../raceClock";
import broadcast from "../../data/balance/broadcast.json";
import cameraData from "../../data/balance/cameras.json";
import {
  REPLAY, createReplayBuffer, createReplayQueue, enqueueReplay, nextReplay, planReplay, recordReplay, replayFrameAt, replayPoseAt, replaySpan, replayTriggerOf, tracksideFor,
} from "./replayBuffer";

/** What the finished race says, compared byte for byte (as raceWorker.test.js does). */
const fingerprint = (state) => JSON.stringify({ rows: classificationOf(state), events: state.events, duels: state.duels, radio: state.radio, fastest: state.fastestLap, history: state.cars.map((car) => car.history) });

const liveRace = (seed) => {
  const w = weekend({ seed });
  const args = weekendRaceArgs(w.career);
  const session = createRaceSession();
  const mirror = mirrorOf(session.handle({ type: "create", args }));
  const circuit = circuitFor(mirror.race, mirror.year);
  const lapRef = mirror.race.baseLap;
  const byId = new Map(mirror.cars.map((car) => [car.id, car]));
  const sampleAt = (id, t) => liveCarAt(mirror, byId.get(id), t, circuit, lapRef);
  const userIds = new Set(args.entrants.filter((entrant) => entrant.isUser).map((entrant) => entrant.id));
  return { args, session, mirror, circuit, sampleAt, ids: [...byId.keys()], userIds };
};

describe("broadcast.json replay block (RNF-07)", () => {
  it("is the unification decision of §1.5: 25 s at 10 Hz, every value of the replay in data", () => {
    expect(REPLAY.bufferSec).toBe(25);
    expect(REPLAY.sampleHz).toBe(10);
    expect(REPLAY).toBe(broadcast.replay);
    ["stingSec", "maxSec", "preSec", "postSec", "cooldownSec"].forEach((key) => expect(Number.isFinite(REPLAY[key])).toBe(true));
    expect(REPLAY.preSec + REPLAY.postSec).toBeLessThanOrEqual(REPLAY.bufferSec);
    expect(REPLAY.angles.min).toBeLessThanOrEqual(REPLAY.angles.max);
    // The onboard and close-up angles are cameras of cameras.json; the close-up is replay-only.
    const ids = cameraData.onboard.map((cam) => cam.id);
    expect(ids).toContain(REPLAY.onboard);
    expect(cameraData.onboard.find((cam) => cam.id === REPLAY.closeUp).replayOnly).toBe(true);
  });
});

describe("the buffer (22 cars × 25 s × 10 Hz)", () => {
  it("samples fixed instants of the race clock, keeps bufferSec and eases between samples", () => {
    const buffer = createReplayBuffer();
    // A car going round at 1 share per 100 s; heading turning through ±π.
    const sampleAt = (id, t) => ({ x: t * 10, y: id === "b" ? 1 : 0, progress: t / 100, heading: ((t * 0.5 + Math.PI) % (2 * Math.PI)) - Math.PI, inPit: false });
    for (let tau = 0; tau <= 60; tau += 0.37) recordReplay(buffer, tau, ["a", "b"], sampleAt);
    const span = replaySpan(buffer);
    expect(buffer.frames).toHaveLength(buffer.cap);
    expect(span.to - span.from).toBeCloseTo(REPLAY.bufferSec, 9);
    buffer.frames.forEach((frame) => expect(Math.abs(frame.tau * REPLAY.sampleHz - Math.round(frame.tau * REPLAY.sampleHz))).toBeLessThan(1e-9));
    const mid = replayPoseAt(buffer, "a", span.to - 0.05);
    expect(mid.x).toBeCloseTo((span.to - 0.05) * 10, 6);
    expect(replayPoseAt(buffer, "b", span.from).y).toBe(1);
    expect(replayPoseAt(buffer, "nobody", span.to)).toBeNull();
  });

  it("fills the same way at any frame rate or playback speed (RNF-05)", () => {
    const sampleAt = (id, t) => ({ x: Math.sin(t) * 100, y: Math.cos(t) * 50, progress: t / 90, heading: t % 3, inPit: false });
    const fast = createReplayBuffer();
    const slow = createReplayBuffer();
    for (let tau = 0; tau <= 80; tau += 1 / 60) recordReplay(fast, tau, ["a"], sampleAt);
    for (let tau = 0; tau <= 80; tau += 1.9) recordReplay(slow, tau, ["a"], sampleAt);
    recordReplay(fast, 80, ["a"], sampleAt);
    recordReplay(slow, 80, ["a"], sampleAt);
    expect(JSON.stringify(slow.frames)).toBe(JSON.stringify(fast.frames));
  });

  it("starts over when the clock goes back (a restart)", () => {
    const buffer = createReplayBuffer();
    const sampleAt = (id, t) => ({ x: t, y: 0, progress: 0, heading: 0 });
    recordReplay(buffer, 30, ["a"], sampleAt);
    recordReplay(buffer, 5, ["a"], sampleAt);
    expect(replaySpan(buffer).to).toBeCloseTo(5, 9);
  });
});

describe("what triggers a replay, and the queue", () => {
  const users = new Set(["me"]);
  it("follows replay.triggers and replay.scope", () => {
    expect(replayTriggerOf({ type: "pass", carId: "me", otherId: "x" }, { userIds: users })).toBe("pass");
    expect(replayTriggerOf({ type: "pass", carId: "x", otherId: "me" }, { userIds: users })).toBe("pass");
    expect(replayTriggerOf({ type: "pass", carId: "x", otherId: "y" }, { userIds: users })).toBeNull();
    expect(replayTriggerOf({ type: "mistake", carId: "y" }, { userIds: users })).toBe("mistake");
    expect(replayTriggerOf({ type: "pit", carId: "me" }, { userIds: users })).toBeNull();
    expect(replayTriggerOf({ type: "pit", carId: "y" }, { userIds: users })).toBe("pitOther");
    expect(replayTriggerOf({ type: "flag", carId: "y" }, { userIds: users })).toBe("finish");
    // SIM-3's `finished` event (§1.7), when the engine sends it: the winner's.
    expect(replayTriggerOf({ type: "finished", carId: "y", pos: 1 }, { userIds: users })).toBe("finish");
    expect(replayTriggerOf({ type: "finished", carId: "y", pos: 4 }, { userIds: users })).toBeNull();
    expect(replayTriggerOf({ type: "lead", carId: "me" }, { userIds: users })).toBeNull();
    const off = { ...REPLAY, triggers: { ...REPLAY.triggers, mistake: false } };
    expect(replayTriggerOf({ type: "mistake", carId: "y" }, { userIds: users, config: off })).toBeNull();
  });

  it("plays one at a time, waits for postSec, never while blocked, drops stale ones and keeps the cooldown", () => {
    let queue = createReplayQueue();
    queue = enqueueReplay(queue, { type: "pass", carId: "me", otherId: "x", at: 100 }, { userIds: users });
    queue = enqueueReplay(queue, { type: "mistake", carId: "y", at: 101 }, { userIds: users });
    queue = enqueueReplay(queue, { type: "pass", carId: "x", otherId: "y", at: 102 }, { userIds: users });
    expect(queue.items).toHaveLength(2);
    const buffer = createReplayBuffer();
    for (let tau = 90; tau <= 110; tau += 1) recordReplay(buffer, tau, ["me"], (id, t) => ({ x: t, y: 0, progress: 0, heading: 0 }));
    // Not before the event's postSec is in the buffer.
    expect(nextReplay(queue, { tau: 100 + REPLAY.postSec - 0.1, buffer }).item).toBeNull();
    // Never while the car on air is in its pit sequence (the stop is not cut) or a replay plays.
    expect(nextReplay(queue, { tau: 110, buffer, blocked: true }).item).toBeNull();
    const first = nextReplay(queue, { tau: 110, buffer });
    expect(first.item.trigger).toBe("pass");
    // The mistake a second later falls inside the cooldown: dropped.
    const second = nextReplay(first.queue, { tau: 110, buffer });
    expect(second.item).toBeNull();
    expect(second.queue.items).toHaveLength(0);
    // Pure: the first queue was not touched.
    expect(queue.items).toHaveLength(2);
    // One whose moment has left the buffer is dropped too.
    const old = enqueueReplay(createReplayQueue(), { type: "pass", carId: "me", otherId: "x", at: 50 }, { userIds: users });
    expect(nextReplay(old, { tau: 110, buffer }).item).toBeNull();
  });
});

describe("the plan of a replay", () => {
  const buffer = createReplayBuffer();
  for (let tau = 0; tau <= 100; tau += 0.5) recordReplay(buffer, tau, ["me", "x"], (id, t) => ({ x: t, y: 0, progress: t / 90, heading: 0 }));

  it("shows preSec before to postSec after, inside the buffer and never longer than maxSec", () => {
    const plan = planReplay({ trigger: "pass", event: { type: "pass", carId: "me", otherId: "x" }, at: 96 }, buffer, { year: 2024, seed: 7 });
    expect(plan.to).toBeCloseTo(Math.min(100, 96 + REPLAY.postSec), 9);
    expect(plan.from).toBeCloseTo(Math.max(96 - REPLAY.preSec, plan.to - REPLAY.maxSec), 9);
    expect(plan.contentSec).toBeLessThanOrEqual(REPLAY.maxSec + 1e-9);
    expect(plan.totalSec).toBeCloseTo(plan.contentSec + 2 * REPLAY.stingSec, 9);
    expect(plan.angles.length).toBeGreaterThanOrEqual(REPLAY.angles.min);
    expect(plan.angles.length).toBeLessThanOrEqual(REPLAY.angles.max);
    plan.angles.forEach((angle) => expect(angle.to - angle.from).toBeGreaterThanOrEqual(REPLAY.angles.minSec - 1e-9));
    expect(plan.angles[0].from).toBeCloseTo(plan.from, 9);
    expect(plan.angles[plan.angles.length - 1].to).toBeCloseTo(plan.to, 9);
    // Deterministic by seed.
    expect(planReplay({ trigger: "pass", event: { type: "pass", carId: "me", otherId: "x" }, at: 96 }, buffer, { year: 2024, seed: 7 })).toEqual(plan);
  });

  it("only uses onboards the season's cars carried (SRS 6.2) and the close-up only at the finish", () => {
    const item = { trigger: "pass", event: { type: "pass", carId: "me" }, at: 96 };
    const modern = planReplay(item, buffer, { year: 2024 });
    expect(modern.angles.some((angle) => angle.cam === REPLAY.onboard)).toBe(true);
    const old = planReplay(item, buffer, { year: 1976 });
    expect(old.angles.every((angle) => angle.kind === "trackside")).toBe(true);
    expect(modern.angles.some((angle) => angle.cam === REPLAY.closeUp)).toBe(false);
    const finish = planReplay({ trigger: "finish", event: { type: "flag", carId: "me" }, at: 96 }, buffer, { year: 2024 });
    expect(finish.angles[finish.angles.length - 1].cam).toBe(REPLAY.closeUp);
  });

  it("goes sting in → content → sting out → done, on the replay's own clock", () => {
    const plan = planReplay({ trigger: "mistake", event: { type: "mistake", carId: "x" }, at: 90 }, buffer, { year: 2024 });
    expect(replayFrameAt(plan, 0)).toMatchObject({ phase: "stingIn", tau: plan.from });
    expect(replayFrameAt(plan, plan.stingSec + 1).phase).toBe("content");
    expect(replayFrameAt(plan, plan.stingSec + 1).tau).toBeCloseTo(plan.from + 1, 9);
    expect(replayFrameAt(plan, plan.stingSec + plan.contentSec + 0.01).phase).toBe("stingOut");
    expect(replayFrameAt(plan, plan.totalSec).phase).toBe("done");
  });

  it("picks trackside cameras that cover the place, a different one per slot when it can", () => {
    const rig = [
      { id: "a", type: "corner", from: 0.1, to: 0.3 },
      { id: "b", type: "braking", from: 0.15, to: 0.25 },
      { id: "c", type: "straight", from: 0.5, to: 0.7 },
      { id: "k", type: "cable", from: 0.1, to: 0.3 },
    ];
    const first = tracksideFor(rig, 0.2, 0, 3);
    const second = tracksideFor(rig, 0.2, 1, 3);
    expect(["a", "b"]).toContain(first.id);
    expect(second.id).not.toBe(first.id);
    expect(tracksideFor(rig, 0.9, 0, 3)).toBeNull();
  });
});

describe("RNF-05: a replay does not change the race (F1M24-GAMEPLAY §3.3 CAM-3)", () => {
  it("the same seed gives the same race, byte for byte, with and without replays watched", () => {
    const run = (watch) => {
      const { session, mirror, sampleAt, ids, userIds } = liveRace("replay-rnf05");
      const buffer = createReplayBuffer();
      let queue = createReplayQueue();
      let played = 0;
      let final = null;
      while (!final) {
        const tick = session.handle({ type: "step", seconds: 1 });
        applyTick(mirror, tick);
        final = tick.final;
        if (!watch) continue;
        recordReplay(buffer, mirror.clock, ids, sampleAt);
        tick.events.forEach((event) => {
          queue = enqueueReplay(queue, event, { userIds, config: { ...REPLAY, scope: { ...REPLAY.scope, pass: "any" } } });
        });
        const next = nextReplay(queue, { tau: mirror.clock, buffer });
        queue = next.queue;
        if (!next.item) continue;
        const plan = planReplay(next.item, buffer, { year: mirror.year, seed: "replay-rnf05" });
        // Watch the whole replay: the race clock does not move while it plays (pauseSim).
        for (let elapsed = 0; elapsed <= plan.totalSec; elapsed += 0.1) {
          const frame = replayFrameAt(plan, elapsed);
          ids.forEach((id) => replayPoseAt(buffer, id, frame.tau));
        }
        played += 1;
      }
      return { print: fingerprint(final.state), played };
    };
    const plain = run(false);
    const watched = run(true);
    expect(watched.played).toBeGreaterThan(0);
    expect(watched.print).toBe(plain.print);
  });
});
