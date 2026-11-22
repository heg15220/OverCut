/**
 * Practice and qualifying, as sessions you can watch.
 *
 * The qualifying result is decided by `runQualifying`; this module turns it
 * into what happened on track: every car leaves its garage, does an out-lap, a
 * flying lap and an in-lap, waits in the garage, and goes out again. Laps are
 * written as the same line-crossing records the race leaves (`start`, `end`,
 * an in-lap carrying `pit` with the garage wait as its stationary time), so the
 * broadcast clock can place every car on the circuit at any instant.
 *
 *   knockout (2006-)  Q1 18 min, Q2 15 min, Q3 12 min; two runs each; the
 *                     slowest drop out at the end of Q1 and Q2.
 *   single (-2005)    one hour, three runs; the best lap is the grid.
 *   practice          an hour of long runs: out-lap, four to seven timed laps,
 *                     in-lap, three times.
 *
 * Everything is drawn from a seeded stream, so a weekend replays the same.
 */

import { clamp, createStream } from "../../overcutTrayectoria/engine/rng";

const KNOCKOUT_MINUTES = [18, 15, 12];

/**
 * One car's session: a list of runs, each `{ start, flying: [times] }`, turned
 * into lap records. Out- and in-laps are slower than a flying lap by a share of
 * the reference lap; the last in-lap waits until the session is over.
 */
const recordsFor = (runs, { baseLap, end }) => {
  const records = [];
  let lap = 0;
  runs.forEach((run, index) => {
    let clock = Math.max(run.start, records.length ? records[records.length - 1].end : 0);
    const out = baseLap * 1.3;
    records.push({ lap: (lap += 1), start: clock, end: clock + out, out: true });
    clock += out;
    run.flying.forEach((time) => {
      records.push({ lap: (lap += 1), start: clock, end: clock + time, flying: time });
      clock += time;
    });
    const inLap = baseLap * 1.28;
    const next = runs[index + 1];
    const wait = next ? Math.max(20, next.start - (clock + inLap)) : Math.max(60, end + 240 - (clock + inLap));
    records.push({ lap: (lap += 1), start: clock, end: clock + inLap + wait, pit: { lane: 0, stationary: wait }, in: true });
  });
  return records;
};

/**
 * The watchable version of a qualifying result. `quali` is what
 * `runQualifying` returned; `ids` the entrants in their usual order.
 */
export const qualifyingTimeline = ({ quali, baseLap, seed, ids }) => {
  const stream = createStream(`${seed}::quali-timeline`);
  if (quali.format === "knockout" && quali.sessions) {
    const sessions = quali.sessions.map((laps, index) => {
      const duration = KNOCKOUT_MINUTES[index] * 60;
      const next = quali.sessions[index + 1];
      const drop = next ? laps.length - next.length : 0;
      const histories = {};
      laps.forEach(({ id, time }) => {
        const first = time + stream.range(0.15, 1.1);
        const runs = [
          { start: stream.range(0.04, 0.32) * duration, flying: [first] },
          { start: stream.range(0.6, 0.74) * duration, flying: [time] },
        ];
        histories[id] = recordsFor(runs, { baseLap, end: duration });
      });
      return { name: `Q${index + 1}`, duration, drop, ids: laps.map((row) => row.id), histories };
    });
    return { format: "knockout", sessions };
  }
  // One hour, three runs, the last the quickest.
  const duration = 3600;
  const histories = {};
  const order = quali.order || ids;
  order.forEach((id) => {
    const time = quali.times[id];
    if (!Number.isFinite(time)) return;
    const runs = [0.12, 0.45, 0.78].map((share, run) => ({
      start: clamp(share + stream.range(-0.06, 0.06), 0.02, 0.86) * duration,
      flying: [run === 2 ? time : time + stream.range(0.3, 1.6)],
    }));
    histories[id] = recordsFor(runs, { baseLap, end: duration });
  });
  return { format: "single", sessions: [{ name: "Q", duration, drop: 0, ids: order.filter((id) => histories[id]), histories }] };
};

/**
 * A practice hour. `paces` maps a car to its expected lap time; every run is a
 * handful of laps a second or two off qualifying pace, as long runs are.
 */
export const practiceTimeline = ({ ids, paces, baseLap, seed, duration = 3600 }) => {
  const stream = createStream(`${seed}::practice-timeline`);
  const histories = {};
  ids.forEach((id) => {
    const pace = paces[id] ?? baseLap;
    const runs = [0.06, 0.38, 0.7].map((share) => {
      const laps = stream.int(4, 7);
      const fuel = stream.range(0.6, 1.8);
      return {
        start: clamp(share + stream.range(-0.04, 0.08), 0.01, 0.85) * duration,
        flying: Array.from({ length: laps }, (_, lap) => pace + fuel - lap * 0.05 + stream.normal(0, 0.25)),
      };
    });
    histories[id] = recordsFor(runs, { baseLap, end: duration });
  });
  return { format: "practice", sessions: [{ name: "FP", duration, drop: 0, ids, histories }] };
};

/** Best flying lap of a car up to session time `tau`, and how many laps it has done. */
export const sessionStatus = (history = [], tau) => {
  let best = null;
  let laps = 0;
  let current = null;
  history.forEach((record) => {
    if (record.end <= tau) {
      if (record.flying) {
        laps += 1;
        if (best === null || record.flying < best) best = record.flying;
      }
    } else if (record.start <= tau && !current) current = record;
  });
  const state = !current ? "garage" : current.in ? (tau - current.start > current.end - current.start - (current.pit?.stationary ?? 0) ? "garage" : "in") : current.out ? "out" : "flying";
  return { best, laps, state, lapClock: current?.flying ? tau - current.start : null };
};
