import { fallbackBootstrap } from "../../overcutTrayectoria/data/fallbackBootstrap";
import { reference } from "../data/reference";
import { createContext, createCareer, runPractice, runQualifyingSession, createWeekendRace, currentRace } from "./career";
import { stepLap } from "./race";
import { circuitFor } from "./venue";
import { carAt } from "../components/raceClock";
import { onRacingLine } from "../three/racingLine";

// On screen a car must move like one: no lurches between samples of the
// speed trace, no snaps of heading at the joints of the centreline.
test("cars move smoothly on the racing line", () => {
  const context = createContext(fallbackBootstrap, reference);
  const career = createCareer(context, { year: 2024, teamId: "ferrari", seed: "m" });
  runPractice(career, {});
  runQualifyingSession(career, {});
  const state = createWeekendRace(career);
  for (let i = 0; i < 6; i += 1) stepLap(state);
  const circuit = circuitFor(currentRace(career), 2024);
  const car = state.cars[3];
  const dt = 1 / 60;
  let prev = null;
  let prevV = null;
  const accs = [];
  const yawJumps = [];
  let prevYaw = null;
  for (let tau = 200; tau < 290; tau += dt) {
    const pose = onRacingLine(circuit, carAt(car, tau, circuit, state.race.baseLap));
    if (pose.inPit || pose.gone) { prev = null; prevV = null; prevYaw = null; continue; }
    if (prev) {
      const v = [(pose.x - prev.x) / dt, (pose.y - prev.y) / dt];
      if (prevV) accs.push(Math.hypot(v[0] - prevV[0], v[1] - prevV[1]) / dt);
      const yaw = Math.atan2(v[1], v[0]);
      if (prevYaw !== null) { let d = yaw - prevYaw; d = Math.atan2(Math.sin(d), Math.cos(d)); yawJumps.push(Math.abs(d) / dt); }
      prevYaw = yaw;
      prevV = v;
    }
    prev = pose;
  }
  accs.sort((a, b) => a - b);
  yawJumps.sort((a, b) => a - b);
  const q = (arr, p) => arr[Math.floor(arr.length * p)];
  // F1 cars peak around 6 g in braking and cornering.
  expect(q(accs, 0.99)).toBeLessThan(120);
  expect(yawJumps[yawJumps.length - 1]).toBeLessThan(4);
});
