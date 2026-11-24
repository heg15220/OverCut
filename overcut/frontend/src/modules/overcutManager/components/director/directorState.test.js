/**
 * The pure TV director (RF-3D-04, RNF-07, RNF-09; F1M24-GAMEPLAY §2.5 director-follow-focus,
 * CAM-1): broadcast.json passes its complete schema, and with the focused car fixed the TV
 * never films another subject unless "follow the action" is switched on.
 */

import Ajv from "ajv";
import schema from "../../engine/packs/schema/broadcast.schema.json";
import broadcast from "../../data/balance/broadcast.json";
import cameraData from "../../data/balance/cameras.json";
import { battlesOf, cameraFor, directorState, rivalOf } from "./directorState";
import { battlesIn } from "../raceClock";

// A small seeded generator for the test fields (RF-SIM-15: no Math.random in tests either).
const lcg = (seed) => {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
};

const RIG = [
  { id: "braking-0", type: "braking", from: 0.0, to: 0.2, priority: 3 },
  { id: "corner-1", type: "corner", from: 0.15, to: 0.45, priority: 2 },
  { id: "straight-2", type: "straight", from: 0.4, to: 0.8, priority: 1 },
  { id: "grandstand-3", type: "grandstand", from: 0.75, to: 1.02, priority: 4 },
];

/** A timing field of `n` cars, leader first, with gaps that put some of them in fights. */
const fieldOf = (rand, n = 20, { userIndex = 7 } = {}) => {
  const rows = [];
  let progress = 0.9;
  for (let i = 0; i < n; i += 1) {
    const interval = i === 0 ? undefined : rand() < 0.4 ? rand() * 0.9 : 1 + rand() * 4;
    progress -= (interval ?? 0) * 0.0006 + 0.0005;
    rows.push({
      car: { id: `c${i}`, isUser: i === userIndex },
      position: i + 1,
      interval,
      lapsDown: 0,
      out: false,
      pose: { progress: ((progress % 1) + 1) % 1, inPit: rand() < 0.05, gone: false },
    });
  }
  return rows;
};

const followOn = { ...broadcast.director, followAction: { ...broadcast.director.followAction, enabled: true } };

describe("broadcast.json (RNF-07)", () => {
  test("passes its complete schema", () => {
    const validate = new Ajv({ allErrors: true, strict: true }).compile(schema);
    const ok = validate(broadcast);
    expect(validate.errors).toBeNull();
    expect(ok).toBe(true);
  });

  test("follow the action is off by default; every block another package wires is marked", () => {
    expect(broadcast.director.followAction.enabled).toBe(false);
    ["cycleOrder", "defaultView", "rigTemplate", "framing", "zonesPolicy", "replay", "scLights"].forEach((key) => expect(["pending", "current", "sourced"]).toContain(broadcast[key].status));
    Object.values(broadcast.sequences).forEach((sequence) => expect(sequence.status).toBe("pending"));
    expect(broadcast.inserts.onboard.status).toBe("pending");
  });

  test("the camera cycle names only cameras that exist", () => {
    const known = new Set(["tv", "chase", "drone", "heli", ...cameraData.onboard.filter((entry) => !entry.replayOnly).map((entry) => entry.id)]);
    broadcast.cycleOrder.cameras.forEach((id) => expect(known.has(id)).toBe(true));
  });
});

describe("directorState (F1M24-GAMEPLAY §2.5)", () => {
  test("with a fixed focus the TV never films another subject (300 seeded fields)", () => {
    for (let seed = 1; seed <= 300; seed += 1) {
      const rand = lcg(seed);
      const rows = fieldOf(rand);
      const focusId = `c${Math.floor(rand() * rows.length)}`;
      let prev = null;
      for (let tick = 0; tick < 5; tick += 1) {
        const shot = directorState(focusId, rows, [], RIG, { now: tick * 3, prev });
        expect(shot.subjectIds[0]).toBe(focusId);
        expect(shot.reason).toBe("focus");
        expect(shot.subjectIds.length).toBeLessThanOrEqual(2);
        prev = shot;
      }
    }
  });

  test("frames the rival with the focused car when they are racing", () => {
    const rows = fieldOf(lcg(5));
    rows[4].interval = 0.4;
    rows[4].pose.inPit = false;
    rows[3].pose.inPit = false;
    rows[2].pose.inPit = false;
    rows[3].interval = 2;
    rows[5].interval = 3;
    const attacker = directorState("c4", rows, [], RIG, {});
    expect(attacker).toMatchObject({ shotKind: "battle", subjectIds: ["c4", "c3"] });
    const defender = directorState("c3", rows, [], RIG, {});
    expect(defender.subjectIds).toEqual(["c3", "c4"]);
  });

  test("the SIM-4 battle state, when the snapshot has it, decides the fight", () => {
    const rows = fieldOf(lcg(9)).map((row) => ({ ...row, pose: { ...row.pose, inPit: false } }));
    rows[6].battle = "DEFENDING";
    rows[6].interval = 0.2;
    expect(rivalOf(rows, "c6")).toBe("c7");
    rows[6].battle = "FOLLOWING";
    expect(rivalOf(rows, "c6")).toBeNull();
    expect(directorState("c6", rows, [], RIG, {}).shotKind).toBe("zone");
  });

  test("a car in the pit lane is a pit shot; a retired focus hands over to the leader", () => {
    const rows = fieldOf(lcg(3));
    rows[2].pose.inPit = true;
    expect(directorState("c2", rows, [], RIG, {})).toMatchObject({ shotKind: "pit", subjectIds: ["c2"], reason: "focus" });
    rows[2].out = true;
    expect(directorState("c2", rows, [], RIG, {})).toMatchObject({ subjectIds: ["c0"], reason: "focusGone" });
    expect(directorState(null, rows, [], RIG, {}).reason).toBe("leader");
    expect(directorState("c1", [], [], RIG, {})).toMatchObject({ shotKind: "none", subjectIds: [] });
  });

  test("keeps the camera on air while the car is still in its stretch, else the highest priority", () => {
    expect(cameraFor(RIG, 0.17).id).toBe("braking-0");
    expect(cameraFor(RIG, 0.17, "corner-1").id).toBe("corner-1");
    expect(cameraFor(RIG, 0.5, "corner-1").id).toBe("straight-2");
    expect(cameraFor(RIG, 0.01).id).toBe("grandstand-3");
    expect(cameraFor([], 0.3)).toBeNull();
  });

  test("follow the action (opt-in) takes the user's fight and holds it holdSec", () => {
    const rows = fieldOf(lcg(11), 20, { userIndex: 9 }).map((row) => ({ ...row, pose: { ...row.pose, inPit: false } }));
    rows.forEach((row, i) => {
      if (i) row.interval = 2;
    });
    rows[3].interval = 0.5;
    rows[9].interval = 0.6;
    const first = directorState("c15", rows, [], RIG, { now: 100 }, followOn);
    expect(first).toMatchObject({ reason: "followAction", subjectIds: ["c9", "c8"] });
    expect(first.hold).toEqual({ id: "c9", until: 100 + broadcast.director.followAction.holdSec });
    // The user's fight ends; the hold keeps nothing that is no longer a fight.
    rows[9].interval = 2;
    const next = directorState("c15", rows, [], RIG, { now: 101, prev: first }, followOn);
    expect(next.subjectIds[0]).toBe("c3");
  });

  test("battlesOf matches raceClock.battlesIn on the same rows", () => {
    for (let seed = 1; seed <= 50; seed += 1) {
      const rows = fieldOf(lcg(seed));
      const ours = battlesOf(rows).map((battle) => [battle.attacker.car.id, battle.defender.car.id]);
      const theirs = battlesIn(rows).map((battle) => [battle.attacker.car.id, battle.defender.car.id]);
      expect(ours).toEqual(theirs);
    }
  });

  test("pure: the same inputs give the same shot, and the rows are not touched", () => {
    const rows = fieldOf(lcg(21));
    const before = JSON.stringify(rows);
    const a = directorState("c5", rows, [], RIG, { now: 4 });
    const b = directorState("c5", rows, [], RIG, { now: 4 });
    expect(a).toEqual(b);
    expect(JSON.stringify(rows)).toBe(before);
  });
});
