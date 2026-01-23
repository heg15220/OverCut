import React, { useEffect, useMemo, useRef, useState } from "react";
import MinigameTutorial from "../common/components/MinigameTutorial";
import { tutorialTexts } from "../../helpers/minigameTutorialTexts";
import "./RaceGame.css";

/**
 * RaceGame (Frontend-only, Canvas 2D) — UPDATED
 * - Pantalla de setup al entrar: elegir 3 o 5 vueltas
 * - Carrera NO termina si una IA acaba antes: termina cuando acaba el jugador
 * - Colisiones coche-coche con físicas (no atraviesa)
 * - 4 circuitos largos, aleatorio por partida
 * - Cámara + paisaje + pista por tramos + controles PC/touch + monoplazas
 */

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;

function hypot2(x, y) {
  return Math.hypot(x, y);
}

function roundRect(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

function hash01(n) {
  const x = Math.sin(n * 999.123 + 0.12345) * 10000;
  return x - Math.floor(x);
}

function wrap01(x) {
  return ((x % 1) + 1) % 1;
}

const TRACKS = [
  {
    id: 0,
    name: { es: "Coastal GP", en: "Coastal GP" },
    // recta larga + derecha rápida + horquilla + chicane
    raw: [
      [-1.55, -0.20],
      [-1.10, -0.65],
      [-0.30, -0.95],
      [0.55, -0.95],   // recta larga
      [1.30, -0.55],   // derecha rápida
      [1.45, 0.05],
      [1.05, 0.55],
      [0.30, 0.70],
      [-0.10, 0.25],   // cambio de apoyo
      [-0.35, 0.60],   // chicane parte 1
      [-0.55, 0.25],   // chicane parte 2
      [-0.85, 0.75],
      [-1.55, 0.55],
      [-1.65, 0.05],
    ],
  },
  {
    id: 1,
    name: { es: "Canyon Ring", en: "Canyon Ring" },
    // recta + S rápidas + horquilla cerrada + sector técnico
    raw: [
      [-1.60, 0.10],
      [-1.20, -0.70],
      [-0.40, -0.95],
      [0.45, -0.65],   // S 1
      [0.85, -0.95],   // S 2
      [1.45, -0.40],
      [1.15, 0.15],
      [0.55, 0.35],
      [0.90, 0.75],    // curva rápida
      [0.20, 0.95],
      [-0.35, 0.65],
      [-0.65, 0.95],
      [-1.25, 0.65],
      [-1.55, 0.30],
    ],
  },
  {
    id: 2,
    name: { es: "Harbor Sprint", en: "Harbor Sprint" },
    // dos rectas largas + chicane fuerte + curva cerrada
    raw: [
      [-1.55, -0.05],
      [-1.10, -0.85],
      [-0.15, -1.05],
      [0.85, -0.90],   // recta 1
      [1.55, -0.25],
      [1.05, 0.05],    // frenada
      [1.45, 0.25],    // chicane 1
      [1.05, 0.45],    // chicane 2
      [1.45, 0.70],
      [0.85, 0.95],
      [0.00, 0.90],    // recta 2 "curvada"
      [-0.85, 0.75],
      [-1.45, 0.35],
      [-1.65, 0.10],
    ],
  },
  {
    id: 3,
    name: { es: "Forest Classic", en: "Forest Classic" },
    // muy fluido + una horquilla + sector medio rápido
    raw: [
      [-1.55, -0.25],
      [-1.10, -0.85],
      [-0.35, -1.05],
      [0.45, -0.95],
      [1.25, -0.55],   // rápida
      [1.55, 0.10],
      [1.10, 0.35],
      [0.85, 0.15],
      [0.55, 0.55],
      [0.25, 0.95],
      [-0.35, 0.85],
      [-0.75, 0.45],   // horquilla hacia abajo
      [-1.05, 0.85],
      [-1.55, 0.55],
      [-1.70, 0.05],
    ],
  },
];

const RaceGame = () => {
  const lang = navigator.language.startsWith("es") ? "es" : "en";

  const [showTutorial, setShowTutorial] = useState(true);
  const [showSetup, setShowSetup] = useState(true);

  const tutorial = tutorialTexts["/minigames/race"]?.[lang];

  const canvasRef = useRef(null);
  const rafRef = useRef(null);
  const lastRef = useRef(performance.now());
  const keysRef = useRef(new Set());

  // Inputs unificados (teclado + touch)
  const inputRef = useRef({
    throttle: 0,
    brake: 0,
    steer: 0, // -1..1
  });

  // Touch joystick
  const joyRef = useRef({
    active: false,
    pointerId: null,
    cx: 0,
    cy: 0,
  });

  // Cámara
  const cameraRef = useRef({ x: 0, y: 0 });

  const trackRef = useRef({
    width: 70,
    points: [],
    segLen: [],
    totalLen: 0,
    decorations: [],
    trackId: 0,
  });

  const carsRef = useRef([]);
  const stateRef = useRef({
    running: false,
    raceOver: false,
    totalLaps: 3,
    winnerName: null,
    trackId: 0,
  });

  const [laps, setLaps] = useState(3);
  const [hudText, setHudText] = useState("");
  const [trackLabel, setTrackLabel] = useState("");

  const COLORS = useMemo(
    () => ["#f34b4b", "#4bd6ff", "#ffd14b", "#7dff4b", "#c24bff", "#ff4bd8"],
    []
  );

  const translations = useMemo(() => {
    const es = {
      title: "🏁 Carrera 2D",
      subtitle: "Scrolling · Curvas que aparecen · Paisaje · Monoplazas",
      startRace: "Empezar carrera",
      restart: "Reiniciar",
      chooseLaps: "Elige vueltas",
      laps: "Vueltas",
      track: "Circuito",
      position: "Posición",
      lap: "Vuelta",
      speed: "Vel",
      sim: "km/h (sim)",
      standings: "Clasificación",
      finish: "Carrera terminada",
      victory: "¡Victoria!",
      lost: "Has perdido",
      winner: "Ganador",
      restartHint: "Pulsa “Reiniciar” para otra carrera",
      touchHint: "Controles táctiles: joystick (izq) + acelerar/frenar (dcha)",
      aiFinished: "IA terminó (la carrera sigue)",
    };
    const en = {
      title: "🏁 2D Race",
      subtitle: "Scrolling · Curves reveal · Scenery · Formula cars",
      startRace: "Start race",
      restart: "Restart",
      chooseLaps: "Choose laps",
      laps: "Laps",
      track: "Track",
      position: "Position",
      lap: "Lap",
      speed: "Speed",
      sim: "km/h (sim)",
      standings: "Leaderboard",
      finish: "Race finished",
      victory: "Victory!",
      lost: "You lost",
      winner: "Winner",
      restartHint: "Press “Restart” to race again",
      touchHint: "Touch: joystick (left) + accelerate/brake (right)",
      aiFinished: "AI finished (race continues)",
    };
    return lang === "es" ? es : en;
  }, [lang]);

  // ---------------------- track build (4 circuits) ----------------------
  const buildTrack = (trackId) => {
    const track = trackRef.current;
    const W = window.innerWidth;
    const H = window.innerHeight;

    // mundo grande y “largo”
    const base = Math.min(W, H);
    const s = base * 0.95;      // escala general
    const xStretch = 1.45;      // alarga el circuito (rectas)
    const yStretch = 1.10;

    const def = TRACKS.find((t) => t.id === trackId) ?? TRACKS[0];
    track.trackId = trackId;

    // coords mundo (centradas en 0,0)
    const rawWorld = def.raw.map(([nx, ny]) => [nx * s * xStretch, ny * s * yStretch]);

    // densificar (más puntos = circuito más “largo” y suave)
    const dense = [];
    const stepsPerEdge = 36;
    for (let i = 0; i < rawWorld.length; i++) {
      const a = rawWorld[i];
      const b = rawWorld[(i + 1) % rawWorld.length];
      for (let k = 0; k < stepsPerEdge; k++) {
        const tt = k / stepsPerEdge;
        dense.push([lerp(a[0], b[0], tt), lerp(a[1], b[1], tt)]);
      }
    }

    // smoothing suave
    const sm = dense.map((p, i) => {
      const p0 = dense[(i - 1 + dense.length) % dense.length];
      const p1 = dense[i];
      const p2 = dense[(i + 1) % dense.length];
      return [(p0[0] + 2 * p1[0] + p2[0]) / 4, (p0[1] + 2 * p1[1] + p2[1]) / 4];
    });

    track.points = sm;
    track.segLen = [];
    track.totalLen = 0;

    for (let i = 0; i < track.points.length; i++) {
      const p = track.points[i];
      const q = track.points[(i + 1) % track.points.length];
      const L = hypot2(q[0] - p[0], q[1] - p[1]);
      track.segLen.push(L);
      track.totalLen += L;
    }

    // decoraciones
    const decos = [];
    const step = 12;
    const shoulder = track.width + 95;

    for (let i = 0; i < track.points.length; i += step) {
      const p = track.points[i];
      const q = track.points[(i + 1) % track.points.length];
      const ang = Math.atan2(q[1] - p[1], q[0] - p[0]);

      const nx = -Math.sin(ang);
      const ny = Math.cos(ang);

      const r1 = hash01(i * 11.7 + trackId * 99.3);
      const r2 = hash01(i * 19.3 + trackId * 77.1);

      const side = r1 > 0.5 ? 1 : -1;
      const off = shoulder + r2 * 90;

      const x = p[0] + nx * off * side + (hash01(i * 2.1) - 0.5) * 30;
      const y = p[1] + ny * off * side + (hash01(i * 3.1) - 0.5) * 30;

      const type = hash01(i * 7.7 + trackId * 13.3) > 0.33 ? "tree" : "rock";
      const scale = 0.75 + hash01(i * 5.9 + trackId * 17.9) * 1.0;

      decos.push({ x, y, type, scale });
    }

    track.decorations = decos;

    // etiqueta UI
    setTrackLabel(def.name[lang] ?? def.name.en);
  };

  const sampleTrack = (s01) => {
    const track = trackRef.current;
    let d = wrap01(s01) * track.totalLen;

    for (let i = 0; i < track.points.length; i++) {
      const L = track.segLen[i];
      if (d <= L) {
        const p = track.points[i];
        const q = track.points[(i + 1) % track.points.length];
        const tt = L === 0 ? 0 : d / L;

        const x = lerp(p[0], q[0], tt);
        const y = lerp(p[1], q[1], tt);

        const tx = q[0] - p[0];
        const ty = q[1] - p[1];
        const ang = Math.atan2(ty, tx);

        return { x, y, ang };
      }
      d -= L;
    }

    const p = track.points[0];
    const q = track.points[1];
    return { x: p[0], y: p[1], ang: Math.atan2(q[1] - p[1], q[0] - p[0]) };
  };

  const closestOnTrack = (px, py) => {
    const track = trackRef.current;
    let best = { dist: Infinity, s: 0, cx: 0, cy: 0 };

    let accum = 0;
    for (let i = 0; i < track.points.length; i++) {
      const a = track.points[i];
      const b = track.points[(i + 1) % track.points.length];
      const vx = b[0] - a[0];
      const vy = b[1] - a[1];
      const L2 = vx * vx + vy * vy;

      let tt = 0;
      if (L2 > 1e-6) {
        tt = ((px - a[0]) * vx + (py - a[1]) * vy) / L2;
        tt = clamp(tt, 0, 1);
      }

      const cx = a[0] + tt * vx;
      const cy = a[1] + tt * vy;

      const dx = px - cx;
      const dy = py - cy;
      const dist = Math.hypot(dx, dy);

      const L = Math.sqrt(L2);
      if (dist < best.dist) {
        best = {
          dist,
          s: (accum + L * tt) / track.totalLen,
          cx,
          cy,
        };
      }
      accum += L;
    }
    return best;
  };

  // ---------------------- cars / game ----------------------
  const makeCar = (opts) => ({
    name: opts.name ?? "CAR",
    isPlayer: !!opts.isPlayer,
    color: opts.color ?? "#fff",
    x: 0,
    y: 0,
    a: 0,
    vx: 0,
    vy: 0,
    speed: 0,
    s: 0,
    lap: 1,
    finished: false,

    accel: opts.accel ?? 520,
    brake: opts.brake ?? 720,
    maxSpeed: opts.maxSpeed ?? 420,
    turnRate: opts.turnRate ?? 2.8,
    grip: opts.grip ?? 7.5,
    drag: opts.drag ?? 1.7,

    // colisiones
    radius: opts.radius ?? 18,
    mass: opts.mass ?? 1.0,
  });

  const pickRandomTrackId = () => Math.floor(Math.random() * TRACKS.length);

  const resetRace = (explicitTrackId = null) => {
    const st = stateRef.current;

    st.totalLaps = laps;
    st.raceOver = false;
    st.running = true;
    st.winnerName = null;

    const trackId = explicitTrackId ?? pickRandomTrackId();
    st.trackId = trackId;
    buildTrack(trackId);

    const cars = [];
    const start = sampleTrack(0);
    const start2 = sampleTrack(0.010);
    const baseAng = start2.ang;

    const dirNx = -Math.sin(baseAng);
    const dirNy = Math.cos(baseAng);

    const player = makeCar({
      name: "YOU",
      isPlayer: true,
      color: COLORS[0],
      maxSpeed: 470,
      accel: 600,
      grip: 8.6,
      turnRate: 3.0,
      drag: 1.55,
      radius: 18,
      mass: 1.05,
    });

    player.x = start.x + dirNx * 22;
    player.y = start.y + dirNy * 22;
    player.a = baseAng;
    player.s = 0;
    cars.push(player);

    for (let i = 1; i <= 5; i++) {
      const ai = makeCar({
        name: "AI-" + i,
        color: COLORS[i % COLORS.length],
        maxSpeed: 410 + (Math.random() * 40 - 20),
        accel: 500 + (Math.random() * 60 - 30),
        grip: 7.1 + Math.random() * 1.0,
        turnRate: 2.6 + Math.random() * 0.6,
        drag: 1.6 + Math.random() * 0.3,
        radius: 17,
        mass: 0.95,
      });

      const offsetS = i * 0.012;
      const sp = sampleTrack(offsetS);
      ai.x = sp.x + dirNx * (22 - i * 11);
      ai.y = sp.y + dirNy * (22 - i * 11);
      ai.a = baseAng;
      ai.s = wrap01(offsetS);
      cars.push(ai);
    }

    carsRef.current = cars;

    cameraRef.current.x = player.x;
    cameraRef.current.y = player.y;
  };

  const computeRanking = () => {
    const st = stateRef.current;
    const cars = carsRef.current.slice();

    cars.sort((a, b) => {
      // finished primero, y dentro de finished: mayor progreso
      if (a.finished && !b.finished) return -1;
      if (!a.finished && b.finished) return 1;

      const aLap = Math.min(a.lap, st.totalLaps + 1);
      const bLap = Math.min(b.lap, st.totalLaps + 1);
      if (aLap !== bLap) return bLap - aLap;

      return b.s - a.s;
    });

    return cars;
  };

  const updateCar = (car, dt) => {
    const st = stateRef.current;
    const track = trackRef.current;

    if (car.finished) return;

    let throttle = 0;
    let brake = 0;
    let steer = 0;

    if (car.isPlayer) {
      throttle = inputRef.current.throttle;
      brake = inputRef.current.brake;
      steer = inputRef.current.steer;

      // respawn
      if (keysRef.current.has(" ") || keysRef.current.has("r") || keysRef.current.has("R")) {
        const c = closestOnTrack(car.x, car.y);
        const sp = sampleTrack(c.s);
        car.x = sp.x;
        car.y = sp.y;
        car.a = sp.ang;
        car.vx = 0;
        car.vy = 0;
        car.speed = 0;
      }
    } else {
      // IA: target point ahead on path
      const lookAhead = 0.018 + clamp(car.speed / car.maxSpeed, 0, 1) * 0.040;
      const targetS = wrap01(car.s + lookAhead);
      const target = sampleTrack(targetS);

      const dx = target.x - car.x;
      const dy = target.y - car.y;
      const desired = Math.atan2(dy, dx);

      let err = desired - car.a;
      err = Math.atan2(Math.sin(err), Math.cos(err));
      steer = clamp(err * 1.7, -1, 1);

      const turnPenalty = clamp(Math.abs(err) / 1.2, 0, 1);
      const targetSpeed = car.maxSpeed * (1 - 0.60 * turnPenalty);

      if (car.speed < targetSpeed) throttle = 1;
      else brake = 0.40;
    }

    // dinámica
    const acc = throttle * car.accel - brake * car.brake;
    car.speed += acc * dt;
    car.speed -= car.drag * car.speed * dt;
    car.speed = clamp(car.speed, 0, car.maxSpeed);

    const speed01 = car.speed / car.maxSpeed;
    const steerEffect = car.turnRate * (0.55 + 0.45 * (1 - speed01));
    car.a += steer * steerEffect * dt;

    const fx = Math.cos(car.a);
    const fy = Math.sin(car.a);

    const desiredVx = fx * car.speed;
    const desiredVy = fy * car.speed;

    car.vx = lerp(car.vx, desiredVx, clamp(car.grip * dt, 0, 1));
    car.vy = lerp(car.vy, desiredVy, clamp(car.grip * dt, 0, 1));

    car.x += car.vx * dt;
    car.y += car.vy * dt;

    // límites pista
    const c = closestOnTrack(car.x, car.y);
    if (c.dist > track.width) {
      const push = c.dist - track.width;
      const nx = (car.x - c.cx) / (c.dist + 1e-6);
      const ny = (car.y - c.cy) / (c.dist + 1e-6);
      car.x -= nx * push;
      car.y -= ny * push;
      car.speed *= 0.83;
      car.vx *= 0.90;
      car.vy *= 0.90;
    }

    // progreso + vueltas
    const prevS = car.s;
    const newS = c.s;

    // crossing finish: de cerca de 1 -> cerca de 0
    const crossed = prevS > 0.88 && newS < 0.12;
    car.s = newS;

    if (crossed) {
      car.lap += 1;
      if (car.lap > st.totalLaps) car.finished = true;
    }
  };

  // ---------------------- collisions (car vs car) ----------------------
  const resolveCarCollisions = () => {
    const cars = carsRef.current;
    const restitution = 0.18; // rebote suave
    const friction = 0.05;    // fricción tangencial

    for (let i = 0; i < cars.length; i++) {
      for (let j = i + 1; j < cars.length; j++) {
        const a = cars[i];
        const b = cars[j];

        // si ambos finished, ignorar (evita empujones raros al final)
        if (a.finished && b.finished) continue;

        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.hypot(dx, dy);
        const minDist = a.radius + b.radius;

        if (dist <= 1e-6 || dist >= minDist) continue;

        // normal
        const nx = dx / dist;
        const ny = dy / dist;

        // separación (posición)
        const penetration = minDist - dist;
        const totalMass = a.mass + b.mass;

        const pushA = (penetration * (b.mass / totalMass)) * 1.05;
        const pushB = (penetration * (a.mass / totalMass)) * 1.05;

        a.x -= nx * pushA;
        a.y -= ny * pushA;
        b.x += nx * pushB;
        b.y += ny * pushB;

        // impulso (velocidad)
        const rvx = b.vx - a.vx;
        const rvy = b.vy - a.vy;
        const relVelN = rvx * nx + rvy * ny;

        // si ya se están separando, no impulsamos
        if (relVelN > 0) continue;

        const invMassA = 1 / a.mass;
        const invMassB = 1 / b.mass;

        const jImpulse = (-(1 + restitution) * relVelN) / (invMassA + invMassB);

        const impX = jImpulse * nx;
        const impY = jImpulse * ny;

        a.vx -= impX * invMassA;
        a.vy -= impY * invMassA;
        b.vx += impX * invMassB;
        b.vy += impY * invMassB;

        // fricción tangencial
        const tx = -ny;
        const ty = nx;
        const relVelT = rvx * tx + rvy * ty;
        const jt = -relVelT / (invMassA + invMassB);

        const fricX = jt * tx * friction;
        const fricY = jt * ty * friction;

        a.vx -= fricX * invMassA;
        a.vy -= fricY * invMassA;
        b.vx += fricX * invMassB;
        b.vy += fricY * invMassB;

        // “pierde velocidad” por choque
        a.speed *= 0.985;
        b.speed *= 0.985;
      }
    }
  };

  // ---------------------- canvas / render ----------------------
  const resizeCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    canvas.width = Math.floor(window.innerWidth * dpr);
    canvas.height = Math.floor(window.innerHeight * dpr);

    const ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  const drawBackground = (ctx, cam) => {
    const g = ctx.createLinearGradient(0, 0, 0, window.innerHeight);
    g.addColorStop(0, "#0b1b3a");
    g.addColorStop(1, "#0b0f14");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);

    ctx.fillStyle = "rgba(255,255,255,0.03)";
    ctx.fillRect(0, window.innerHeight * 0.48, window.innerWidth, window.innerHeight * 0.52);

    const baseY = window.innerHeight * 0.58;
    const shift = (cam.x * 0.08) % 700;

    ctx.fillStyle = "rgba(45, 65, 98, 0.35)";
    ctx.beginPath();
    ctx.moveTo(-900 + shift, baseY);

    for (let x = -900; x <= window.innerWidth + 900; x += 70) {
      const h = 45 + 32 * Math.sin((x + shift) * 0.012) + 22 * Math.sin((x + shift) * 0.02);
      ctx.lineTo(x + shift, baseY - h);
    }

    ctx.lineTo(window.innerWidth + 1000, window.innerHeight);
    ctx.lineTo(-1000, window.innerHeight);
    ctx.closePath();
    ctx.fill();
  };

  const drawDecorationsNearCamera = (ctx, cam) => {
    const track = trackRef.current;
    const maxDist = 1400;
    const maxDist2 = maxDist * maxDist;

    for (const d of track.decorations) {
      const dx = d.x - cam.x;
      const dy = d.y - cam.y;
      const dist2 = dx * dx + dy * dy;
      if (dist2 > maxDist2) continue;

      if (d.type === "tree") {
        const s = 18 * d.scale;
        ctx.fillStyle = "rgba(70,45,30,0.85)";
        ctx.fillRect(d.x - 3 * d.scale, d.y - 2 * d.scale, 6 * d.scale, 14 * d.scale);

        ctx.fillStyle = "rgba(50, 140, 70, 0.85)";
        ctx.beginPath();
        ctx.ellipse(d.x, d.y - 14 * d.scale, s, s * 0.85, 0, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = "rgba(140, 150, 165, 0.55)";
        ctx.beginPath();
        ctx.moveTo(d.x - 14 * d.scale, d.y + 6 * d.scale);
        ctx.lineTo(d.x - 6 * d.scale, d.y - 10 * d.scale);
        ctx.lineTo(d.x + 12 * d.scale, d.y - 6 * d.scale);
        ctx.lineTo(d.x + 16 * d.scale, d.y + 8 * d.scale);
        ctx.closePath();
        ctx.fill();
      }
    }
  };

  const drawTrackNearPlayer = (ctx, sCenter) => {
    const track = trackRef.current;
    const n = track.points.length;

    const s01 = wrap01(sCenter);
    const centerIdx = Math.floor(s01 * n);

    const behind = 120;
    const ahead = 330;

    const points = [];
    for (let k = -behind; k <= ahead; k++) {
      points.push(track.points[(centerIdx + k + n) % n]);
    }

    ctx.lineJoin = "round";
    ctx.lineCap = "round";

    // césped
    ctx.strokeStyle = "rgba(70, 130, 80, 0.25)";
    ctx.lineWidth = track.width * 2 + 280;
    ctx.beginPath();
    points.forEach((p, i) => (i === 0 ? ctx.moveTo(p[0], p[1]) : ctx.lineTo(p[0], p[1])));
    ctx.stroke();

    // tierra
    ctx.strokeStyle = "rgba(120, 110, 80, 0.18)";
    ctx.lineWidth = track.width * 2 + 130;
    ctx.beginPath();
    points.forEach((p, i) => (i === 0 ? ctx.moveTo(p[0], p[1]) : ctx.lineTo(p[0], p[1])));
    ctx.stroke();

    // borde
    ctx.strokeStyle = "rgba(255,255,255,0.08)";
    ctx.lineWidth = track.width * 2 + 38;
    ctx.beginPath();
    points.forEach((p, i) => (i === 0 ? ctx.moveTo(p[0], p[1]) : ctx.lineTo(p[0], p[1])));
    ctx.stroke();

    // asfalto
    ctx.strokeStyle = "rgba(85, 98, 118, 0.96)";
    ctx.lineWidth = track.width * 2;
    ctx.beginPath();
    points.forEach((p, i) => (i === 0 ? ctx.moveTo(p[0], p[1]) : ctx.lineTo(p[0], p[1])));
    ctx.stroke();

    // línea central discontinua
    ctx.strokeStyle = "rgba(255,255,255,0.18)";
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 12]);
    ctx.beginPath();
    points.forEach((p, i) => (i === 0 ? ctx.moveTo(p[0], p[1]) : ctx.lineTo(p[0], p[1])));
    ctx.stroke();
    ctx.setLineDash([]);

    // línea de meta (en s=0)
    const a = sampleTrack(0.0);
    const b = sampleTrack(0.006);
    const ang = b.ang;
    const nx = -Math.sin(ang);
    const ny = Math.cos(ang);

    ctx.strokeStyle = "rgba(255,255,255,0.85)";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(a.x + nx * (track.width + 10), a.y + ny * (track.width + 10));
    ctx.lineTo(a.x - nx * (track.width + 10), a.y - ny * (track.width + 10));
    ctx.stroke();
  };

  const drawF1Car = (ctx, car) => {
    ctx.save();
    ctx.translate(car.x, car.y);
    ctx.rotate(car.a);

    // sombra
    ctx.fillStyle = "rgba(0,0,0,0.28)";
    ctx.beginPath();
    ctx.ellipse(2, 7, 20, 12, 0, 0, Math.PI * 2);
    ctx.fill();

    // ruedas
    ctx.fillStyle = "#101114";
    ctx.fillRect(14, -14, 8, 10);
    ctx.fillRect(14, 4, 8, 10);
    ctx.fillRect(-22, -16, 10, 12);
    ctx.fillRect(-22, 4, 10, 12);

    // cuerpo
    ctx.fillStyle = car.color;
    ctx.beginPath();
    ctx.moveTo(-18, -8);
    ctx.lineTo(8, -10);
    ctx.lineTo(18, -4);
    ctx.lineTo(18, 4);
    ctx.lineTo(8, 10);
    ctx.lineTo(-18, 8);
    ctx.closePath();
    ctx.fill();

    // cockpit
    ctx.fillStyle = "rgba(10,10,10,0.75)";
    ctx.beginPath();
    ctx.ellipse(-2, 0, 6, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // alerones
    ctx.fillStyle = "rgba(255,255,255,0.16)";
    ctx.fillRect(16, -12, 4, 24);
    ctx.fillRect(-22, -14, 4, 28);

    // línea central
    ctx.strokeStyle = "rgba(255,255,255,0.35)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-10, 0);
    ctx.lineTo(15, 0);
    ctx.stroke();

    ctx.restore();

    ctx.fillStyle = "rgba(255,255,255,0.82)";
    ctx.font = "12px system-ui, sans-serif";
    ctx.fillText(car.name, car.x + 12, car.y - 12);
  };

  const drawLeaderboardOverlay = (ctx, ranking) => {
    const pad = 12;
    const boxW = 240;
    const x = window.innerWidth - boxW - pad;
    const y = pad;

    ctx.fillStyle = "rgba(0,0,0,0.45)";
    ctx.strokeStyle = "rgba(255,255,255,0.12)";
    ctx.lineWidth = 1;

    roundRect(ctx, x, y, boxW, 54 + ranking.length * 18, 12);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "rgba(255,255,255,0.92)";
    ctx.font = "13px system-ui, sans-serif";
    ctx.fillText(translations.standings, x + 12, y + 19);

    // track label
    ctx.fillStyle = "rgba(231, 238, 247, 0.72)";
    ctx.font = "12px system-ui, sans-serif";
    ctx.fillText(`${translations.track}: ${trackLabel}`, x + 12, y + 38);

    const st = stateRef.current;

    ctx.font = "12px system-ui, sans-serif";
    ranking.forEach((c, i) => {
      const yy = y + 62 + i * 18;
      ctx.fillStyle = c.color;
      ctx.fillText(`${i + 1}. ${c.name}`, x + 12, yy);

      ctx.fillStyle = "rgba(255,255,255,0.72)";
      const l = c.finished ? "FIN" : `L${Math.min(c.lap, st.totalLaps)}`;
      ctx.fillText(l, x + 188, yy);
    });
  };

  const drawRaceOverOverlay = (ctx, ranking) => {
    const st = stateRef.current;
    const you = carsRef.current.find((c) => c.isPlayer);

    const youWin = ranking[0]?.isPlayer;
    const title = youWin ? translations.victory : translations.finish;

    ctx.fillStyle = "rgba(0,0,0,0.62)";
    ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);

    ctx.fillStyle = "rgba(255,255,255,0.95)";
    ctx.font = "700 40px system-ui, sans-serif";
    ctx.fillText(title, window.innerWidth * 0.5 - ctx.measureText(title).width / 2, window.innerHeight * 0.42);

    ctx.font = "16px system-ui, sans-serif";
    const winnerLine = `${translations.winner}: ${ranking[0]?.name ?? "-"}`;
    ctx.fillText(winnerLine, window.innerWidth * 0.5 - ctx.measureText(winnerLine).width / 2, window.innerHeight * 0.42 + 34);

    const lapLine = you ? `${translations.lap}: ${st.totalLaps}/${st.totalLaps}` : "";
    ctx.fillText(lapLine, window.innerWidth * 0.5 - ctx.measureText(lapLine).width / 2, window.innerHeight * 0.42 + 58);

    ctx.font = "16px system-ui, sans-serif";
    ctx.fillText(
      translations.restartHint,
      window.innerWidth * 0.5 - ctx.measureText(translations.restartHint).width / 2,
      window.innerHeight * 0.42 + 94
    );
  };

  const loop = (now) => {
    const canvas = canvasRef.current;
    if (!canvas) {
      rafRef.current = requestAnimationFrame(loop);
      return;
    }

    const ctx = canvas.getContext("2d");
    const st = stateRef.current;

    const dt = Math.min(0.033, (now - lastRef.current) / 1000);
    lastRef.current = now;

    if (st.running && !st.raceOver) {
      // 1) integrar coches
      for (const car of carsRef.current) updateCar(car, dt);

      // 2) colisiones coche-coche (evita atravesar)
      // dos pasadas para hacerlo más robusto (sin coste grande)
      resolveCarCollisions();
      resolveCarCollisions();
    }

    const ranking = computeRanking();
    const you = carsRef.current.find((c) => c.isPlayer);

    // cámara suavizada (look-ahead)
    if (you) {
      const look = 180;
      const tx = you.x + Math.cos(you.a) * look;
      const ty = you.y + Math.sin(you.a) * look;

      cameraRef.current.x = lerp(cameraRef.current.x, tx, clamp(6.8 * dt, 0, 1));
      cameraRef.current.y = lerp(cameraRef.current.y, ty, clamp(6.8 * dt, 0, 1));
    }

    ctx.setTransform(1, 0, 0, 1, 0, 0);

    drawBackground(ctx, cameraRef.current);

    const cam = cameraRef.current;
    ctx.save();
    ctx.translate(window.innerWidth * 0.5 - cam.x, window.innerHeight * 0.62 - cam.y);

    drawDecorationsNearCamera(ctx, cam);
    drawTrackNearPlayer(ctx, you?.s ?? 0);

    carsRef.current
      .slice()
      .sort((a, b) => a.y - b.y)
      .forEach((c) => drawF1Car(ctx, c));

    ctx.restore();

    drawLeaderboardOverlay(ctx, ranking);

    // HUD
    if (you) {
      const yourPos = ranking.findIndex((c) => c.isPlayer) + 1;

      // ojo: you.lap puede ser totalLaps+1 al terminar
      const currentLap = you.finished ? st.totalLaps : Math.min(you.lap, st.totalLaps);
      const lapText = `${currentLap}/${st.totalLaps}`;

      // si IA terminó, no termina carrera, pero se ve en status
      const anyAiFinished = carsRef.current.some((c) => !c.isPlayer && c.finished);
      const extra = !you.finished && anyAiFinished ? ` · ${translations.aiFinished}` : "";

      const text =
        `${translations.position}: ${yourPos}/${carsRef.current.length} · ` +
        `${translations.lap}: ${lapText} · ` +
        `${translations.speed}: ${Math.round(you.speed)} ${translations.sim}` +
        extra;

      if (now % 6 < 1) setHudText(text);
    }

    // ✅ FIN DE CARRERA: SOLO CUANDO TERMINA EL JUGADOR
    if (you?.finished && !st.raceOver) {
      st.raceOver = true;
      st.running = false;
      st.winnerName = ranking[0]?.name ?? null;
    }

    if (st.raceOver) drawRaceOverOverlay(ctx, ranking);

    rafRef.current = requestAnimationFrame(loop);
  };

  // ---------------------- input mapping ----------------------
  const syncKeyboardToInput = () => {
    const keys = keysRef.current;

    const t = keys.has("ArrowUp") || keys.has("w") || keys.has("W") ? 1 : 0;
    const b = keys.has("ArrowDown") || keys.has("s") || keys.has("S") ? 1 : 0;

    const left = keys.has("ArrowLeft") || keys.has("a") || keys.has("A") ? 1 : 0;
    const right = keys.has("ArrowRight") || keys.has("d") || keys.has("D") ? 1 : 0;

    const joyActive = joyRef.current.active;

    inputRef.current.throttle = Math.max(inputRef.current.throttle, t);
    inputRef.current.brake = Math.max(inputRef.current.brake, b);

    if (!joyActive) inputRef.current.steer = right - left;
  };

  // ---------------------- init / lifecycle ----------------------
  useEffect(() => {
    if (showTutorial) return;
    // si estás en setup (aún no empieza), no inicializamos animación
    if (showSetup) return;

    const down = (e) => {
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(e.key)) e.preventDefault();
      keysRef.current.add(e.key);
      syncKeyboardToInput();
    };

    const up = (e) => {
      keysRef.current.delete(e.key);

      if (!joyRef.current.active) inputRef.current.steer = 0;

      const keys = keysRef.current;
      inputRef.current.throttle = keys.has("ArrowUp") || keys.has("w") || keys.has("W") ? 1 : 0;
      inputRef.current.brake = keys.has("ArrowDown") || keys.has("s") || keys.has("S") ? 1 : 0;

      if (!joyRef.current.active) {
        const left = keys.has("ArrowLeft") || keys.has("a") || keys.has("A") ? 1 : 0;
        const right = keys.has("ArrowRight") || keys.has("d") || keys.has("D") ? 1 : 0;
        inputRef.current.steer = right - left;
      }
    };

    window.addEventListener("keydown", down, { passive: false });
    window.addEventListener("keyup", up);

    const onResize = () => {
      resizeCanvas();
      // reconstruimos el mismo circuito actual al cambiar tamaño
      buildTrack(stateRef.current.trackId ?? 0);
    };
    window.addEventListener("resize", onResize);

    resizeCanvas();

    // arrancar una carrera (setup ya eligió laps)
    resetRace(null);

    lastRef.current = performance.now();
    rafRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("resize", onResize);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showTutorial, showSetup]);

  useEffect(() => {
    stateRef.current.totalLaps = laps;
  }, [laps]);

  const handleRestart = () => {
    stateRef.current.raceOver = false;
    stateRef.current.running = true;
    resetRace(null); // nuevo circuito aleatorio
  };

  // ---------------------- touch handlers ----------------------
  const onTouchThrottle = (on) => {
    inputRef.current.throttle = on ? 1 : 0;
  };

  const onTouchBrake = (on) => {
    inputRef.current.brake = on ? 1 : 0;
  };

  const onJoyPointerDown = (e) => {
    const el = e.currentTarget;
    const rect = el.getBoundingClientRect();

    joyRef.current.active = true;
    joyRef.current.pointerId = e.pointerId;
    joyRef.current.cx = rect.left + rect.width / 2;
    joyRef.current.cy = rect.top + rect.height / 2;

    el.setPointerCapture(e.pointerId);
  };

  const onJoyPointerMove = (e) => {
    if (!joyRef.current.active || joyRef.current.pointerId !== e.pointerId) return;

    const dx = e.clientX - joyRef.current.cx;
    const max = 60;
    const sx = clamp(dx / max, -1, 1);

    inputRef.current.steer = lerp(inputRef.current.steer, sx, 0.35);
  };

  const onJoyPointerUp = (e) => {
    if (joyRef.current.pointerId !== e.pointerId) return;

    joyRef.current.active = false;
    joyRef.current.pointerId = null;
    inputRef.current.steer = 0;
  };

  // ✅ Tutorial
  if (showTutorial) {
    return (
      <MinigameTutorial
        title={tutorial?.title || translations.title}
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

  // ✅ Setup (elige 3/5 antes de empezar)
  if (showSetup) {
    return (
      <div className="racegame racegame--setup">
        <div className="racegame__setupCard">
          <div className="racegame__setupTitle">{translations.title}</div>
          <div className="racegame__setupSub">{translations.subtitle}</div>

          <div className="racegame__setupRow">
            <div className="racegame__setupLabel">{translations.chooseLaps}</div>
            <div className="racegame__setupButtons">
              <button
                className={`racegame__setupBtn ${laps === 3 ? "isActive" : ""}`}
                onClick={() => setLaps(3)}
              >
                3
              </button>
              <button
                className={`racegame__setupBtn ${laps === 5 ? "isActive" : ""}`}
                onClick={() => setLaps(5)}
              >
                5
              </button>
            </div>
          </div>

          <button
            className="racegame__setupStart"
            onClick={() => setShowSetup(false)}
          >
            {translations.startRace}
          </button>

          <div className="racegame__setupHint">{translations.touchHint}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="racegame">
      <div className="racegame__ui">
        <div className="racegame__uiLeft">
          <div className="racegame__title">
            <div className="racegame__titleMain">{translations.title}</div>
            <div className="racegame__titleSub">{translations.subtitle}</div>
          </div>

          <div className="racegame__controls">
            <button className="racegame__button" onClick={handleRestart}>
              {translations.restart}
            </button>

            <div className="racegame__status">{hudText}</div>
            <div className="racegame__touchHint">{translations.touchHint}</div>
          </div>
        </div>
      </div>

      <canvas ref={canvasRef} className="racegame__canvas" />

      {/* Touch controls */}
      <div className="racegame__touch">
        <div
          className="racegame__joy"
          onPointerDown={onJoyPointerDown}
          onPointerMove={onJoyPointerMove}
          onPointerUp={onJoyPointerUp}
          onPointerCancel={onJoyPointerUp}
        >
          <div className={`racegame__joyKnob ${joyRef.current.active ? "isActive" : ""}`} />
        </div>

        <div className="racegame__touchRight">
          <button
            className="racegame__touchBtn"
            onPointerDown={() => onTouchThrottle(true)}
            onPointerUp={() => onTouchThrottle(false)}
            onPointerCancel={() => onTouchThrottle(false)}
          >
            ⬆
          </button>

          <button
            className="racegame__touchBtn"
            onPointerDown={() => onTouchBrake(true)}
            onPointerUp={() => onTouchBrake(false)}
            onPointerCancel={() => onTouchBrake(false)}
          >
            ⬇
          </button>
        </div>
      </div>
    </div>
  );
};

export default RaceGame;
