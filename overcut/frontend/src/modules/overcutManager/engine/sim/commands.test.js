/**
 * RF-CMD-01/02 on the step race the live view plays (through the worker protocol): every
 * order the pit wall offers changes what happens on track from the moment it is given,
 * a requested stop moves the stop lap, a planned stop can be delayed or cancelled, the
 * fuel of a refuelling stop is the player's to set, and the same orders at the same race
 * time give the same race (RF-SIM-15, RNF-05).
 */

import { classificationOf } from "../race";
import { weekendRaceArgs } from "../career";
import { weekend } from "./simTestKit";
import { createRaceSession } from "../worker/raceSession";

const fingerprint = (state) => JSON.stringify({ rows: classificationOf(state), events: state.events, history: state.cars.map((car) => car.history) });

/** A race through the protocol: `orders` are [raceSeconds, name, ...args]. */
const play = (args, orders = []) => {
  const session = createRaceSession();
  session.handle({ type: "create", args });
  let clock = 0;
  orders.forEach(([at, name, ...rest]) => {
    if (at > clock) session.handle({ type: "step", seconds: at - clock });
    clock = at;
    const reply = session.handle({ type: "command", name, args: rest });
    expect(reply.type).toBe("tick");
  });
  const done = session.handle({ type: "finish" });
  return done.state;
};

// The stops the plan and the orders decide: a forced stop for a puncture or a broken wing (RF-SIM-09) is not one of them.
const repairLaps = (state, carId) => new Set(state.events.filter((event) => event.type === "pit" && event.carId === carId && event.repair).map((event) => event.lap));
const pitLaps = (state, carId) => {
  const repairs = repairLaps(state, carId);
  return state.cars.find((car) => car.id === carId).history.filter((entry) => entry.pit && !repairs.has(entry.lap)).map((entry) => entry.lap);
};

const sunday = (year, seed) => {
  const w = weekend({ year, seed });
  const args = weekendRaceArgs(w.career);
  const user = args.entrants.filter((entrant) => entrant.isUser).map((entrant) => entrant.id);
  return { args, user, career: w.career };
};

describe("RF-CMD-01/02: every order changes the race", () => {
  const { args: given, user } = sunday(2024, "orders");
  // The player's cars from the back, so they have cars to attack and to fight each other.
  const args = { ...given, grid: [...given.grid.filter((id) => !user.includes(id)), ...user] };
  const base = play(args);
  const baseLine = fingerprint(base);
  const lapTimes = (state, id) => state.cars.find((car) => car.id === id).history.map((entry) => Math.round((entry.end - entry.start) * 1000));

  it.each([
    ["setMode attack", [[200, "setMode", user[0], "attack"]]],
    ["setMode conserve", [[200, "setMode", user[0], "conserve"]]],
    ["setMix lean (lift and coast)", [[200, "setMix", user[0], "lean"]]],
    ["setErs deploy", [[200, "setErs", user[0], "deploy"]]],
    ["setDefence block", [[30, "setDefence", user[0], "block"], [30, "setDefence", user[1], "block"]]],
    ["setOvertakeRisk high", [[30, "setOvertakeRisk", user[0], "high"], [30, "setOvertakeRisk", user[1], "high"]]],
    ["setTeamOrder swap", [[30, "setTeamOrder", given.entrants.find((entrant) => entrant.isUser).teamId, "swap"]]],
  ])("%s", (_, orders) => {
    const changed = play(args, orders);
    expect(fingerprint(changed)).not.toBe(baseLine);
    // Nothing before the order moves.
    const at = orders[0][0];
    const before = (state) => state.cars.map((car) => car.history.filter((entry) => entry.end < at - 1).map((entry) => entry.end));
    expect(JSON.stringify(before(changed))).toBe(JSON.stringify(before(base)));
  });

  it("pace: attack is quicker per lap than conserve on the same car", () => {
    // In clean air, from pole: from the back the car sits in a train and traffic, not the
    // order, decides its lap times (the physical speed trace moved the braking zones, WP2).
    const front = { ...given, grid: [user[0], ...given.grid.filter((id) => id !== user[0])] };
    const fast = play(front, [[200, "setMode", user[0], "attack"]]);
    const slow = play(front, [[200, "setMode", user[0], "conserve"]]);
    // Eight laps from lap 5 that neither race ran behind (or just after) a safety car or VSC: the
    // order moves every car's draws, so a crash elsewhere can bring one out in one race only
    // (135 s laps against 95 s).
    const neutralised = (state) => {
      const laps = new Set();
      let open = null;
      state.events.forEach((event) => {
        if ((event.type === "sc" || event.type === "vsc") && open === null) open = event.lap;
        if (event.type === "sc-in" && open !== null) {
          for (let lap = open; lap <= event.lap + 1; lap += 1) laps.add(lap);
          open = null;
        }
      });
      if (open !== null) for (let lap = open; lap <= state.laps; lap += 1) laps.add(lap);
      return laps;
    };
    const skip = new Set([...neutralised(fast), ...neutralised(slow)]);
    const laps = Array.from({ length: 20 }, (_, k) => k + 5).filter((lap) => !skip.has(lap)).slice(0, 8);
    expect(laps.length).toBe(8);
    const sum = (state) => laps.reduce((total, lap) => total + lapTimes(state, user[0])[lap - 1], 0);
    expect(sum(fast)).toBeLessThan(sum(slow));
  });

  it("a requested stop changes the stop lap; cancelling it before pit entry keeps the plan", () => {
    const planned = pitLaps(base, user[0]);
    expect(planned.length).toBeGreaterThan(0);
    const early = play(args, [[300, "requestPit", user[0], "hard"]]);
    const earlyLaps = pitLaps(early, user[0]);
    expect(earlyLaps[0]).toBeLessThan(planned[0]);
    // Brought forward (the pit wall's "box this lap"): the same number of stops, the first one earlier.
    const forward = pitLaps(play(args, [[300, "requestPit", user[0], "hard", { replace: true }]]), user[0]);
    expect(forward[0]).toBeLessThan(planned[0]);
    expect(forward.length).toBe(planned.length);
    const cancelled = play(args, [[300, "requestPit", user[0], "hard"], [301, "cancelPit", user[0]]]);
    expect(pitLaps(cancelled, user[0])[0]).toBe(planned[0]);
  });

  it("delaying the planned stop moves it a lap later; skipping it drops it", () => {
    const planned = pitLaps(base, user[0]);
    const delayed = play(args, [[100, "delayStop", user[0]]]);
    expect(pitLaps(delayed, user[0])[0]).toBe(planned[0] + 1);
    const skipped = play(args, [[100, "skipStop", user[0]]]);
    expect(pitLaps(skipped, user[0]).length).toBe(planned.length - 1);
  });

  it("the same orders at the same race time give the same race (RF-SIM-15, RNF-05)", () => {
    const orders = [[150, "setMode", user[0], "push"], [400, "requestPit", user[1], "medium"], [800, "setDefence", user[0], "block"]];
    expect(fingerprint(play(args, orders))).toBe(fingerprint(play(args, orders)));
  });
});

describe("RF-CMD-02 in a refuelling era (2008)", () => {
  it("the player sets the fuel of a requested stop, and it is what goes in", () => {
    // Seed "refuel-c": on "refuel" the long-fill car is taken out by a collision before its next stop
    // since the fuel's real weight (RF-SIM-04) changed the plans, leaving nothing to compare.
    const { args, user } = sunday(2008, "refuel-c");
    const short = play(args, [[200, "requestPit", user[0], null, { fuel: 6 }]]);
    const long = play(args, [[200, "requestPit", user[0], null, { fuel: 30 }]]);
    const stopOf = (state) => state.events.find((event) => event.type === "pit" && event.carId === user[0]);
    expect(stopOf(short).refuel).toBeLessThan(stopOf(long).refuel);
    // A short fill brings the car back sooner.
    expect(pitLaps(short, user[0])[1]).toBeLessThan(pitLaps(long, user[0])[1]);
  });
});
