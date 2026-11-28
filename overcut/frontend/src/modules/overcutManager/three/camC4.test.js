/**
 * CAM-C4 (F1M24-CHINA §3.3 ola 5; RF-3D-04, RF-SIM-05, RNF-05, RNF-07, RNF-09, SRS §6):
 *   VIEW-11 name tags by hud.json tags.policy with a 1D repulsion (IoU = 0, ≤ 2 in focus+rival);
 *   VIEW-15 the steering-wheel screen by era with shift lights from pose.rpm and shiftRpm
 *           (full at shiftRpm, ≤ 60 % at 0,85·shiftRpm, same frame as the revs: ≤ 100 ms);
 *   VIEW-10 the low start-lights shot with the gantry in frame (≥ 4 of 5 lights in the frustum,
 *           three.js math, no browser).
 */

import * as THREE from "three";
import Ajv from "ajv";
import cameraSchema from "../engine/packs/schema/cameras.schema.json";
import cameraData from "../data/balance/cameras.json";
import broadcastData from "../data/balance/broadcast.json";
import broadcastSchema from "../engine/packs/schema/broadcast.schema.json";
import hudData from "../data/balance/hud.json";
import hudSchema from "../engine/packs/schema/hud.schema.json";
import { iou, layoutTags, tagPolicyOf, tagSubjects } from "./nameTags";
import { shiftLightsOf, shiftRpmFor, wheelFrameOf, wheelLayoutFor, WHEEL_DISPLAY } from "./wheelDisplay";
import { START_GANTRY, gantryLightPoints, scriptAnchorM, scriptShot } from "./cameras";
import { eraOf as powertrainEraOf } from "../engine/sim/powertrain";
import { circuitFor } from "../engine/venue";
import { poseAt } from "../engine/trackGeometry";

// A seeded stream for the stress layouts (RNF-05: no Math.random in tests either).
const streamOf = (seed) => {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

describe("CAM-C4 · VIEW-11: name tags by policy, no overlap (RF-3D-04, RNF-09, RNF-07)", () => {
  const W = 1280;
  const clustered = (seed, n = 20) => {
    const rnd = streamOf(seed);
    return Array.from({ length: n }, (_, i) => ({
      id: `c${i}`,
      x: 500 + rnd() * 260,
      y: 300 + rnd() * 40,
      w: 90 + rnd() * 50,
      h: 22,
      carWidthPx: 20 + rnd() * 120,
    }));
  };
  const visibleOf = (laid) => laid.filter((box) => box.visible);
  const maxIou = (boxes) => {
    let worst = 0;
    for (let i = 0; i < boxes.length; i += 1) for (let j = i + 1; j < boxes.length; j += 1) worst = Math.max(worst, iou(boxes[i], boxes[j]));
    return worst;
  };

  it("reads hud.json tags (the HUD-C1 contract) against its schema; focus+rival is the default", () => {
    const ajv = new Ajv({ allErrors: true });
    expect(ajv.validate(hudSchema, hudData)).toBe(true);
    expect(hudData.tags.policy).toBe("focus+rival");
    expect(tagPolicyOf()).toBe("focus+rival");
    expect(tagPolicyOf("all")).toBe("all");
    expect(tagPolicyOf("bogus")).toBe("focus+rival");
  });

  it("IoU = 0 between the visible tags, for every policy, over 50 seeded crowds", () => {
    hudData.tags.policies.forEach((policy) => {
      for (let seed = 1; seed <= 50; seed += 1) {
        const laid = layoutTags(clustered(seed), { policy, focusId: "c3", rivalId: "c7", viewWidth: W });
        expect(maxIou(visibleOf(laid))).toBe(0);
      }
    });
  });

  it("focus+rival shows at most maxVisible (2) tags: the focus and its rival", () => {
    for (let seed = 1; seed <= 50; seed += 1) {
      const crowd = clustered(seed).map((c) => ({ ...c, carWidthPx: 200 }));
      const shown = visibleOf(layoutTags(crowd, { policy: "focus+rival", focusId: "c3", rivalId: "c7", viewWidth: W }));
      expect(shown.length).toBeLessThanOrEqual(hudData.tags.maxVisible);
      expect(shown.map((box) => box.id).sort()).toEqual(["c3", "c7"]);
      expect(maxIou(shown)).toBe(0);
    }
    expect(tagSubjects({ policy: "focus+rival", focusId: "a", rivalId: null, ids: ["a", "b"] })).toEqual(["a"]);
    expect(tagSubjects({ policy: "focus", focusId: "a", rivalId: "b", ids: ["a", "b"] })).toEqual(["a"]);
    expect(tagSubjects({ policy: "none", focusId: "a", rivalId: "b", ids: ["a", "b"] })).toEqual([]);
    expect(tagSubjects({ policy: "all", focusId: "b", rivalId: null, ids: ["a", "b", "c"] })).toEqual(["b", "a", "c"]);
  });

  it("a car narrower than hideBelowWidthShare of the canvas carries no tag, the focus included", () => {
    const narrow = hudData.tags.hideBelowWidthShare * W * 0.9;
    const laid = layoutTags(
      [
        { id: "f", x: 600, y: 300, w: 100, h: 22, carWidthPx: narrow },
        { id: "r", x: 640, y: 300, w: 100, h: 22, carWidthPx: 80 },
      ],
      { policy: "focus+rival", focusId: "f", rivalId: "r", viewWidth: W },
    );
    expect(laid.find((box) => box.id === "f").visible).toBe(false);
    expect(laid.find((box) => box.id === "r").visible).toBe(true);
  });

  it("two tags on top of each other are pushed apart sideways, in their row (1D repulsion), deterministically", () => {
    const pair = [
      { id: "f", x: 640, y: 300, w: 100, h: 22, carWidthPx: 90 },
      { id: "r", x: 650, y: 302, w: 100, h: 22, carWidthPx: 90 },
    ];
    const a = layoutTags(pair, { policy: "focus+rival", focusId: "f", rivalId: "r", viewWidth: W });
    const b = layoutTags(pair, { policy: "focus+rival", focusId: "f", rivalId: "r", viewWidth: W });
    expect(a).toEqual(b);
    expect(iou(a[0], a[1])).toBe(0);
    expect(a[0].top).toBeCloseTo(300 - 22 * 1.3, 6);
    expect(a[1].top).toBeCloseTo(302 - 22 * 1.3, 6);
    // Both stay near their cars: the overlap is shared, not dumped on one.
    expect(Math.abs(a[0].left + 50 - 640)).toBeLessThan(110);
    expect(Math.abs(a[1].left + 50 - 650)).toBeLessThan(110);
  });
});

describe("CAM-C4 · VIEW-15: the steering-wheel screen by era, shift lights from pose.rpm (RF-3D-04, RF-SIM-05, SRS §6, RNF-07)", () => {
  it("cameras.json validates with the lights; every era from 1998 has them; nothing before the wheel had a screen", () => {
    const ajv = new Ajv({ allErrors: true });
    expect(ajv.validate(cameraSchema, cameraData)).toBe(true);
    expect(wheelLayoutFor(WHEEL_DISPLAY.from - 1)).toBeNull();
    expect(wheelLayoutFor(1976)).toBeNull();
    WHEEL_DISPLAY.byEra.forEach((row) => {
      expect(row.leds).not.toBeNull();
      expect(row.leds.count).toBeGreaterThan(0);
      expect(row.status).toBe("pending");
    });
  });

  it("all lights at shiftRpm, ≤ 60 % at 0,85·shiftRpm and none well below, in every year of every era", () => {
    for (let year = WHEEL_DISPLAY.from; year <= 2026; year += 1) {
      const layout = wheelLayoutFor(year);
      const shift = shiftRpmFor(year);
      expect(shift).toBe(powertrainEraOf(year).engine.shiftRpm);
      expect(shiftLightsOf(shift, shift, layout.leds).lit).toBe(layout.leds.count);
      expect(shiftLightsOf(shift * 1.02, shift, layout.leds).lit).toBe(layout.leds.count);
      expect(shiftLightsOf(0.85 * shift, shift, layout.leds).share).toBeLessThanOrEqual(0.6);
      expect(shiftLightsOf(0.5 * shift, shift, layout.leds).lit).toBe(0);
      // Monotone in the revs.
      let last = 0;
      for (let r = 0.5; r <= 1.0001; r += 0.01) {
        const { lit } = shiftLightsOf(r * shift, shift, layout.leds);
        expect(lit).toBeGreaterThanOrEqual(last);
        last = lit;
      }
    }
  });

  it("the maker's measured shift point when the era has one (race-powertrain.json manufacturers)", () => {
    expect(shiftRpmFor(2024, "Ferrari")).toBe(11950);
    expect(shiftRpmFor(2024, "nobody")).toBe(powertrainEraOf(2024).engine.shiftRpm);
    expect(shiftRpmFor(2005, "Ferrari")).toBe(powertrainEraOf(2005).engine.shiftRpm);
  });

  it("energy only in its era and only with the engine's charge: none before 2009, none in 2010, KERS 2009/2011-13, ERS from 2014", () => {
    const pose = { gear: 7, rpm: 10000, v: 80 };
    const label = (year, battery = 60) => wheelFrameOf({ year, pose, battery })?.energy?.label ?? null;
    expect(wheelFrameOf({ year: 1990, pose, battery: 60 })).toBeNull();
    expect(label(2005)).toBeNull();
    expect(label(2008)).toBeNull();
    expect(label(2009)).toBe("KERS");
    expect(label(2010)).toBeNull();
    expect(label(2012)).toBe("KERS");
    expect(label(2013)).toBe("KERS");
    expect(label(2014)).toBe("ERS");
    expect(label(2024)).toBe("ERS");
    expect(label(2012, null)).toBeNull();
    expect(wheelFrameOf({ year: 2005, pose }).speed).toBeNull();
    expect(wheelFrameOf({ year: 2024, pose }).speed).toBe(288);
    expect(wheelFrameOf({ year: 2024, pose }).gear).toBe("7");
  });

  it("lights and gear follow the pose of the race clock frame by frame: the change is on the same frame (≤ 100 ms)", () => {
    // A 7th → 8th upshift on the engine's shift point, sampled at 60 Hz as Race3D and the sound do.
    const year = 2024;
    const shift = shiftRpmFor(year);
    const FPS = 60;
    const shiftAt = 1.0;
    // As the engine does (powertrain.js shiftGear): the revs climb past shiftRpm, then it upshifts.
    const poseOf = (t) => (t < shiftAt ? { gear: 7, rpm: shift * Math.min(1.005, 0.8 + 0.21 * (t / shiftAt)), v: 80 + 3 * t } : { gear: 8, rpm: shift * 0.889, v: 80 + 3 * t });
    let fullAt = null;
    let dropAt = null;
    let gearAt = null;
    let previous = null;
    let staleKeys = 0;
    for (let k = 0; k <= 2 * FPS; k += 1) {
      const t = k / FPS;
      const frame = wheelFrameOf({ year, pose: poseOf(t), battery: 50, shiftRpm: shift });
      if (fullAt === null && frame.lights.lit === frame.lights.count) fullAt = t;
      if (previous && previous.lights.lit > frame.lights.lit && dropAt === null) dropAt = t;
      if (previous && previous.gear !== frame.gear && gearAt === null) gearAt = t;
      // Same key, same picture: the canvas repaints only when something on it changes.
      if (previous && previous.key === frame.key && (previous.lights.lit !== frame.lights.lit || previous.gear !== frame.gear)) staleKeys += 1;
      previous = frame;
    }
    expect(staleKeys).toBe(0);
    // The lights fill on the frame the revs reach the shift point (the last frame before the change).
    expect(fullAt).not.toBeNull();
    expect(shiftAt - fullAt).toBeLessThanOrEqual(0.1);
    expect(gearAt).toBeCloseTo(shiftAt, 6);
    expect(dropAt).toBe(gearAt);
  });
});

describe("CAM-C4 · VIEW-10: the low start-lights shot keeps the gantry in frame (RF-3D-04, RNF-05, RNF-07)", () => {
  const circuits = [
    ["Monza 2005", circuitFor({ name: "Italian Grand Prix", circuit: "monza" }, 2005)],
    ["Shanghai 2024", circuitFor({ name: "Chinese Grand Prix", circuit: "shanghai" }, 2024)],
    ["Shanghai 2013", circuitFor({ name: "Chinese Grand Prix", circuit: "shanghai" }, 2013)],
    ["Bahrain 2024", circuitFor({ name: "Bahrain Grand Prix", circuit: "bahrain" }, 2024)],
    ["Monaco 2020", circuitFor({ name: "Monaco Grand Prix", circuit: "monaco" }, 2020)],
    ["Hungaroring 2024", circuitFor({ circuit: "hungaroring" }, 2024)],
  ];
  const poleFocus = (circuit, gridCount) => {
    const share = (((scriptAnchorM("pole", gridCount) / circuit.length) % 1) + 1) % 1;
    const pole = poseAt(circuit, share);
    return { pole, focus: { x: pole.x, y: 0, z: pole.y, heading: pole.heading, speed: 0, share, spec: {} } };
  };
  // As Race3D draws it: the shot's fov is the camera's (vertical) fov, the lens snapped onto the shot.
  const frustumOf = (shot, aspect) => {
    const camera = new THREE.PerspectiveCamera(shot.fov, aspect, 0.3, 4000);
    camera.position.copy(shot.pos);
    camera.lookAt(shot.look);
    camera.updateMatrixWorld(true);
    return new THREE.Frustum().setFromProjectionMatrix(new THREE.Matrix4().multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse));
  };
  const lightsInFrame = (circuit, aspect, gridCount = 20) => {
    const { focus } = poleFocus(circuit, gridCount);
    const frustum = frustumOf(scriptShot("startLightsLow", focus, circuit, { gridCount }), aspect);
    return gantryLightPoints(circuit).filter((p) => frustum.containsPoint(new THREE.Vector3(p.x, p.y, p.z))).length;
  };

  it("broadcast.json validates with the gantry; startLightsLow aims at it", () => {
    const ajv = new Ajv({ allErrors: true });
    expect(ajv.validate(broadcastSchema, broadcastData)).toBe(true);
    expect(broadcastData.scriptRig.cams.find((cam) => cam.id === "startLightsLow").aim).toBe("gantry");
    expect(START_GANTRY.count).toBe(5);
  });

  it.each(circuits)("≥ 4 of 5 lights inside the frustum at 16:9, 21:9 and 4:3 (%s)", (name, circuit) => {
    [16 / 9, 21 / 9, 4 / 3].forEach((aspect) => {
      expect(lightsInFrame(circuit, aspect)).toBeGreaterThanOrEqual(4);
      expect(lightsInFrame(circuit, aspect, 10)).toBeGreaterThanOrEqual(4);
    });
  });

  it("the pole sitter stays in the same frame", () => {
    circuits.forEach(([, circuit]) => {
      const { pole, focus } = poleFocus(circuit, 20);
      const frustum = frustumOf(scriptShot("startLightsLow", focus, circuit, { gridCount: 20 }), 16 / 9);
      expect(frustum.containsPoint(new THREE.Vector3(pole.x, 0.6, pole.y))).toBe(true);
    });
  });

  it("the gantry trackScene.js builds hangs its lights where the camera looks for them", () => {
    const getContext = jest.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(() =>
      new Proxy({}, { get: (target, key) => (key in target ? target[key] : key === "getImageData" ? () => ({ data: new Uint8ClampedArray(4) }) : key === "measureText" ? () => ({ width: 10 }) : () => ({ addColorStop: () => {} })), set: (target, key, value) => { target[key] = value; return true; } }),
    );
    try {
      // eslint-disable-next-line global-require
      const { buildTrack } = require("./trackScene");
      const circuit = circuits[1][1];
      const track = buildTrack(circuit, { teams: [], year: 2024 });
      expect(track.gantry).toBeTruthy();
      track.group.updateMatrixWorld(true);
      gantryLightPoints(circuit).forEach((point) => {
        const faces = track.lights.filter((light) => light.index === point.index).map((light) => light.mesh.getWorldPosition(new THREE.Vector3()));
        expect(faces).toHaveLength(2);
        const mid = faces[0].clone().add(faces[1]).multiplyScalar(0.5);
        expect(mid.distanceTo(new THREE.Vector3(point.x, point.y, point.z))).toBeLessThan(1e-6);
      });
    } finally {
      getContext.mockRestore();
    }
  });
});
