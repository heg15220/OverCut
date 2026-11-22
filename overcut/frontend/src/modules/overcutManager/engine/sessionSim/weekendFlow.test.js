/**
 * The playable sessions inside a career weekend (RF-WKD-01/02/03/05, SRS 6.2): a played
 * practice feeds the weekend's practice and tyre sets, a played qualifying becomes the
 * grid in the quick mode's shape, race fuel declared in a race-fuel era is the first stop
 * (parc fermé, 2008), the top ten's qualifying tyre is their start tyre (2013), and a
 * sprint weekend (2024) runs shootout and sprint with the pack's sprint points.
 */

import { fallbackBootstrap } from "../../../overcutTrayectoria/data/fallbackBootstrap";
import { reference } from "../../data/reference";
import {
  commitPracticeSession, commitQualifyingSession, completeRace, completeSprint, createCareer, createContext, createSprintRace, createWeekendRace, createWeekendSession,
  currentRace, isSprintWeekend, runShootout, weekendRaceArgs,
} from "../career";
import { loadSeasonPack } from "../packs/seasonPacks";
import { runToFinish } from "../race";
import { command, nextSegment, runSegmentToEnd, runSessionToEnd, sessionResult } from ".";

let context = null;
beforeAll(async () => {
  const loaded = await Promise.all([2008, 2013, 2024].map((year) => loadSeasonPack(year)));
  context = createContext(fallbackBootstrap, reference, Object.fromEntries(loaded.map(({ pack }) => [pack.year, pack])));
});

const userIds = (session) => session.cars.filter((car) => car.isUser).map((car) => car.id);

const playPractice = (career) => {
  const practice = createWeekendSession(career, "practice");
  runSessionToEnd(practice);
  return commitPracticeSession(career, sessionResult(practice), {});
};

describe("playable sessions in the weekend", () => {
  it("practice then qualifying, played, give the weekend its practice, tyres and grid", () => {
    const career = createCareer(context, { year: 2013, teamId: "ferrari", seed: "flow" });
    playPractice(career);
    expect(career.weekend.practice).toBeTruthy();
    expect(career.weekend.stage).toBe("qualifying");
    expect(career.weekend.tyres).toBeTruthy();
    const quali = createWeekendSession(career, "qualifying");
    // Tyres used on Friday are used on Saturday (RF-WKD-05).
    const used = quali.cars[0].tyres.filter((set) => set.laps > 0).length;
    expect(used).toBeGreaterThan(0);
    runSessionToEnd(quali);
    const result = sessionResult(quali);
    commitQualifyingSession(career, result);
    expect(career.weekend.stage).toBe("strategy");
    expect(career.weekend.qualifying.order).toEqual(result.order);
    // 2013: the top ten start on the tyre of their best Q3 lap.
    const args = weekendRaceArgs(career);
    expect(Object.keys(args.startTyres || {}).length).toBeGreaterThan(0);
    const state = createWeekendRace(career);
    const top = result.order[0];
    expect(state.cars.find((car) => car.id === top).compound).toBe(args.startTyres[top]);
  });

  it("2008 race fuel: the fuel declared in Q3 is the first stop on Sunday (parc fermé)", () => {
    const career = createCareer(context, { year: 2008, teamId: "ferrari", seed: "fuel" });
    playPractice(career);
    const quali = createWeekendSession(career, "qualifying");
    const [a, b] = userIds(quali);
    // Both through to Q3 on the engineers' runs, then the player fuels car A for 14 laps.
    command(quali, "autopilot", a);
    command(quali, "autopilot", b);
    // Drive to Q3 segment by segment.
    while (quali.segment < quali.segments.length - 1) {
      runSegmentToEnd(quali);
      nextSegment(quali);
    }
    expect(quali.segments[quali.segment].raceFuel).toBe(true);
    const inQ3 = !quali.cars.find((car) => car.id === a).eliminated;
    if (inQ3) {
      quali.cars.find((car) => car.id === a).auto = false;
      quali.cars.find((car) => car.id === a).aiPlans = [];
      expect(command(quali, "sendOut", a, { push: 1, fuel: 14 })).toBe(true);
    }
    runSegmentToEnd(quali, { autopilot: false });
    const result = sessionResult(quali);
    commitQualifyingSession(career, result);
    const args = weekendRaceArgs(career);
    Object.entries(result.fuel).forEach(([id, fuel]) => {
      expect(args.plans[id].stops[0]).toBe(fuel);
    });
    if (inQ3) expect(args.plans[a].stops[0]).toBe(14);
  });

  it("a sprint weekend (2024): shootout, sprint with the pack's points, counted in the round", () => {
    const career = createCareer(context, { year: 2024, teamId: "ferrari", seed: "sprint" });
    // Run to the first sprint round.
    const round = career.world.races.findIndex((race) => race.sprint);
    expect(round).toBeGreaterThan(-1);
    career.round = round;
    expect(isSprintWeekend(career)).toBe(true);
    playPractice(career);
    const quali = createWeekendSession(career, "qualifying");
    runSessionToEnd(quali);
    commitQualifyingSession(career, sessionResult(quali));
    expect(career.weekend.stage).toBe("sprint");
    runShootout(career);
    const sprint = createSprintRace(career);
    expect(sprint.laps).toBeLessThan(currentRace(career).laps / 2);
    runToFinish(sprint);
    const done = completeSprint(career, sprint);
    expect(career.weekend.stage).toBe("strategy");
    const points = Object.values(done.driverPoints).reduce((sum, value) => sum + value, 0);
    expect(points).toBe(8 + 7 + 6 + 5 + 4 + 3 + 2 + 1);
    const race = createWeekendRace(career);
    runToFinish(race);
    const summary = completeRace(career, race);
    const winner = done.rows[0].driverId;
    expect(summary.rows.find((row) => row.driverId === winner)?.sprintPoints).toBe(8);
  });
});
