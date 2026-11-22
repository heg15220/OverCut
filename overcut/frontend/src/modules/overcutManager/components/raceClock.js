/**
 * The broadcast clock: where every car is at any instant of the race.
 *
 * The engine runs a Grand Prix a lap at a time and leaves, for every car, when
 * it started and finished each lap (and whether it stopped, or stopped for
 * good). The live view runs a race clock over that record. Within a lap a car
 * follows the circuit's own speed trace - slow in the hairpin, flat out down
 * the straight - so the field moves like a field; a lap with a stop leaves the
 * track at pit entry, waits in its box and rejoins at pit exit; a retirement
 * parks where it happened. Timing - gaps, intervals, who is fighting whom - is
 * read the way real timing reads it: at the line.
 *
 * Pure functions only; the view calls them every frame.
 */

import { distanceAtTimeShare, pitPoseAt, poseAt, timeShareAtDistance } from "../engine/trackGeometry";

/** Metres between grid slots, and how far behind the line pole sits. */
const GRID_GAP = 8;
const POLE_BACK = 6;

const lateral = (pose, metres) => ({ ...pose, x: pose.x - Math.sin(pose.heading) * metres, y: pose.y + Math.cos(pose.heading) * metres });

/** Index of the history entry under way at `tau` (the last one started). */
const entryIndex = (history, tau) => {
  let lo = 0;
  let hi = history.length - 1;
  if (hi < 0 || tau < history[0].start) return -1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (history[mid].start <= tau) lo = mid;
    else hi = mid - 1;
  }
  return lo;
};

/**
 * Where a car is at race time `tau` (seconds since the lights went out).
 * Returns a pose plus `progress` (laps covered, fractional) and flags.
 */
export const carAt = (car, tau, circuit, lapRef = 90) => {
  const history = car.history || [];
  const length = circuit.length;
  const gridShare = car.garage ? 0 : (POLE_BACK + (car.grid - 1) * GRID_GAP) / length;
  const index = entryIndex(history, tau);
  // Each team has its own box along the pit lane; sessions start and end in it.
  const pitBox = car.boxSlot !== undefined ? circuit.pit.lineAt * (0.22 + 0.7 * car.boxSlot) : circuit.pit.boxAt;
  // In the garage: off the pit lane, nose out towards it.
  const inside = circuit.clockwise ? 1 : -1;
  const inGarage = () => {
    const pose = lateral(pitPoseAt(circuit, pitBox), inside * 11.5);
    return { ...pose, heading: pose.heading - inside * (Math.PI / 2), progress: 0, laps: 0, inPit: true, stopped: true, stopLeft: 0, garage: true };
  };

  if (index === -1) {
    if (car.garage) return inGarage();
    const pose = lateral(poseAt(circuit, 1 - gridShare), (car.grid % 2 ? -1 : 1) * 2.6);
    return { ...pose, progress: -gridShare, laps: 0, onGrid: true };
  }

  const entry = history[index];
  const laps = index;
  const fromGrid = (d) => (index === 0 ? -gridShare + (1 + gridShare) * d : d);

  // A lap that has ended with no next lap yet: retired, finished, or waiting for the engine.
  if (tau >= entry.end) {
    if (car.garage) return inGarage();
    if (entry.retired) {
      const d = fromGrid(distanceAtTimeShare(circuit, entry.share));
      const parked = lateral(poseAt(circuit, d), 10);
      return { ...parked, progress: laps + d, laps, parked: true, gone: tau - entry.end > lapRef * 1.2 };
    }
    if (car.status === "finished" && index === history.length - 1) {
      // The slow-down lap after the flag.
      const d = Math.min(0.55, (tau - entry.end) / (lapRef * 1.8));
      return { ...poseAt(circuit, d), progress: laps + 1 + d, laps: laps + 1, finished: true };
    }
    return { ...poseAt(circuit, 0), progress: laps + 1, laps: laps + 1 };
  }

  const elapsed = tau - entry.start;
  const total = entry.end - entry.start;

  if (entry.retired) {
    const f = Math.max(0, elapsed / total);
    const d = fromGrid(distanceAtTimeShare(circuit, f * entry.share));
    return { ...poseAt(circuit, d), progress: laps + d, laps, stricken: true };
  }

  if (entry.pit) {
    const { lane, stationary } = entry.pit;
    const pit = circuit.pit;
    const racing = Math.max(1, total - lane - stationary);
    const toEntry = timeShareAtDistance(circuit, pit.entry) * racing;
    if (elapsed < toEntry) {
      const d = fromGrid(distanceAtTimeShare(circuit, elapsed / racing));
      return { ...poseAt(circuit, d), progress: laps + d, laps, boxing: true };
    }
    const inLane = elapsed - toEntry;
    const laneTime = Math.max(1, total - toEntry - stationary);
    const toBox = laneTime * (pitBox / pit.lineAt);
    let share;
    let stopped = false;
    if (inLane < toBox) share = (inLane / toBox) * pitBox;
    else if (inLane < toBox + stationary) {
      share = pitBox;
      stopped = true;
    } else share = pitBox + ((inLane - toBox - stationary) / Math.max(0.5, laneTime - toBox)) * (pit.lineAt - pitBox);
    const pose = pitPoseAt(circuit, Math.min(pit.lineAt, share));
    const d = pit.entry + (share / pit.lineAt) * (1 - pit.entry);
    return { ...pose, progress: laps + d, laps, inPit: true, stopped, stopLeft: stopped ? toBox + stationary - inLane : 0 };
  }

  const d = fromGrid(distanceAtTimeShare(circuit, elapsed / total));
  // Leaving the pits: the start of the lap after a stop is on the exit road.
  const previous = history[index - 1];
  if ((previous?.pit || (index === 0 && car.garage)) && d < circuit.pit.exit) {
    const pit = circuit.pit;
    const share = pit.lineAt + (d / pit.exit) * (1 - pit.lineAt);
    return { ...pitPoseAt(circuit, share), progress: laps + d, laps, inPit: true };
  }
  return { ...poseAt(circuit, d), progress: laps + d, laps };
};

/** The time a car crossed the line at the end of lap `lap` (1-based), if it has. */
const lineTime = (car, lap) => {
  const entry = car.history?.[lap - 1];
  return entry && !entry.retired ? entry.end : null;
};

/**
 * The running order and timing at `tau`: who is where, laps completed, the gap
 * to the leader and the interval to the car ahead, both measured at the line.
 */
export const standingsAt = (cars, tau, circuit, lapRef) => {
  const rows = cars.map((car) => {
    const pose = carAt(car, tau, circuit, lapRef);
    const completed = (car.history || []).filter((entry) => !entry.retired && entry.end <= tau).length;
    const out = (car.history || []).some((entry) => entry.retired && entry.end <= tau);
    return { car, pose, completed, out };
  });
  rows.sort((a, b) => {
    if (a.out !== b.out) return a.out ? 1 : -1;
    if (a.out && b.out) return (b.car.retiredLap ?? 0) - (a.car.retiredLap ?? 0);
    // Finished cars keep their finishing order.
    if (a.pose.finished && b.pose.finished) return lineTime(a.car, a.completed) - lineTime(b.car, b.completed);
    return b.pose.progress - a.pose.progress;
  });
  const leader = rows.find((row) => !row.out);
  rows.forEach((row, index) => {
    row.position = index + 1;
    if (row.out || !leader) return;
    if (row.completed === 0) {
      // Before anyone has crossed the line, time the gaps by road distance.
      const ahead = rows[index - 1];
      row.gap = Math.max(0, (leader.pose.progress - row.pose.progress) * lapRef);
      if (ahead && !ahead.out) row.interval = Math.max(0, (ahead.pose.progress - row.pose.progress) * lapRef);
      row.lapsDown = 0;
      return;
    }
    const mine = lineTime(row.car, row.completed);
    const theirs = lineTime(leader.car, row.completed);
    if (mine !== null && theirs !== null) {
      row.gap = mine - theirs;
      // Laps down: how many more laps the leader had finished when this car crossed.
      const leaderLaps = (leader.car.history || []).filter((entry) => !entry.retired && entry.end <= mine).length;
      row.lapsDown = Math.max(0, leaderLaps - row.completed);
    }
    const ahead = rows[index - 1];
    if (ahead && !ahead.out) {
      const theirLine = lineTime(ahead.car, row.completed);
      if (theirLine !== null && mine !== null) row.interval = mine - theirLine;
    }
  });
  return rows;
};

/** The lap the leader is on, 1-based, capped at the race distance. */
export const leaderLap = (rows, laps) => {
  const leader = rows.find((row) => !row.out);
  return Math.max(1, Math.min(laps, (leader?.completed ?? 0) + 1));
};

/** When the race clock reaches an event, so the commentary keeps time with the pictures. */
export const eventTime = (event, carsById, circuit, leaderId) => {
  const car = carsById[event.carId] || carsById[leaderId];
  const entry = car?.history?.[event.lap - 1];
  if (!entry) return Infinity;
  if (event.type === "pit" || event.type === "flag" || event.type === "fastest" || event.type === "lead" || event.type === "swap") return entry.end;
  if (event.type === "dnf") return entry.end;
  const corner = event.corner && circuit.corners.find((item) => item.number === event.corner);
  if (corner && !entry.retired && !entry.pit) return entry.start + (entry.end - entry.start) * timeShareAtDistance(circuit, corner.apex);
  return entry.start + (entry.end - entry.start) * 0.5;
};

/** Safety-car spells, as race-clock windows, from the event list. */
export const safetyCarWindows = (events, carsById, circuit, leaderId) => {
  const windows = [];
  let open = null;
  events.forEach((event) => {
    if ((event.type === "sc" || event.type === "vsc") && !open) open = { from: eventTime(event, carsById, circuit, leaderId), virtual: event.type === "vsc" };
    if (event.type === "sc-in" && open) {
      const leader = carsById[leaderId];
      const end = leader?.history?.[event.lap - 1]?.end ?? Infinity;
      windows.push({ ...open, to: end });
      open = null;
    }
  });
  if (open) windows.push({ ...open, to: Infinity });
  return windows;
};

/** When the last car still running takes the flag (or the race clock end of the data). */
export const raceEndTime = (state) => {
  if (!state.finished) return Infinity;
  let end = 0;
  state.cars.forEach((car) => {
    const last = car.history?.[car.history.length - 1];
    if (last) end = Math.max(end, last.end);
  });
  return end;
};

/** The earliest line crossing the engine has computed for a running car: past it, run another lap. */
export const computedUntil = (state) => {
  let until = Infinity;
  state.cars.forEach((car) => {
    if (car.status !== "running") return;
    const last = car.history?.[car.history.length - 1];
    until = Math.min(until, last ? last.end : -1);
  });
  return until;
};

/**
 * Pairs of cars close enough on the road to be racing, nearest first; the TV
 * director cuts to these.
 */
export const battlesIn = (rows) => {
  const battles = [];
  for (let index = 1; index < rows.length; index += 1) {
    const row = rows[index];
    const ahead = rows[index - 1];
    if (row.out || ahead.out || row.pose.inPit || ahead.pose.inPit || row.pose.finished) continue;
    if (row.interval !== undefined && row.interval < 1 && row.lapsDown === 0) battles.push({ position: ahead.position, attacker: row, defender: ahead, gap: row.interval });
  }
  return battles;
};

/** Offset a pose sideways (positive = right of travel). */
export const offsetPose = lateral;
