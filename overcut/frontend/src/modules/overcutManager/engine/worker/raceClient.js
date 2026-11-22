/**
 * The main-thread side of the race worker (SRS 4): it starts the worker, speaks the
 * raceSession protocol, and keeps a mirror of the race for the view - the state as the
 * UI reads it (cars, history, events, radio), plus the recent position snapshots the
 * live view interpolates between. Orders go down, state and events come up (SRS 4
 * diagram); the full simulator state never leaves the worker.
 *
 * Where there is no Worker (jest's jsdom, SSR) or it fails to start, the same
 * raceSession handler runs in-thread and replies synchronously: the race is identical,
 * only the thread differs (RNF-05).
 */

import { createRaceSession } from "./raceSession";

/** Position snapshots kept for interpolation: one per step, some 40 s of race. */
const KEEP_SNAPSHOTS = 160;

// ------------------------------------------------------------------ mirror

/** The view's copy of the race from the `created` reply. */
export const mirrorOf = (created) => {
  const mirror = created.state;
  mirror.cars.forEach((car) => {
    car.history = car.history || [];
  });
  mirror.events = (mirror.events || []).map((event) => ({ ...event, at: 0 }));
  mirror.radio = (mirror.radio || []).map((message) => ({ ...message, at: 0 }));
  mirror.duels = [];
  mirror.commands = created.commands;
  mirror.dt = created.dt;
  mirror.clock = 0;
  mirror.snapshots = [];
  mirror.indexOf = Object.fromEntries(mirror.cars.map((car, index) => [car.id, index]));
  if (created.view) applyTick(mirror, created.view);
  return mirror;
};

/** Fold one `tick` into the mirror. */
export const applyTick = (mirror, tick) => {
  tick.cars.forEach((patch, index) => {
    const car = mirror.cars[index];
    const { newHistory, ...rest } = patch;
    Object.assign(car, rest);
    if (newHistory && newHistory.length) car.history.push(...newHistory);
  });
  if (tick.events.length) mirror.events.push(...tick.events);
  if (tick.radio.length) mirror.radio.push(...tick.radio);
  if (tick.duels && tick.duels.length) mirror.duels.push(...tick.duels);
  mirror.clock = tick.clock;
  mirror.lap = tick.lap;
  mirror.finished = tick.finished;
  mirror.safetyCar = tick.safetyCar;
  mirror.safetyCarSpells = tick.safetyCarSpells;
  mirror.yellowZones = tick.yellowZones || [];
  mirror.fastestLap = tick.fastestLap;
  mirror.teamOrders = tick.teamOrders;
  mirror.restartLap = tick.restartLap;
  tick.trail.forEach((shot) => {
    const last = mirror.snapshots[mirror.snapshots.length - 1];
    if (last && last.clock === shot.clock) mirror.snapshots[mirror.snapshots.length - 1] = shot;
    else if (!last || shot.clock > last.clock) mirror.snapshots.push(shot);
  });
  if (mirror.snapshots.length > KEEP_SNAPSHOTS) mirror.snapshots.splice(0, mirror.snapshots.length - KEEP_SNAPSHOTS);
  return mirror;
};

// ------------------------------------------------------------------ client

const hasWorker = () => typeof Worker !== "undefined" && typeof window !== "undefined";

/**
 * A race behind a worker. `listener(reply)` hears every reply (created, tick, finished,
 * state, error). `worker: false` forces the in-thread engine.
 */
export const createRaceClient = ({ listener, worker = true } = {}) => {
  let kind = "inline";
  let session = null;
  let port = null;
  let queue = [];
  let nextId = 1;
  let inFlight = 0;
  let disposed = false;
  let sentLog = [];

  const receive = (reply) => {
    if (disposed) return;
    inFlight = Math.max(0, inFlight - 1);
    listener?.(reply);
  };

  const inline = () => {
    kind = "inline";
    session = createRaceSession();
    port = null;
  };

  const post = (message) => {
    inFlight += 1;
    if (session) receive(session.handle(message));
    else if (port) port.postMessage(message);
    else queue.push(message);
  };

  // Worker start-up failed: run in-thread and replay what was already sent.
  const fallBack = () => {
    if (disposed || session) return;
    inline();
    const pending = sentLog.concat(queue);
    queue = [];
    inFlight = 0;
    pending.forEach(post);
  };

  if (worker && hasWorker()) {
    kind = "worker";
    import("./spawnWorker")
      .then(({ default: spawn }) => {
        if (disposed) return;
        const instance = spawn();
        instance.onmessage = (event) => {
          sentLog = null;
          receive(event.data);
        };
        instance.onerror = (event) => {
          if (sentLog) {
            event.preventDefault?.();
            instance.terminate();
            fallBack();
          } else listener?.({ type: "error", message: event.message || "race worker error" });
        };
        port = instance;
        const pending = queue;
        queue = [];
        pending.forEach((message) => {
          if (sentLog) sentLog.push(message);
          instance.postMessage(message);
        });
      })
      .catch(fallBack);
  } else inline();

  const send = (type, payload = {}) => {
    if (disposed) return null;
    const id = nextId;
    nextId += 1;
    const message = { id, type, ...payload };
    if (port && sentLog) sentLog.push(message);
    post(message);
    return id;
  };

  return {
    get kind() {
      return kind;
    },
    /** The id the next message will carry (the in-thread engine answers before send returns). */
    get upcomingId() {
      return nextId;
    },
    /** Replies still owed (the view does not queue steps behind a busy engine). */
    get busy() {
      return inFlight > 0;
    },
    create: (args) => send("create", { args }),
    step: (seconds) => send("step", { seconds }),
    next: (types) => send("next", { types }),
    lap: () => send("lap"),
    command: (name, ...args) => send("command", { name, args }),
    finish: () => send("finish"),
    state: () => send("state"),
    dispose: () => {
      if (disposed) return;
      disposed = true;
      if (port) port.terminate();
      port = null;
      session = null;
    },
  };
};
