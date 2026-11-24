/**
 * HUD-3 of docs/manager/F1M24-GAMEPLAY.md (event-banners, driver-panel-units,
 * pit-widget-and-dialog; RF-SIM-08, RF-SIM-10, RF-SIM-12, RF-SIM-13, RF-CMD-01, RF-CMD-02,
 * RF-CMD-03, RF-3D-04, RNF-05, RNF-07, RNF-08, RNF-09):
 *   - banners one at a time, at the engine's time (a pass at its confirmedAt when SIM-4 sends it),
 *     laps to go from the leader's line crossings, DRS only in the eras that have it and from the
 *     lap the rule says (never lap 2, §1.6), stale ones after a skip never shown
 *   - the pit widget reads the engine's pit phase and freezes the total at the exit line
 *   - the pit dialog shows previewPit's net losses (SC/VSC only in the eras that have them), the
 *     exit position and the double-stack warning, and calls the stop
 *   - the session does not advance while the pit dialog is open (§3.3 HUD-3)
 *   - hud.json validates against its schema
 */

import React from "react";
import Ajv from "ajv";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import hudSchema from "../engine/packs/schema/hud.schema.json";
import HUD from "../data/balance/hud.json";
import { weekendRaceArgs } from "../engine/career";
import { rulesOf } from "../engine/race";
import { rulesFor } from "../engine/rules";
import { weekend } from "../engine/sim/simTestKit";
import { circuitFor } from "../engine/venue";
import { createRaceSession } from "../engine/worker/raceSession";
import { applyTick, mirrorOf } from "../engine/worker/raceClient";
import { ManagerContext } from "./context";
import { EventBanner, PitTimer } from "./Broadcast";
import { bannerDuration, bannerText, createBannerQueue, currentBanner, drsBanners, drsCalls, eventBanners, lapCallouts, offerBanners } from "./hudBanners";
import { createPitClock, stepPitClock } from "./pitTimer";
import PitDialog, { compoundRuleOf, safePreview } from "./PitDialog";
import LiveRace from "./LiveRace";

jest.mock("../../../helpers/sourceTictactoeImages", () => {
  const resolve = () => "logo.png";
  resolve.keys = () => [];
  return { sourceTictactoeImages: resolve };
});

describe("HUD-3 · hud.json", () => {
  it("validates against its schema (RNF-07)", () => {
    const ajv = new Ajv({ allErrors: true });
    const ok = ajv.validate(hudSchema, HUD);
    expect(ajv.errors).toBeNull();
    expect(ok).toBe(true);
  });

  it("banners are on, with the laps-to-go callouts of §2.12.1 and no banner the schema does not know", () => {
    expect(HUD.banners.kinds.length).toBeGreaterThan(0);
    expect(HUD.banners.lapsToGoCallouts).toEqual([15, 10, 3, 1]);
    HUD.banners.kinds.forEach((kind) => expect(bannerDuration(kind)).toBeGreaterThan(0));
    expect(HUD.driverPanel.tabs).toContain(HUD.driverPanel.defaultTab);
  });
});

describe("HUD-3 · event banners (event-banners)", () => {
  const isUser = (id) => id === "me";
  const positions = { a: 1, b: 2, c: 14, d: 15, me: 18 };

  it("a pass shows at its confirmedAt when the engine sends it, otherwise at its own time", () => {
    const [confirmed] = eventBanners({ events: [{ type: "pass", carId: "a", otherId: "b", lap: 4, at: 300, confirmedAt: 309.5 }], positions, isUser });
    expect(confirmed.at).toBe(309.5);
    const [plain] = eventBanners({ events: [{ type: "pass", carId: "a", otherId: "b", lap: 4, at: 300 }], positions, isUser });
    expect(plain.at).toBe(300);
  });

  it("scope: passes at the back only when one of your cars is in them; race control for everybody", () => {
    const events = [
      { type: "pass", carId: "d", otherId: "c", lap: 5, at: 10 },
      { type: "pass", carId: "me", otherId: "d", lap: 5, at: 11 },
      { type: "penalty", carId: "d", lap: 5, at: 12, offence: "collision", penalty: "time5" },
      { type: "lead", carId: "b", lap: 5, at: 13 },
    ];
    const banners = eventBanners({ events, positions, isUser });
    expect(banners.map((banner) => banner.kind)).toEqual(["pass", "penalty"]);
    expect(banners[0].own).toBe(true);
  });

  it("mistakes only of the kinds hud.json names", () => {
    const events = [
      { type: "mistake", carId: "a", kind: "spin", lap: 2, at: 5, loss: 3 },
      { type: "mistake", carId: "a", kind: "nothing-known", lap: 2, at: 6, loss: 1 },
    ];
    expect(eventBanners({ events, positions, isUser }).map((banner) => banner.detail.mistake)).toEqual(["spin"]);
  });

  it("laps to go at the leader's crossing that leaves N laps; 1 is the last lap", () => {
    const laps = 57;
    const ends = Array.from({ length: laps }, (_, index) => (index + 1) * 95);
    const calls = lapCallouts({ laps, ends });
    expect(calls.map((call) => [call.kind, call.left])).toEqual([
      ["lapsToGo", 15],
      ["lapsToGo", 10],
      ["lapsToGo", 3],
      ["lastLap", 1],
    ]);
    expect(calls[0].at).toBe(ends[laps - 15 - 1]);
    expect(calls[3].at).toBe(ends[laps - 2]);
    // A short race has no "15 to go".
    expect(lapCallouts({ laps: 12, ends }).map((call) => call.left)).toEqual([10, 3, 1]);
  });

  it("DRS (RF-SIM-08): none before 2011, from the rule's lap in a DRS era (never lap 2), off in the wet", () => {
    expect(drsCalls(rulesFor(2008), { laps: 58, wetness: [] })).toEqual([]);
    const rules = rulesFor(2012);
    expect(rules.drs.enabled).toBe(true);
    const dry = drsCalls(rules, { laps: 58, wetness: [], zones: 2 });
    expect(dry[0]).toEqual({ lap: rules.drs.fromLap, open: true });
    expect(rules.drs.fromLap).toBeGreaterThan(2);
    const wetness = Array.from({ length: 59 }, (_, lap) => (lap >= 20 && lap < 30 ? 0.9 : 0));
    const wet = drsCalls(rules, { laps: 58, wetness, zones: 2 });
    expect(wet).toEqual([
      { lap: rules.drs.fromLap, open: true },
      { lap: 20, open: false },
      { lap: 30, open: true },
    ]);
    // No zone, no DRS.
    expect(drsCalls(rules, { laps: 58, wetness: [], zones: 0 })).toEqual([]);
    // The banner is at the leader's crossing that starts the lap.
    const ends = Array.from({ length: 58 }, (_, index) => (index + 1) * 90);
    expect(drsBanners(dry, { ends })[0].at).toBe(ends[rules.drs.fromLap - 2]);
    // 2026: active aero instead of DRS (SRS §6.2) - no DRS banner.
    const rules2026 = rulesFor(2026);
    expect(rules2026.drs.enabled).toBe(false);
    expect(drsCalls(rules2026, { laps: 58, wetness: [], zones: 2 })).toEqual([]);
  });

  it("the queue: one banner at a time in race order, each for its real seconds; stale ones never show", () => {
    const queue = createBannerQueue();
    const items = [
      { key: "b", kind: "fastest", at: 20, own: false, detail: {} },
      { key: "a", kind: "pass", at: 10, own: false, detail: {} },
      { key: "late", kind: "pass", at: 500, own: false, detail: {} },
    ];
    offerBanners(queue, items, 30);
    expect(currentBanner(queue, 0, 30).key).toBe("a");
    expect(currentBanner(queue, bannerDuration("pass") - 0.01, 30).key).toBe("a");
    expect(currentBanner(queue, bannerDuration("pass") + 0.01, 30).key).toBe("b");
    // Not offered twice.
    offerBanners(queue, items, 30);
    expect(queue.waiting).toHaveLength(0);
    // A skip far ahead: what is older than staleSimSec is dropped.
    const skip = createBannerQueue();
    offerBanners(skip, [{ key: "old", kind: "pass", at: 10, own: false, detail: {} }], 10 + HUD.banners.staleSimSec + 1);
    expect(currentBanner(skip, 0, 10 + HUD.banners.staleSimSec + 1)).toBeNull();
  });

  it("the queue keeps at most queueMax waiting, dropping the lowest priority first", () => {
    const queue = createBannerQueue();
    const many = Array.from({ length: HUD.banners.queueMax + 2 }, (_, index) => ({ key: `p${index}`, kind: "pass", at: index, own: false, detail: {} }));
    offerBanners(queue, [...many, { key: "lap", kind: "lastLap", at: 0.5, left: 1, own: false, detail: {} }], 20);
    expect(queue.waiting).toHaveLength(HUD.banners.queueMax);
    expect(queue.waiting.some((item) => item.key === "lap")).toBe(true);
  });

  it("EventBanner says it in words (RNF-09) and offers the replay only when asked to", () => {
    const banner = { key: "x", kind: "fastest", carId: "a", own: false, detail: { time: 92.345 } };
    const { rerender } = render(<EventBanner banner={banner} names={{ a: "Alpha Driver" }} />);
    const box = screen.getByRole("status");
    expect(box).toHaveTextContent(bannerText(banner, { a: "Alpha Driver" }).title);
    expect(box).toHaveTextContent("Alpha Driver");
    expect(within(box).queryByRole("button")).toBeNull();
    const onReplay = jest.fn();
    rerender(<EventBanner banner={banner} names={{ a: "Alpha Driver" }} onReplay={onReplay} />);
    fireEvent.click(within(screen.getByRole("status")).getByRole("button"));
    expect(onReplay).toHaveBeenCalledWith(banner);
  });
});

describe("HUD-3 · pit widget (PitTimer)", () => {
  it("lane time from the entry line, stationary while the engine says STATIONARY, total frozen at the exit", () => {
    const memo = createPitClock();
    expect(stepPitClock(memo, { inPit: false }, 100, 0)).toBeNull();
    expect(stepPitClock(memo, { inPit: true, pitPhase: "LIMITER" }, 100, 0)).toMatchObject({ state: "lane", laneSec: 0, stationarySec: null });
    expect(stepPitClock(memo, { inPit: true, pitPhase: "STATIONARY", pitStage: "wheels" }, 108, 1)).toMatchObject({ state: "stationary", laneSec: 8, stationarySec: 0, stage: "wheels" });
    const standing = stepPitClock(memo, { inPit: true, pitPhase: "STATIONARY" }, 110.4, 2);
    expect(standing.state).toBe("stationary");
    expect(standing.stationarySec).toBeCloseTo(2.4, 6);
    expect(stepPitClock(memo, { inPit: true, pitPhase: "RELEASE" }, 110.6, 3)).toMatchObject({ state: "leaving" });
    const leaving = stepPitClock(memo, { inPit: true, pitPhase: "EXIT_ROAD" }, 118, 4);
    expect(leaving.stationarySec).toBeCloseTo(2.6, 6);
    const done = stepPitClock(memo, { inPit: false }, 122, 5);
    expect(done).toMatchObject({ state: "done", totalSec: 22 });
    // Frozen: later race time does not move it.
    expect(stepPitClock(memo, { inPit: false }, 130, 5 + HUD.pitTimer.holdRealSec - 0.1).totalSec).toBe(22);
    expect(stepPitClock(memo, { inPit: false }, 131, 5 + HUD.pitTimer.holdRealSec + 0.1)).toBeNull();
    // The next stop starts afresh.
    expect(stepPitClock(memo, { inPit: true, pitPhase: "LIMITER" }, 3000, 50)).toMatchObject({ state: "lane", laneSec: 0, stationarySec: null });
  });

  it("a quick replay without phases still shows the lane time and the total", () => {
    const memo = createPitClock();
    expect(stepPitClock(memo, { inPit: true }, 10, 0)).toMatchObject({ state: "lane" });
    expect(stepPitClock(memo, { inPit: false }, 33, 0)).toMatchObject({ state: "done", totalSec: 23, stationarySec: null });
  });

  it("the widget names each state in words and marks the live stationary time", () => {
    render(<PitTimer entries={[{ id: "a", code: "ALP", position: 7, clock: { state: "stationary", laneSec: 9.1, stationarySec: 1.2, totalSec: null } }]} />);
    const group = screen.getByRole("group");
    expect(group).toHaveTextContent("P7 · ALP");
    expect(group).toHaveTextContent(/stationary/i);
    expect(within(group).getByTitle(/stationary time/i)).toHaveClass("is-live");
  });
});

describe("HUD-3 · pit dialog (previewPit)", () => {
  const { career } = weekend({ seed: "hud3" });
  const args = weekendRaceArgs(career);
  const session = createRaceSession();
  const created = session.handle({ type: "create", args });
  const mirror = mirrorOf(created);
  const circuit = circuitFor(mirror.race, mirror.year);
  for (let k = 0; k < 120; k += 1) applyTick(mirror, session.handle({ type: "step", seconds: 4 }));
  const rules = rulesOf(mirror.era, mirror.year);
  const me = mirror.cars.find((car) => car.isUser && car.status === "running");

  it("previewPit reads the view's mirror of a step race: a net green loss and an exit position", () => {
    const preview = safePreview(mirror, me.id, { circuit, tyres: true });
    expect(preview.measures).toBe("net");
    expect(preview.lossGreen).toBeGreaterThan(15);
    expect(preview.lossGreen).toBeLessThan(40);
    expect(preview.exitPos).toBeGreaterThanOrEqual(1);
  });

  it("shows the losses (SC and VSC rows only in eras with them), the exit position, and calls the stop", () => {
    const onConfirm = jest.fn();
    const onClose = jest.fn();
    render(<PitDialog open onClose={onClose} car={me} state={mirror} rules={rules} commands={created.commands} circuit={circuit} position={me.position} tyreLife={0.6} onConfirm={onConfirm} onCancelCall={() => {}} />);
    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByTestId("pit-lossGreen")).toHaveTextContent(/\d+\.\d s/);
    expect(within(dialog).queryAllByTestId("pit-lossSc")).toHaveLength(rules.raceControl?.safetyCar ? 1 : 0);
    expect(within(dialog).queryAllByTestId("pit-lossVsc")).toHaveLength(rules.raceControl?.vsc ? 1 : 0);
    expect(within(dialog).getByTestId("pit-exitPos")).toHaveTextContent(/^P\d+/);
    const tyre = within(dialog).getAllByRole("radio")[0];
    fireEvent.click(tyre);
    fireEvent.click(within(dialog).getByRole("button", { name: /call the stop/i }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onConfirm.mock.calls[0][1]).toMatchObject({ replace: true });
  });

  it("warns of a double stack when the team-mate stops on the same lap", () => {
    const mate = mirror.cars.find((car) => car.id !== me.id && car.teamId === me.teamId);
    const staged = { ...mirror, cars: mirror.cars.map((car) => (car.id === mate.id ? { ...car, status: "running", pitRequest: { compound: "hard", lap: mirror.lap + 1 } } : car)) };
    render(<PitDialog open onClose={() => {}} car={me} state={staged} rules={rules} commands={created.commands} circuit={circuit} onConfirm={() => {}} onCancelCall={() => {}} />);
    expect(screen.getByRole("alert")).toHaveTextContent(/double stack/i);
  });

  it("the two-compound rule's count, only in eras that have it", () => {
    expect(compoundRuleOf({ tyres: { mandatoryDryCompounds: 2 } }, { compound: "medium", compoundsUsed: ["medium"] }, "hard")).toEqual({ mandatory: 2, before: 1, after: 2 });
    expect(compoundRuleOf({ tyres: { mandatoryDryCompounds: 2 } }, { compound: "medium", compoundsUsed: ["medium"] }, "inter")).toEqual({ mandatory: 2, before: 1, after: 1 });
    expect(compoundRuleOf({ tyres: { mandatoryDryCompounds: 0 } }, { compound: "medium", compoundsUsed: [] }, "hard").mandatory).toBe(0);
  });
});

describe("HUD-3 · the session does not advance with the pit dialog open (§3.3)", () => {
  it("the race clock stands still while the dialog is open and runs again once it is closed", () => {
    jest.useFakeTimers();
    const { career } = weekend({ seed: "hud3-hold" });
    const args = weekendRaceArgs(career);
    render(
      <ManagerContext.Provider value={{ career }}>
        <LiveRace args={args} onFinished={() => {}} title="Race" />
      </ManagerContext.Provider>,
    );
    const clock = () => within(screen.getByRole("status", { name: /track status/i })).getByText(/^\d\d:\d\d:\d\d$/).textContent;
    const advance = (ms) => act(() => {
      jest.advanceTimersByTime(ms);
    });
    advance(8000);
    const running = clock();
    expect(running).not.toBe("15:00:00");
    fireEvent.click(screen.getAllByRole("button", { name: /pit options/i })[0]);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    advance(200);
    const held = clock();
    advance(10000);
    expect(clock()).toBe(held);
    // The playback bar says why it is paused.
    expect(screen.getByTitle(/paused while the dialog is open/i)).toBeInTheDocument();
    fireEvent.click(within(screen.getByRole("dialog")).getAllByRole("button", { name: /^close$/i })[0]);
    expect(screen.queryByRole("dialog")).toBeNull();
    advance(3000);
    expect(clock()).not.toBe(held);
    jest.useRealTimers();
  });
});
