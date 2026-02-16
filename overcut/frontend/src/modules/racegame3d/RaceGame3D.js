import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import MinigameTutorial from "../common/components/MinigameTutorial";
import { tutorialTexts } from "../../helpers/minigameTutorialTexts";
import "./RaceGame3D.css";

import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Sky } from "@react-three/drei";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";

/* =========================
   Utils
========================= */
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const wrap01 = (x) => ((x % 1) + 1) % 1;
const signedS = (from, to) => {
  // diff circular en [-0.5, 0.5)
  let d = (to - from + 0.5) % 1;
  if (d < 0) d += 1;
  return d - 0.5;
};

function angNorm(a) {
  return Math.atan2(Math.sin(a), Math.cos(a));
}
function signedAngleDiff(from, to) {
  return angNorm(to - from);
}

function makeSeededRand(seed = 1) {
  let s = seed >>> 0;
  return () => {
    s ^= s << 13; s >>>= 0;
    s ^= s >> 17; s >>>= 0;
    s ^= s << 5;  s >>>= 0;
    return (s >>> 0) / 4294967296;
  };
}

/* =========================
   Tracks
========================= */
const TRACKS = [
  {
    id: 0,
    name: { es: "Coastal GP", en: "Coastal GP" },
    raw: [
      [-1.55, -0.20], [-1.10, -0.65], [-0.30, -0.95], [0.55, -0.95],
      [1.30, -0.55], [1.45, 0.05], [1.05, 0.55], [0.30, 0.70],
      [-0.10, 0.25], [-0.35, 0.60], [-0.55, 0.25], [-0.85, 0.75],
      [-1.55, 0.55], [-1.65, 0.05],
    ],
  },
  {
    id: 1,
    name: { es: "Canyon Ring", en: "Canyon Ring" },
    raw: [
      [-1.60, 0.10], [-1.20, -0.70], [-0.40, -0.95], [0.45, -0.65],
      [0.85, -0.95], [1.45, -0.40], [1.15, 0.15], [0.55, 0.35],
      [0.90, 0.75], [0.20, 0.95], [-0.35, 0.65], [-0.65, 0.95],
      [-1.25, 0.65], [-1.55, 0.30],
    ],
  },
  {
    id: 2,
    name: { es: "Harbor Sprint", en: "Harbor Sprint" },
    raw: [
      [-1.55, -0.05], [-1.10, -0.85], [-0.15, -1.05], [0.85, -0.90],
      [1.55, -0.25], [1.05, 0.05], [1.45, 0.25], [1.05, 0.45],
      [1.45, 0.70], [0.85, 0.95], [0.00, 0.90], [-0.85, 0.75],
      [-1.45, 0.35], [-1.65, 0.10],
    ],
  },
  {
    id: 3,
    name: { es: "Forest Classic", en: "Forest Classic" },
    raw: [
      [-1.55, -0.25], [-1.10, -0.85], [-0.35, -1.05], [0.45, -0.95],
      [1.25, -0.55], [1.55, 0.10], [1.10, 0.35], [0.85, 0.15],
      [0.55, 0.55], [0.25, 0.95], [-0.35, 0.85], [-0.75, 0.45],
      [-1.05, 0.85], [-1.55, 0.55], [-1.70, 0.05],
    ],
  },
  {
    id: 4,
    name: { es: "Old Town Street", en: "Old Town Street" },
    raw: [
      [-1.60, -0.20], [-1.60, -0.85], [-0.70, -0.85], [-0.70, -0.15],
      [0.30, -0.15], [0.30, -0.95], [1.55, -0.95], [1.55, 0.15],
      [0.80, 0.15], [0.80, 0.55], [1.20, 0.55], [1.20, 0.95],
      [-0.40, 0.95], [-0.40, 0.35], [-1.05, 0.35], [-1.05, -0.20],
    ],
  },
  {
    id: 5,
    name: { es: "Highlands Flow", en: "Highlands Flow" },
    raw: [
      [-1.55, -0.10], [-1.15, -0.75], [-0.45, -1.05], [0.15, -0.85],
      [0.55, -1.05], [1.25, -0.70], [1.55, -0.10], [1.25, 0.35],
      [0.65, 0.55], [0.35, 0.95], [-0.25, 0.85], [-0.65, 0.55],
      [-1.05, 0.75], [-1.55, 0.35],
    ],
  },
];

/* =========================
   Track Builder
========================= */
function buildTrack3D(def, { scale = 220, xStretch = 1.45, zStretch = 1.10 } = {}) {
  const pts = def.raw.map(([x, y]) => new THREE.Vector3(x * scale * xStretch, 0, y * scale * zStretch));

  const dense = [];
  const stepsPerEdge = 28;
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % pts.length];
    for (let k = 0; k < stepsPerEdge; k++) {
      const t = k / stepsPerEdge;
      dense.push(new THREE.Vector3(lerp(a.x, b.x, t), 0, lerp(a.z, b.z, t)));
    }
  }

  const sm = dense.map((p, i) => {
    const p0 = dense[(i - 1 + dense.length) % dense.length];
    const p1 = dense[i];
    const p2 = dense[(i + 1) % dense.length];
    return new THREE.Vector3((p0.x + 2 * p1.x + p2.x) / 4, 0, (p0.z + 2 * p1.z + p2.z) / 4);
  });

  const curve = new THREE.CatmullRomCurve3(sm, true, "catmullrom", 0.5);

  const N = 1800;
  const samples = new Array(N);
  const tangents = new Array(N);
  const normals = new Array(N);

  const up = new THREE.Vector3(0, 1, 0);
  for (let i = 0; i < N; i++) {
    const t = i / N;
    const p = curve.getPointAt(t);
    const tan = curve.getTangentAt(t).normalize();
    const n = new THREE.Vector3().crossVectors(up, tan).normalize();
    samples[i] = p;
    tangents[i] = tan;
    normals[i] = n;
  }

  const sample = (s01) => {
    const t = wrap01(s01);
    const idx = Math.floor(t * N);
    return { p: samples[idx].clone(), tan: tangents[idx].clone(), n: normals[idx].clone(), t, idx, N, curve };
  };

  const trackHalfW = 10.8;
  const curbW = 2.2;
  const wallOffset = trackHalfW + curbW + 1.8;

  function ribbonGeometry(halfW) {
    const positions = [];
    const uvs = [];
    const indices = [];

    for (let i = 0; i <= N; i++) {
      const ii = i % N;
      const p = samples[ii];
      const n = normals[ii];

      const left = new THREE.Vector3().copy(p).addScaledVector(n, halfW);
      const right = new THREE.Vector3().copy(p).addScaledVector(n, -halfW);

      positions.push(left.x, left.y, left.z);
      positions.push(right.x, right.y, right.z);

      const v = i / N;
      uvs.push(0, v);
      uvs.push(1, v);
    }

    for (let i = 0; i < N; i++) {
      const a = i * 2;
      const b = a + 1;
      const c = a + 2;
      const d = a + 3;
      indices.push(a, b, c);
      indices.push(b, d, c);
    }

    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    g.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
    g.setIndex(indices);
    g.computeVertexNormals();
    return g;
  }

  const asphaltGeo = ribbonGeometry(trackHalfW);
  const curbOuterGeo = ribbonGeometry(trackHalfW + curbW);
  const curbInnerGeo = ribbonGeometry(trackHalfW);

  const wallPosts = [];
  const postStep = 12;
  for (let i = 0; i < N; i += postStep) {
    const p = samples[i];
    const n = normals[i];
    wallPosts.push({
      left: new THREE.Vector3().copy(p).addScaledVector(n, wallOffset),
      right: new THREE.Vector3().copy(p).addScaledVector(n, -wallOffset),
      yaw: Math.atan2(tangents[i].z, tangents[i].x),
    });
  }

  const start = sample(0.0);

  return {
    curve,
    sample,
    N,
    trackHalfW,
    curbW,
    wallOffset,
    asphaltGeo,
    curbOuterGeo,
    curbInnerGeo,
    wallPosts,
    start,
  };
}

/* =========================
   Scene: Track
========================= */
function Track({ trackData }) {
  const asphaltMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color("#556377"),
        roughness: 0.95,
        metalness: 0.05,
      }),
    []
  );

  const curbMatRed = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color("#d64545"),
        roughness: 0.8,
        metalness: 0.0,
      }),
    []
  );

  const curbMatWhite = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color("#f2f2f2"),
        roughness: 0.85,
        metalness: 0.0,
      }),
    []
  );

  const grassMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color("#2a3f2f"),
        roughness: 1.0,
        metalness: 0.0,
      }),
    []
  );

  const wallMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color("#0f1218"),
        roughness: 0.85,
        metalness: 0.05,
      }),
    []
  );

  // 🚨 IMPORTANTE: liberar GPU al desmontar
  useEffect(() => {
    return () => {
      trackData?.asphaltGeo?.dispose?.();
      trackData?.curbOuterGeo?.dispose?.();
      trackData?.curbInnerGeo?.dispose?.();
    };
  }, [trackData]);

  const grassSize = 4000;
  const startLinePos = useMemo(() => trackData.start.p.clone(), [trackData]);

  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} position={[0, -0.02, 0]} receiveShadow>
        <planeGeometry args={[grassSize, grassSize, 1, 1]} />
        <primitive object={grassMat} attach="material" />
      </mesh>

      <mesh geometry={trackData.asphaltGeo} material={asphaltMat} receiveShadow castShadow />
      <mesh geometry={trackData.curbOuterGeo} material={curbMatRed} receiveShadow />
      <mesh geometry={trackData.curbInnerGeo} material={curbMatWhite} receiveShadow />

      <mesh
        position={[startLinePos.x, 0.02, startLinePos.z]}
        rotation-y={Math.atan2(trackData.start.tan.z, trackData.start.tan.x)}
      >
        <planeGeometry args={[trackData.trackHalfW * 2.2, 2.4]} />
        <meshStandardMaterial color={"#ffffff"} opacity={0.85} transparent />
      </mesh>

      <group>
        {trackData.wallPosts.map((w, idx) => (
          <group key={idx}>
            <mesh position={[w.left.x, 0.6, w.left.z]} rotation-y={w.yaw} material={wallMat} castShadow>
              <boxGeometry args={[1.1, 1.2, 0.4]} />
            </mesh>
            <mesh position={[w.right.x, 0.6, w.right.z]} rotation-y={w.yaw} material={wallMat} castShadow>
              <boxGeometry args={[1.1, 1.2, 0.4]} />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  );
}

/* =========================
   Simple environment
========================= */
function SimpleGrandstands({ trackData, seed = 7 }) {
  const rand = useMemo(() => makeSeededRand(seed), [seed]);

  const stands = useMemo(() => {
    const arr = [];
    const step = 90;
    for (let i = 0; i < trackData.N; i += step) {
      const s = i / trackData.N;
      const sp = trackData.sample(s);
      const side = rand() > 0.5 ? 1 : -1;
      const off = trackData.wallOffset + 10 + rand() * 18;
      const p = sp.p.clone().addScaledVector(sp.n, off * side);
      const yaw = Math.atan2(sp.tan.z, sp.tan.x);

      const w = 18 + rand() * 24;
      const h = 7 + rand() * 10;
      const d = 6 + rand() * 10;

      arr.push({ p, yaw, w, h, d });
    }
    return arr;
  }, [trackData, rand]);

  const mat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color("#141821"),
        roughness: 0.9,
        metalness: 0.05,
      }),
    []
  );

  const bannerMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color("#fbc02d"),
        roughness: 0.65,
        metalness: 0.1,
        emissive: new THREE.Color("#3a2c06"),
        emissiveIntensity: 0.25,
      }),
    []
  );

  return (
    <group>
      {stands.map((s, idx) => (
        <group key={idx} position={[s.p.x, 0, s.p.z]} rotation-y={s.yaw}>
          <mesh position={[0, s.h * 0.5, 0]} material={mat} castShadow receiveShadow>
            <boxGeometry args={[s.w, s.h, s.d]} />
          </mesh>
          <mesh position={[0, s.h + 2.2, s.d * 0.35]} material={bannerMat} castShadow>
            <boxGeometry args={[s.w * 0.9, 2.0, 0.6]} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/* =========================
   Car visuals
========================= */
function AICarMesh({ color = "#4bd6ff" }) {
  const bodyMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color(color),
        roughness: 0.6,
        metalness: 0.15,
      }),
    [color]
  );

  const darkMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color("#0b0e12"),
        roughness: 0.95,
        metalness: 0.05,
      }),
    []
  );

  return (
    <group>
      <mesh material={bodyMat} castShadow>
        <boxGeometry args={[2.2, 0.45, 4.2]} />
      </mesh>
      <mesh material={bodyMat} position={[0, 0.1, 2.9]} castShadow>
        <boxGeometry args={[1.0, 0.25, 1.4]} />
      </mesh>

      <mesh material={darkMat} position={[1.2, -0.1, 1.4]} castShadow>
        <cylinderGeometry args={[0.38, 0.38, 0.35, 16]} />
      </mesh>
      <mesh material={darkMat} position={[-1.2, -0.1, 1.4]} castShadow>
        <cylinderGeometry args={[0.38, 0.38, 0.35, 16]} />
      </mesh>
      <mesh material={darkMat} position={[1.25, -0.1, -1.5]} castShadow>
        <cylinderGeometry args={[0.42, 0.42, 0.38, 16]} />
      </mesh>
      <mesh material={darkMat} position={[-1.25, -0.1, -1.5]} castShadow>
        <cylinderGeometry args={[0.42, 0.42, 0.38, 16]} />
      </mesh>
    </group>
  );
}

function CockpitOverlay3D() {
  const haloMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color("#0b0e12"),
        roughness: 0.85,
        metalness: 0.1,
      }),
    []
  );

  const accentMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color("#fbc02d"),
        roughness: 0.7,
        metalness: 0.2,
        emissive: new THREE.Color("#2a2107"),
        emissiveIntensity: 0.25,
      }),
    []
  );

  return (
    <group>
      <mesh material={haloMat} position={[0, 0.55, 0.25]} castShadow>
        <boxGeometry args={[0.22, 0.75, 0.18]} />
      </mesh>
      <mesh material={haloMat} position={[0, 0.35, -0.15]} castShadow>
        <torusGeometry args={[0.95, 0.08, 10, 40]} />
      </mesh>
      <mesh material={accentMat} position={[0, -0.05, 1.5]} castShadow>
        <boxGeometry args={[0.55, 0.10, 1.2]} />
      </mesh>
    </group>
  );
}

/* =========================
   Race sim (hook)
========================= */
function useRaceSim({ trackData, aiCount, totalLaps, aiMode }) {
  const carsRef = useRef([]);
  const stateRef = useRef({
    running: false,
    raceOver: false,
    totalLaps,
    startPhase: "lights",
    startTimer: 0,
    lightsCount: 5,
    startHold: 0.35,
    goFlash: 0,
    raceTime: 0,
    finishCounter: 0,
    winnerName: null,
    winnerIsPlayer: null,
  });

  const inputRef = useRef({ throttle: 0, brake: 0, steer: 0 });

  const makeCar = useCallback(
    (opts) => ({
      id: opts.id,
      name: opts.name,
      isPlayer: !!opts.isPlayer,
      color: opts.color,
      s: opts.s ?? 0,
      lap: 1,
      finished: false,
      finishOrder: null,
      finishTime: null,
      speed: 0,
      yaw: 0,
      pos: new THREE.Vector3(),
      maxSpeed: opts.maxSpeed ?? 92,
      accel: opts.accel ?? 55,
      brake: opts.brake ?? 80,
      drag: opts.drag ?? 0.65,
      turnRate: opts.turnRate ?? 1.85,
      grip: opts.grip ?? 10.0,
      ai: { t: 0, cached: { throttle: 0, brake: 0, steer: 0 }, cd: 0, prevErr: 0, seed: Math.random() * 9999 },
      _prevS: 0,
      _lapCd: 0,
    }),
    []
  );

  const reset = useCallback(
    (seed = 1) => {
      const st = stateRef.current;
      st.running = true;
      st.raceOver = false;
      st.raceTime = 0;
      st.finishCounter = 0;
      st.winnerName = null;
      st.winnerIsPlayer = null;

      st.startPhase = "lights";
      st.startTimer = 0;
      st.lightsCount = 5;
      st.startHold = 0.35 + Math.random() * 0.75;
      st.goFlash = 0;

      const cars = [];

      const baseS = 0.03;
      const rowSpacing = 0.010;
      const stagger = 0.0045;

      const slots = [];
      for (let i = 0; i < aiCount + 1; i++) {
        const row = Math.floor(i / 2);
        const side = i % 2 === 0 ? -1 : +1;
        slots.push({ row, side });
      }

      const rnd = makeSeededRand(seed);
      const playerSlot = Math.floor(rnd() * slots.length);

      const player = makeCar({
        id: "P",
        name: "YOU",
        isPlayer: true,
        color: "#f34b4b",
        maxSpeed: 102,
        accel: 60,
        brake: 92,
        drag: 0.62,
        grip: 12.0,
        turnRate: 2.0,
      });

      {
        const sl = slots[playerSlot];
        const s = wrap01(baseS - sl.row * rowSpacing + (sl.side > 0 ? 0 : -stagger));
        player.s = s;
        player._prevS = s;
        player._lapCd = 0;

        const sp = trackData.sample(s);
        player.pos.copy(sp.p).addScaledVector(sp.n, sl.side * (trackData.trackHalfW * 0.55));
        player.yaw = Math.atan2(sp.tan.z, sp.tan.x);
      }
      cars.push(player);

      let k = 1;
      for (let i = 0; i < slots.length; i++) {
        if (i === playerSlot) continue;

        const baseEasy = { maxSpeed: 84, accel: 46, brake: 74, grip: 9.2, turnRate: 1.55, drag: 0.70 };
        const baseMed = { maxSpeed: 93, accel: 53, brake: 82, grip: 10.4, turnRate: 1.72, drag: 0.66 };
        const baseHard = { maxSpeed: 104, accel: 63, brake: 95, grip: 11.6, turnRate: 1.85, drag: 0.60 };
        const tune = aiMode === "hard" ? baseHard : aiMode === "medium" ? baseMed : baseEasy;

        const jitter = () => rnd() * 2 - 1;

        const ai = makeCar({
          id: "AI-" + k,
          name: "AI-" + k,
          color: ["#4bd6ff", "#ffd14b", "#7dff4b", "#c24bff", "#ff4bd8"][k % 5],
          ...tune,
          maxSpeed: tune.maxSpeed + jitter() * 3,
          accel: tune.accel + jitter() * 4,
          grip: tune.grip + jitter() * 0.6,
        });

        const sl = slots[i];
        const s = wrap01(baseS - sl.row * rowSpacing + (sl.side > 0 ? 0 : -stagger));
        ai.s = s;
        ai._prevS = s;
        ai._lapCd = 0;

        const sp = trackData.sample(s);
        ai.pos.copy(sp.p).addScaledVector(sp.n, sl.side * (trackData.trackHalfW * 0.55));
        ai.yaw = Math.atan2(sp.tan.z, sp.tan.x);

        cars.push(ai);
        k++;
        if (k > aiCount) break;
      }

      carsRef.current = cars;
    },
    [aiCount, aiMode, makeCar, trackData]
  );

  const computeRanking = useCallback(() => {
    const st = stateRef.current;
    const cars = carsRef.current.slice();
    cars.sort((a, b) => {
      if (a.finished && !b.finished) return -1;
      if (!a.finished && b.finished) return 1;
      if (a.finished && b.finished) return (a.finishOrder ?? 9999) - (b.finishOrder ?? 9999);

      const aLap = Math.min(a.lap, st.totalLaps + 1);
      const bLap = Math.min(b.lap, st.totalLaps + 1);
      if (aLap !== bLap) return bLap - aLap;
      return b.s - a.s;
    });
    return cars;
  }, []);

  const step = useCallback(
    (dt) => {
      const st = stateRef.current;
      st.raceTime += dt;

      if (st.running && !st.raceOver) {
        if (st.startPhase === "lights") {
          st.startTimer += dt;
          const stepT = 0.8;
          const total = st.lightsCount * stepT;
          if (st.startTimer >= total + st.startHold) {
            st.startPhase = "go";
            st.goFlash = 0.85;
          }
        } else if (st.goFlash > 0) {
          st.goFlash -= dt;
        }
      }

      const locked = st.startPhase !== "go";
      const cars = carsRef.current;

      const constrainToTrack = (car) => {
        const N = trackData.N;
        const baseIdx = Math.floor(wrap01(car.s) * N);

        let bestD2 = Infinity;
        let bestIdx = baseIdx;

        for (let k = -12; k <= 12; k++) {
          const ii = (baseIdx + k + N) % N;
          const p = trackData.sample(ii / N).p;
          const dx = car.pos.x - p.x;
          const dz = car.pos.z - p.z;
          const d2 = dx * dx + dz * dz;
          if (d2 < bestD2) {
            bestD2 = d2;
            bestIdx = ii;
          }
        }

        const sp = trackData.sample(bestIdx / N);
        const toX = car.pos.x - sp.p.x;
        const toZ = car.pos.z - sp.p.z;
        const lateral = toX * sp.n.x + toZ * sp.n.z;
        const dist = Math.abs(lateral);

        const limit = trackData.trackHalfW + trackData.curbW * 0.85;
        if (dist > limit) {
          const push = dist - limit;
          const dir = lateral > 0 ? 1 : -1;
          car.pos.x += sp.n.x * (-push * dir);
          car.pos.z += sp.n.z * (-push * dir);
          car.speed *= 0.96;
        }

        const targetS = bestIdx / N;
        car.s = wrap01(car.s + signedS(car.s, targetS) * 0.15);

        return sp;
      };

      const collide = () => {
        const r = 1.2;
        const min2 = (2 * r) * (2 * r);
        for (let i = 0; i < cars.length; i++) {
          for (let j = i + 1; j < cars.length; j++) {
            const a = cars[i], b = cars[j];
            if (a.finished && b.finished) continue;

            const dx = b.pos.x - a.pos.x;
            const dz = b.pos.z - a.pos.z;
            const d2 = dx * dx + dz * dz;
            if (d2 <= 1e-6 || d2 >= min2) continue;

            const d = Math.sqrt(d2);
            const nx = dx / d;
            const nz = dz / d;

            const pen = (2 * r) - d;
            a.pos.x -= nx * (pen * 0.52);
            a.pos.z -= nz * (pen * 0.52);
            b.pos.x += nx * (pen * 0.52);
            b.pos.z += nz * (pen * 0.52);

            a.speed *= 0.985;
            b.speed *= 0.985;
          }
        }
      };

      for (const car of cars) {
        if (car.finished) continue;

        car._lapCd = Math.max(0, (car._lapCd ?? 0) - dt);

        let throttle = 0, brake = 0, steer = 0;

        if (locked) {
          throttle = 0; brake = 0; steer = 0;
        } else if (car.isPlayer) {
          throttle = inputRef.current.throttle;
          brake = inputRef.current.brake;
          steer = inputRef.current.steer;
        } else {
          car.ai.t += dt;

          const decisionPeriod = aiMode === "hard" ? 0.00 : aiMode === "medium" ? 0.04 : 0.11;
          if (car.ai.cd > 0) {
            car.ai.cd -= dt;
            throttle = car.ai.cached.throttle;
            brake = car.ai.cached.brake;
            steer = car.ai.cached.steer;
          } else {
            car.ai.cd = decisionPeriod;

            const v01 = clamp(car.speed / car.maxSpeed, 0, 1);
            const look = clamp(0.012 + v01 * 0.050, 0.014, 0.070);

            const sp0 = trackData.sample(car.s);
            const sp1 = trackData.sample(wrap01(car.s + look));

            const yaw0 = Math.atan2(sp0.tan.z, sp0.tan.x);
            const yaw1 = Math.atan2(sp1.tan.z, sp1.tan.x);
            const upcoming = Math.abs(signedAngleDiff(yaw0, yaw1));

            const w = clamp(upcoming * (aiMode === "hard" ? 2.7 : aiMode === "medium" ? 2.3 : 2.0), 0, 1) * clamp(v01 * 1.1, 0, 1);
            const desiredYaw = angNorm(yaw0 + signedAngleDiff(yaw0, yaw1) * w);

            const err = signedAngleDiff(car.yaw, desiredYaw);

            const prevErr = car.ai.prevErr ?? err;
            const derr = (err - prevErr) / Math.max(1e-3, dt);
            car.ai.prevErr = err;

            const kp = aiMode === "hard" ? 1.30 : aiMode === "medium" ? 1.22 : 1.10;
            const kd = aiMode === "hard" ? 0.05 : aiMode === "medium" ? 0.04 : 0.02;

            steer = clamp(kp * err + kd * derr, -1, 1);

            const targetSpeed = car.maxSpeed * (1 - clamp(upcoming * (aiMode === "hard" ? 1.3 : aiMode === "medium" ? 1.45 : 1.7), 0, 0.75));
            const margin = aiMode === "hard" ? 2.5 : aiMode === "medium" ? 3.5 : 5.0;

            if (car.speed < targetSpeed - margin) { throttle = 1; brake = 0; }
            else if (car.speed > targetSpeed + margin) { throttle = 0; brake = aiMode === "hard" ? 0.55 : aiMode === "medium" ? 0.65 : 0.80; }
            else { throttle = aiMode === "hard" ? 0.55 : 0.40; brake = 0; }

            car.ai.cached = { throttle, brake, steer };
          }
        }

        const acc = throttle * car.accel - brake * car.brake;
        car.speed += acc * dt;
        car.speed -= car.drag * car.speed * dt;
        car.speed = clamp(car.speed, 0, car.maxSpeed);

        const v01 = car.speed / car.maxSpeed;
        const steerEff = car.turnRate * (0.55 + 0.45 * (1 - v01));
        car.yaw = angNorm(car.yaw + steer * steerEff * dt);

        const fx = Math.cos(car.yaw);
        const fz = Math.sin(car.yaw);
        car.pos.x += fx * car.speed * dt;
        car.pos.z += fz * car.speed * dt;

        const sp = constrainToTrack(car);

        const prevS = car._prevS ?? car.s;
        const crossed = prevS > 0.88 && car.s < 0.12;
        car._prevS = car.s;

        if (crossed && car._lapCd <= 0) {
          car._lapCd = 0.65;

          car.lap += 1;
          if (car.lap > st.totalLaps) {
            car.finished = true;
            car.finishTime = st.raceTime;
            car.finishOrder = ++st.finishCounter;

            if (st.winnerName == null) {
              st.winnerName = car.name;
              st.winnerIsPlayer = !!car.isPlayer;
            }
          }
        }

        const tanYaw = Math.atan2(sp.tan.z, sp.tan.x);
        const align = car.isPlayer ? 0.06 : 0.10;
        car.yaw = angNorm(car.yaw + signedAngleDiff(car.yaw, tanYaw) * align * clamp(v01, 0, 1));
      }

      collide();
      collide();

      const you = cars.find((c) => c.isPlayer);
      if (you?.finished && !st.raceOver) {
        st.raceOver = true;
        st.running = false;
      }
    },
    [aiMode, trackData]
  );

  return { carsRef, stateRef, inputRef, reset, step, computeRanking };
}

/* =========================
   Camera rig (cockpit)
========================= */
function CockpitCameraRig({ sim, playerRef, isMobile }) {
  const { camera } = useThree();

  const tmpRight = useMemo(() => new THREE.Vector3(), []);
  const tmpFwd = useMemo(() => new THREE.Vector3(), []);
  const tmpCockpit = useMemo(() => new THREE.Vector3(), []);
  const tmpLook = useMemo(() => new THREE.Vector3(), []);
  const tmpShake = useMemo(() => new THREE.Vector3(), []);

  useEffect(() => {
    camera.near = 0.05;
    camera.far = 5000;
    camera.fov = 78;
    camera.updateProjectionMatrix();
  }, [camera]);

  useFrame((_, dt) => {
    const cars = sim.carsRef.current;
    const you = cars.find((c) => c.isPlayer);
    if (!you) return;

    const fx = Math.cos(you.yaw);
    const fz = Math.sin(you.yaw);

    tmpFwd.set(fx, 0, fz);
    tmpRight.set(-fz, 0, fx);

    tmpCockpit.copy(you.pos).addScaledVector(tmpFwd, 0.55).addScaledVector(tmpRight, 0.0);
    tmpCockpit.y = 0.55;

    tmpLook.copy(you.pos).addScaledVector(tmpFwd, 18);
    tmpLook.y = 0.55;

    const v01 = clamp(you.speed / you.maxSpeed, 0, 1);
    const t = performance.now() * 0.001;

    const shakeAmp = isMobile ? 0.03 : 0.05;
    tmpShake.set(
      (Math.sin(t * 18.0) * 0.012 + Math.sin(t * 31.0) * 0.008) * v01,
      (Math.sin(t * 24.0) * 0.010) * v01,
      (Math.sin(t * 14.0) * 0.010) * v01
    ).multiplyScalar(shakeAmp * 40);

    camera.position.lerp(tmpCockpit.add(tmpShake), 1 - Math.pow(0.0008, dt));
    camera.lookAt(tmpLook);

    const baseFov = isMobile ? 74 : 78;
    const fov = baseFov + v01 * 10;
    camera.fov = lerp(camera.fov, fov, clamp(6.0 * dt, 0, 1));
    camera.updateProjectionMatrix();

    playerRef.current = you;
  });

  return null;
}

/* =========================
   World renderer (cars)
========================= */
function CarsWorld({ sim, aiCount = 5 }) {
  const groupRef = useRef();

  useFrame(() => {
    const g = groupRef.current;
    if (!g) return;

    const cars = sim.carsRef.current;
    for (const obj of g.children) {
      const id = obj.userData?.id;
      const car = cars.find((c) => c.id === id);

      if (!car) {
        obj.visible = false;
        continue;
      }

      obj.visible = true;
      obj.position.set(car.pos.x, 0.18, car.pos.z);
      obj.rotation.set(0, -car.yaw + Math.PI / 2, 0);
    }
  });

  const ids = useMemo(() => Array.from({ length: aiCount }, (_, i) => `AI-${i + 1}`), [aiCount]);

  return (
    <group ref={groupRef}>
      {ids.map((id, i) => (
        <group key={id} userData={{ id }}>
          <AICarMesh color={["#4bd6ff", "#ffd14b", "#7dff4b", "#c24bff", "#ff4bd8"][i % 5]} />
        </group>
      ))}
    </group>
  );
}

function CockpitWorld({ playerRef }) {
  const g = useRef();
  useFrame(() => {
    const you = playerRef.current;
    if (!you || !g.current) return;

    g.current.position.set(you.pos.x, 0, you.pos.z);
    g.current.rotation.set(0, -you.yaw + Math.PI / 2, 0);
  });

  return (
    <group ref={g}>
      <CockpitOverlay3D />
    </group>
  );
}

/* =========================
   HUD + Touch
========================= */
function RaceHUD({ lang, t, hud, ranking, startState, onRestart, onBackToSetup, onBackHome }) {
  const startPhase = startState?.startPhase;
  const goFlash = startState?.goFlash ?? 0;
  const lightsCount = startState?.lightsCount ?? 5;
  const startTimer = startState?.startTimer ?? 0;

  const lit = startPhase === "lights" ? Math.min(lightsCount, Math.floor(startTimer / 0.8) + 1) : lightsCount;

  return (
    <div className="race3d-ui">
      <div className="race3d-hudTop">
        <div className="race3d-title">
          <div className="race3d-titleMain">{t.title}</div>
          <div className="race3d-titleSub">{t.subtitle}</div>
        </div>

        <div className="race3d-chips">
          <div className="race3d-chip">
            <span>{t.position}</span>
            <strong>{hud.pos}/{hud.total}</strong>
          </div>
          <div className="race3d-chip">
            <span>{t.lap}</span>
            <strong>{hud.lap}</strong>
          </div>
          <div className="race3d-chip">
            <span>{t.speed}</span>
            <strong>{hud.speed} {t.sim}</strong>
          </div>
        </div>

        <div className="race3d-buttons">
          <button className="race3d-btn" onClick={onRestart} type="button">{t.restart}</button>
          <button className="race3d-btn ghost" onClick={onBackToSetup} type="button">{t.backToSetup}</button>
          <button className="race3d-btn ghost" onClick={onBackHome} type="button">⟵ {t.backHome}</button>
        </div>
      </div>

      {(startPhase !== "go" || goFlash > 0) && (
        <div className="race3d-startLights">
          <div className="race3d-startPanel">
            <div className="race3d-startText">
              {startPhase === "go" ? (lang === "es" ? "¡SALIDA!" : "GO!") : (lang === "es" ? "Prepárate..." : "Get ready...")}
            </div>
            <div className="race3d-lightsRow">
              {Array.from({ length: lightsCount }).map((_, i) => {
                const on = startPhase === "lights" ? i < lit : false;
                return <span key={i} className={`race3d-light ${on ? "on" : ""}`} />;
              })}
            </div>
          </div>
        </div>
      )}

      <div className="race3d-leader">
        <div className="race3d-leaderTitle">{t.standings}</div>
        {ranking.slice(0, 6).map((c, i) => (
          <div key={c.id || c.name || i} className={`race3d-row ${c.isPlayer ? "me" : ""}`}>
            <span className="race3d-pos">{i + 1}.</span>
            <span className="race3d-name" style={{ color: c.color }}>{c.name}</span>
            <span className="race3d-lap">{c.finished ? "FIN" : `L${c.lap}`}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function TouchControls({ inputRef, joyRef, show }) {
  if (!show) return null;

  const onJoyDown = (e) => {
    const el = e.currentTarget;
    const rect = el.getBoundingClientRect();
    joyRef.current.active = true;
    joyRef.current.pointerId = e.pointerId;
    joyRef.current.cx = rect.left + rect.width / 2;
    joyRef.current.cy = rect.top + rect.height / 2;
    el.setPointerCapture(e.pointerId);
  };

  const onJoyMove = (e) => {
    if (!joyRef.current.active || joyRef.current.pointerId !== e.pointerId) return;
    const dx = e.clientX - joyRef.current.cx;
    const max = 60;
    const sx = clamp(dx / max, -1, 1);
    inputRef.current.steer = lerp(inputRef.current.steer, sx, 0.35);
  };

  const onJoyUp = (e) => {
    if (joyRef.current.pointerId !== e.pointerId) return;
    joyRef.current.active = false;
    joyRef.current.pointerId = null;
    inputRef.current.steer = 0;
  };

  return (
    <div className="race3d-touch">
      <div
        className="race3d-joy"
        onPointerDown={onJoyDown}
        onPointerMove={onJoyMove}
        onPointerUp={onJoyUp}
        onPointerCancel={onJoyUp}
      >
        <div className={`race3d-joyKnob ${joyRef.current.active ? "active" : ""}`} />
      </div>

      <div className="race3d-touchRight">
        <button
          className="race3d-touchBtn"
          type="button"
          onPointerDown={() => (inputRef.current.throttle = 1)}
          onPointerUp={() => (inputRef.current.throttle = 0)}
          onPointerCancel={() => (inputRef.current.throttle = 0)}
        >
          ⬆
        </button>
        <button
          className="race3d-touchBtn"
          type="button"
          onPointerDown={() => (inputRef.current.brake = 1)}
          onPointerUp={() => (inputRef.current.brake = 0)}
          onPointerCancel={() => (inputRef.current.brake = 0)}
        >
          ⬇
        </button>
      </div>
    </div>
  );
}

/* =========================
   Sim Loop (UI throttle + no re-render si no cambia)
========================= */
function SimLoop({ sim, laps, setHud, setRanking }) {
  const accRef = useRef(0);

  useFrame((_, dt) => {
    const delta = Math.min(0.033, dt);

    sim.stateRef.current.totalLaps = laps;
    sim.step(delta);

    accRef.current += delta;
    if (accRef.current < 0.08) return;
    accRef.current = 0;

    const rankingFull = sim.computeRanking();
    const you = sim.carsRef.current.find((c) => c.isPlayer);

    const nextRanking = rankingFull.map((c) => ({
      id: c.id,
      name: c.name,
      color: c.color,
      lap: c.lap,
      finished: c.finished,
      isPlayer: c.isPlayer,
    }));

    setRanking((prev) => {
      if (prev.length === nextRanking.length) {
        let same = true;
        for (let i = 0; i < prev.length; i++) {
          const a = prev[i], b = nextRanking[i];
          if (a.id !== b.id || a.lap !== b.lap || a.finished !== b.finished) { same = false; break; }
        }
        if (same) return prev;
      }
      return nextRanking;
    });

    if (you) {
      const pos = rankingFull.findIndex((x) => x.isPlayer) + 1;
      const nextHud = {
        pos,
        total: sim.carsRef.current.length,
        lap: `${Math.min(you.lap, laps)}/${laps}`,
        speed: Math.round(you.speed * 3.6),
      };
      setHud((prev) => {
        if (
          prev.pos === nextHud.pos &&
          prev.total === nextHud.total &&
          prev.lap === nextHud.lap &&
          prev.speed === nextHud.speed
        ) return prev;
        return nextHud;
      });
    }
  });

  return null;
}

/* =========================
   Main Component
========================= */
export default function RaceGame3D() {
  const lang = navigator.language.startsWith("es") ? "es" : "en";
  const navigate = useNavigate();
  const MINIGAMES_HOME = "/minigames";

  const [showTutorial, setShowTutorial] = useState(true);
  const [showSetup, setShowSetup] = useState(true);

  const [laps, setLaps] = useState(3);
  const [aiMode, setAiMode] = useState("easy");

  const [trackId, setTrackId] = useState(0);
  const [pendingSeed, setPendingSeed] = useState(1);

  const tutorial = tutorialTexts["/minigames/race3d"]?.[lang] || tutorialTexts["/minigames/race"]?.[lang];

  const t = useMemo(() => {
    const es = {
      title: "🏁 Carrera 3D (Cockpit)",
      subtitle: "Fórmula · 1ª persona · Track 3D · IA · PostFX",
      startRace: "Empezar carrera",
      restart: "Reiniciar",
      chooseLaps: "Elige vueltas",
      laps: "Vueltas",
      aiDifficulty: "Dificultad IA",
      easy: "Fácil",
      medium: "Medio",
      hard: "Difícil",
      easyDesc: "Más lenta, comete errores y frena antes.",
      mediumDesc: "Equilibrada: rápida pero conservadora.",
      hardDesc: "Rápida, traza más limpia y frena tarde.",
      setupTip: "El circuito se elige aleatoriamente en cada carrera.",
      backHome: "Volver al inicio",
      backToSetup: "⚙ Setup",
      position: "Posición",
      lap: "Vuelta",
      speed: "Vel",
      sim: "km/h (sim)",
      standings: "Clasificación",
    };
    const en = {
      title: "🏁 3D Race (Cockpit)",
      subtitle: "Formula · First-person · 3D Track · AI · PostFX",
      startRace: "Start race",
      restart: "Restart",
      chooseLaps: "Choose laps",
      laps: "Laps",
      aiDifficulty: "AI Difficulty",
      easy: "Easy",
      medium: "Medium",
      hard: "Hard",
      easyDesc: "Slower, makes mistakes and brakes early.",
      mediumDesc: "Balanced: quick but still safe.",
      hardDesc: "Fast, cleaner line and late braking.",
      setupTip: "A random track is selected every race.",
      backHome: "Back to home",
      backToSetup: "⚙ Setup",
      position: "Position",
      lap: "Lap",
      speed: "Speed",
      sim: "km/h (sim)",
      standings: "Leaderboard",
    };
    return lang === "es" ? es : en;
  }, [lang]);

  const keysRef = useRef(new Set());
  const joyRef = useRef({ active: false, pointerId: null, cx: 0, cy: 0 });

  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const compute = () =>
      window.matchMedia("(max-width: 520px)").matches ||
      window.matchMedia("(pointer: coarse)").matches;

    const apply = () => setIsMobile(compute());
    apply();

    window.addEventListener("resize", apply);
    window.addEventListener("orientationchange", apply);
    return () => {
      window.removeEventListener("resize", apply);
      window.removeEventListener("orientationchange", apply);
    };
  }, []);

  const trackDef = useMemo(() => TRACKS.find((x) => x.id === trackId) || TRACKS[0], [trackId]);
  const trackLabel = useMemo(() => trackDef.name?.[lang] || trackDef.name?.en || "Track", [trackDef, lang]);

  const trackData = useMemo(() => buildTrack3D(trackDef, { scale: 220, xStretch: 1.45, zStretch: 1.10 }), [trackDef]);

  const sim = useRaceSim({ trackData, aiCount: 5, totalLaps: laps, aiMode });

  const [hud, setHud] = useState({ pos: 1, total: 6, lap: "1/3", speed: 0 });
  const [ranking, setRanking] = useState([]);
  const playerRef = useRef(null);

  const resetRace = useCallback(() => {
    const newTrackId = Math.floor(Math.random() * TRACKS.length);
    setTrackId(newTrackId);
    setPendingSeed(Math.floor(Math.random() * 100000) + 1);
  }, []);

  useEffect(() => {
    if (showTutorial || showSetup) return;
    sim.stateRef.current.totalLaps = laps;
    sim.reset(pendingSeed);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showTutorial, showSetup, pendingSeed, laps, aiMode, trackData]);

  const syncKeyboard = useCallback(() => {
    const keys = keysRef.current;

    const thr = keys.has("ArrowUp") || keys.has("w") || keys.has("W") ? 1 : 0;
    const brk = keys.has("ArrowDown") || keys.has("s") || keys.has("S") ? 1 : 0;

    const left = keys.has("ArrowLeft") || keys.has("a") || keys.has("A") ? 1 : 0;
    const right = keys.has("ArrowRight") || keys.has("d") || keys.has("D") ? 1 : 0;

    const joyActive = joyRef.current.active;

    sim.inputRef.current.throttle = Math.max(sim.inputRef.current.throttle, thr);
    sim.inputRef.current.brake = Math.max(sim.inputRef.current.brake, brk);
    if (!joyActive) sim.inputRef.current.steer = right - left;
  }, [sim]);

  useEffect(() => {
    if (showTutorial || showSetup) return;

    const down = (e) => {
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(e.key)) e.preventDefault();
      keysRef.current.add(e.key);
      syncKeyboard();
    };

    const up = (e) => {
      keysRef.current.delete(e.key);

      const keys = keysRef.current;
      sim.inputRef.current.throttle = keys.has("ArrowUp") || keys.has("w") || keys.has("W") ? 1 : 0;
      sim.inputRef.current.brake = keys.has("ArrowDown") || keys.has("s") || keys.has("S") ? 1 : 0;

      if (!joyRef.current.active) {
        const left = keys.has("ArrowLeft") || keys.has("a") || keys.has("A") ? 1 : 0;
        const right = keys.has("ArrowRight") || keys.has("d") || keys.has("D") ? 1 : 0;
        sim.inputRef.current.steer = right - left;
      }
    };

    window.addEventListener("keydown", down, { passive: false });
    window.addEventListener("keyup", up);

    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, [showTutorial, showSetup, sim, syncKeyboard]);

  const onRestart = () => {
    sim.stateRef.current.raceOver = false;
    sim.stateRef.current.running = true;
    resetRace();
  };

  const onBackToSetup = () => {
    sim.stateRef.current.running = false;
    sim.stateRef.current.raceOver = false;
    sim.inputRef.current.throttle = 0;
    sim.inputRef.current.brake = 0;
    sim.inputRef.current.steer = 0;
    keysRef.current.clear();
    joyRef.current.active = false;
    joyRef.current.pointerId = null;
    setShowSetup(true);
  };

  if (showTutorial) {
    return (
      <MinigameTutorial
        title={tutorial?.title || t.title}
        description={tutorial?.description || ""}
        image={null}
        onStart={() => {
          setShowTutorial(false);
          setShowSetup(true);
        }}
        lang={lang}
      />
    );
  }

  if (showSetup) {
    return (
      <div className="race3d setup">
        <div className="race3d-setupCard">
          <div className="race3d-setupTop">
            <div>
              <div className="race3d-setupTitle">{t.title}</div>
              <div className="race3d-setupSub">{t.subtitle}</div>
              <div className="race3d-setupSub" style={{ opacity: 0.8, marginTop: 6 }}>
                {lang === "es" ? "Circuito (preview): " : "Track (preview): "} <strong>{trackLabel}</strong>
              </div>
            </div>

            <button className="race3d-setupBack" onClick={() => navigate(MINIGAMES_HOME)} type="button">
              ⟵ {t.backHome}
            </button>
          </div>

          <div className="race3d-setupTip">{t.setupTip}</div>

          <div className="race3d-block">
            <div className="race3d-blockTitle">{t.chooseLaps}</div>
            <div className="race3d-grid">
              <button className={`race3d-card ${laps === 3 ? "active" : ""}`} onClick={() => setLaps(3)} type="button">
                <div className="race3d-cardBig">3</div>
                <div className="race3d-cardSmall">{t.laps}</div>
              </button>

              <button className={`race3d-card ${laps === 5 ? "active" : ""}`} onClick={() => setLaps(5)} type="button">
                <div className="race3d-cardBig">5</div>
                <div className="race3d-cardSmall">{t.laps}</div>
              </button>
            </div>
          </div>

          <div className="race3d-block">
            <div className="race3d-blockTitle">{t.aiDifficulty}</div>
            <div className="race3d-grid">
              <button className={`race3d-card ai ${aiMode === "easy" ? "active" : ""}`} onClick={() => setAiMode("easy")} type="button">
                <div className="race3d-cardHdr"><span>{t.easy}</span><span className="race3d-pill">{aiMode === "easy" ? "✓" : ""}</span></div>
                <div className="race3d-desc">{t.easyDesc}</div>
              </button>

              <button className={`race3d-card ai ${aiMode === "medium" ? "active" : ""}`} onClick={() => setAiMode("medium")} type="button">
                <div className="race3d-cardHdr"><span>{t.medium}</span><span className="race3d-pill">{aiMode === "medium" ? "✓" : ""}</span></div>
                <div className="race3d-desc">{t.mediumDesc}</div>
              </button>

              <button className={`race3d-card ai ${aiMode === "hard" ? "active" : ""}`} onClick={() => setAiMode("hard")} type="button">
                <div className="race3d-cardHdr"><span>{t.hard}</span><span className="race3d-pill">{aiMode === "hard" ? "✓" : ""}</span></div>
                <div className="race3d-desc">{t.hardDesc}</div>
              </button>
            </div>
          </div>

          <button
            className="race3d-start"
            onClick={() => {
              resetRace();
              setShowSetup(false);
            }}
            type="button"
          >
            {t.startRace}
          </button>

          <div className="race3d-hint">
            {lang === "es" ? "WASD / Flechas · En móvil: joystick + ⬆ ⬇" : "WASD / Arrows · On mobile: joystick + ⬆ ⬇"}
          </div>
        </div>
      </div>
    );
  }

  const enablePostFx = !isMobile;

  return (
    <div className="race3d">
      <RaceHUD
        lang={lang}
        t={t}
        hud={hud}
        ranking={ranking}
        startState={sim.stateRef.current}
        onRestart={onRestart}
        onBackToSetup={onBackToSetup}
        onBackHome={() => navigate(MINIGAMES_HOME)}
      />

      <TouchControls inputRef={sim.inputRef} joyRef={joyRef} show={isMobile} />

      <Canvas
        shadows
        dpr={[1, 1.75]}
        camera={{ position: [0, 1.2, 0], fov: 78 }}
        gl={{ antialias: true, powerPreference: "high-performance" }}
      >
        <fog attach="fog" args={["#0b0f14", 160, 1600]} />
        <color attach="background" args={["#070a0f"]} />

        <ambientLight intensity={0.35} />
        <directionalLight
          position={[300, 450, 220]}
          intensity={1.1}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-camera-near={1}
          shadow-camera-far={1800}
          shadow-camera-left={-450}
          shadow-camera-right={450}
          shadow-camera-top={450}
          shadow-camera-bottom={-450}
        />

        <Sky
          distance={450000}
          sunPosition={[1, 0.55, 0.2]}
          inclination={0.47}
          azimuth={0.25}
          rayleigh={2.2}
          turbidity={6}
          mieCoefficient={0.005}
          mieDirectionalG={0.8}
        />

        <Track trackData={trackData} />
        <SimpleGrandstands trackData={trackData} seed={trackId + 10} />

        <CarsWorld sim={sim} aiCount={5} />
        <CockpitWorld playerRef={playerRef} />
        <CockpitCameraRig sim={sim} playerRef={playerRef} isMobile={isMobile} />

        {enablePostFx && (
          <EffectComposer>
            <Bloom intensity={0.35} luminanceThreshold={0.75} luminanceSmoothing={0.15} />
            <Vignette eskil={false} offset={0.2} darkness={0.65} />
          </EffectComposer>
        )}

        <SimLoop sim={sim} laps={laps} setHud={setHud} setRanking={setRanking} />
      </Canvas>
    </div>
  );
}
