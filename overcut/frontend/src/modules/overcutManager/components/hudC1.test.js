/**
 * HUD-C1 of docs/manager/F1M24-CHINA.md (wave 1): continuity and the HUD by zones (GS-01, VIEW-01,
 * AUD-C1 `speed` in the frame; RF-3D-04, RNF-09, RNF-07, RF-WKD-07, RF-CMD-04, RNF-05):
 *   - hud.json and live-view.json pass their schemas, with the contracts wave 1 fixes for the later waves
 *     (layout, tags.policy, start.fadeSec, lapCountdown, continuity, fastForward, views.camerasByEra; §3.2)
 *   - VIEW-01 acceptance, unit twin of the elementsFromPoint check: on a 32×18 grid the picture is ≥ 65 %
 *     free with everything folded and ≥ 50 % with one driver card open, at 1280×720 and 1920×1080
 *   - on a big window the race is drawn in zones in the immersive live mode (over the site header and the
 *     stepper), your second card folded to one line, and the exit key brings it back into the page
 *   - the sound gets the playback speed in every frame (LiveRace and SessionLive), and the race is the same
 *     with the zones as without (the view only reads, RNF-05)
 *   - the GS-01 continuity itself is in raceClock.test.js (a step race at 60 Hz)
 */

import React from "react";
import fs from "fs";
import path from "path";
import Ajv from "ajv";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import hudSchema from "../engine/packs/schema/hud.schema.json";
import liveViewSchema from "../engine/packs/schema/live-view.schema.json";
import HUD from "../data/balance/hud.json";
import LIVE_VIEW from "../data/balance/live-view.json";
import { fallbackBootstrap } from "../../overcutTrayectoria/data/fallbackBootstrap";
import { reference } from "../data/reference";
import { createContext, createCareer, runPractice, runQualifyingSession, weekendRaceArgs } from "../engine/career";
import { createRace } from "../engine/race";
import { ManagerContext } from "./context";
import LiveRace from "./LiveRace";
import { camerasOf } from "./playback";
import { cardOpenOf, freeShareOf, hudZonesOf, rectsOf, towerRowsShown, zoneStyleOf } from "./hudLayout";

jest.mock("../../../helpers/sourceTictactoeImages", () => {
  const resolve = () => "logo.png";
  resolve.keys = () => [];
  return { sourceTictactoeImages: resolve };
});

const source = (name) => fs.readFileSync(path.join(__dirname, name), "utf8");

describe("HUD-C1 · data and the wave-1 contracts (RNF-07, §3.2)", () => {
  const ajv = new Ajv({ allErrors: true, strict: false });
  it("hud.json and live-view.json pass their schemas", () => {
    expect(ajv.validate(hudSchema, HUD)).toBe(true);
    expect(ajv.errors).toBeNull();
    expect(ajv.validate(liveViewSchema, LIVE_VIEW)).toBe(true);
    expect(ajv.errors).toBeNull();
  });

  it("the keys the later waves read are there, with what has no value yet marked pending", () => {
    expect(HUD.layout.status).toBe("behaviour");
    expect(HUD.tags.policies).toContain(HUD.tags.policy);
    expect(HUD.tags.status).toBe("pending");
    expect(HUD.start).toHaveProperty("fadeSec", null);
    expect(HUD.lapCountdown).toMatchObject({ status: "pending", enabled: false });
    expect(HUD.lapCountdown.laps).toContain("last");
    expect(LIVE_VIEW.continuity).toMatchObject({ enabled: true, k: 1.2, marginM: 2 });
    // The 3D at ×8 is ours: the automatic switch to the map stays off (§1.5 «Avance rápido»).
    expect(LIVE_VIEW.fastForward.enabled).toBe(false);
    expect(LIVE_VIEW.views.camerasByEra).toMatchObject({ status: "pending", list: [] });
  });

  it("the ring per era replaces the 3D cameras in its years, and only those the catalogue has then", () => {
    const config = { ...LIVE_VIEW, views: { ...LIVE_VIEW.views, camerasByEra: { status: "pending", list: [{ from: 2010, to: 2017, with3D: ["tcam", "chase", "halo"], source: "test", status: "pending" }] } } };
    expect(camerasOf({ has3D: true, year: 2013, config })).toEqual(["tcam", "chase", "halo"]);
    expect(camerasOf({ has3D: true, year: 2020, config })).toEqual(LIVE_VIEW.views.cameras.with3D);
    const catalogue = [{ id: "tcam" }, { id: "chase" }, { id: "halo", eras: [{ from: 2018 }] }];
    expect(camerasOf({ has3D: true, year: 2013, config, catalogue })).toEqual(["tcam", "chase"]);
    expect(camerasOf({ has3D: false, year: 2013, config })).toEqual(LIVE_VIEW.views.cameras.without3D);
  });
});

describe("VIEW-01 · the zones leave the picture free (elementsFromPoint on a 32×18 grid)", () => {
  const rows = Array.from({ length: 22 }, (_, index) => ({ id: `c${index}`, flags: { user: index === 6 || index === 14 } }));
  const folded = { cards: [{ open: false }, { open: false }], mid: true, towerRows: towerRowsShown({ rows, open: false }), feedOpen: false };
  const oneCard = { ...folded, cards: [{ open: true }, { open: false }] };

  HUD.layout.target.viewports.forEach(([w, h]) => {
    it(`${w}×${h}: ≥ ${HUD.layout.target.freeFolded * 100} % free folded and ≥ ${HUD.layout.target.freeOneCard * 100} % with one card`, () => {
      const zonesFolded = hudZonesOf({ w, h }, folded);
      const zonesOne = hudZonesOf({ w, h }, oneCard);
      expect(zonesFolded.zoned).toBe(true);
      expect(freeShareOf(rectsOf(zonesFolded), { w, h })).toBeGreaterThanOrEqual(HUD.layout.target.freeFolded);
      expect(freeShareOf(rectsOf(zonesOne), { w, h })).toBeGreaterThanOrEqual(HUD.layout.target.freeOneCard);
      // With the tower and the radio open too, the picture still shows through.
      const all = hudZonesOf({ w, h }, { ...oneCard, towerRows: rows.length, feedOpen: true });
      expect(freeShareOf(rectsOf(all), { w, h })).toBeGreaterThanOrEqual(HUD.layout.target.freeOneCard);
    });

    it(`${w}×${h}: no two blocks overlap and every block is inside the window`, () => {
      const rects = rectsOf(hudZonesOf({ w, h }, { ...oneCard, towerRows: rows.length, feedOpen: true }));
      rects.forEach((rect) => {
        expect(rect.x).toBeGreaterThanOrEqual(0);
        expect(rect.y).toBeGreaterThanOrEqual(0);
        expect(rect.x + rect.w).toBeLessThanOrEqual(w + 1e-6);
        expect(rect.y + rect.h).toBeLessThanOrEqual(h + 1e-6);
      });
      for (let i = 0; i < rects.length; i += 1) {
        for (let j = i + 1; j < rects.length; j += 1) {
          const a = rects[i];
          const b = rects[j];
          const overlap = a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
          expect(overlap).toBe(false);
        }
      }
    });
  });

  it("each block keeps to its maximum share of the window (hud.json layout.blocks)", () => {
    const [w, h] = [1280, 720];
    const { rects } = hudZonesOf({ w, h }, { ...oneCard, towerRows: rows.length, feedOpen: true });
    const B = HUD.layout.blocks;
    expect(rects.tower.h).toBeLessThanOrEqual((B.tower.maxHeightPct / 100) * h + 1e-6);
    expect(rects.status.w).toBeLessThanOrEqual((B.status.maxWidthPct / 100) * w + 1e-6);
    expect(rects.play.w).toBeLessThanOrEqual((B.play.maxWidthPct / 100) * w + 1e-6);
    expect(rects.play.h).toBe(B.play.heightPx);
    rects.cards.forEach((card) => expect(card.h).toBeLessThanOrEqual((B.cards.openMaxHeightPct / 100) * h + 1e-6));
    expect(rects.cards[1].h).toBe(B.cards.foldedHeightPx);
  });

  it("below the minimum window there are no zones (the stacked layout of always)", () => {
    expect(hudZonesOf({ w: 1024, h: 768 }, folded).zoned).toBe(false);
    expect(zoneStyleOf({ zoned: false })).toEqual({});
    expect(zoneStyleOf(hudZonesOf({ w: 1280, h: 720 }, folded))).toHaveProperty("--z-card1-h", `${HUD.layout.blocks.cards.foldedHeightPx}px`);
  });

  it("which card is open: the viewer's fold, else the car you follow if it is yours; all open without zones", () => {
    const userIds = ["a", "b"];
    expect(cardOpenOf({ id: "b", zoned: false, userIds })).toBe(true);
    expect(cardOpenOf({ id: "a", zoned: true, focusId: "a", userIds })).toBe(true);
    expect(cardOpenOf({ id: "b", zoned: true, focusId: "a", userIds })).toBe(false);
    expect(cardOpenOf({ id: "b", zoned: true, focusId: "b", userIds })).toBe(true);
    expect(cardOpenOf({ id: "a", zoned: true, focusId: "rival", userIds })).toBe(true);
    expect(cardOpenOf({ id: "b", zoned: true, focusId: "a", userIds, folds: { b: false } })).toBe(true);
    expect(cardOpenOf({ id: "a", zoned: true, focusId: "a", userIds, folds: { a: true } })).toBe(false);
    // Sessions: in the garage the card is open (the run is prepared there), unless the viewer folded it.
    expect(cardOpenOf({ id: "b", zoned: true, focusId: "a", userIds, inGarage: true })).toBe(HUD.layout.cards.openInGarage);
    expect(cardOpenOf({ id: "b", zoned: true, focusId: "a", userIds, inGarage: true, folds: { b: true } })).toBe(false);
    expect(towerRowsShown({ rows, open: false })).toBe(HUD.layout.blocks.tower.foldedRows + 1);
    expect(towerRowsShown({ rows, open: true })).toBe(rows.length);
  });
});

describe("VIEW-01 · the race drawn in zones on a big window", () => {
  const context = createContext(fallbackBootstrap, reference);
  const career = createCareer(context, { year: 2024, teamId: "ferrari", seed: "hudc1" });
  runPractice(career, {});
  runQualifyingSession(career, {});
  const args = weekendRaceArgs(career);
  const size = { w: window.innerWidth, h: window.innerHeight };

  const setWindow = (w, h) => {
    Object.defineProperty(window, "innerWidth", { configurable: true, writable: true, value: w });
    Object.defineProperty(window, "innerHeight", { configurable: true, writable: true, value: h });
  };

  afterEach(() => {
    setWindow(size.w, size.h);
    jest.useRealTimers();
  });

  it("immersive, in zones, with your second card folded; Esc brings it back into the page", () => {
    setWindow(1280, 720);
    jest.useFakeTimers();
    const state = createRace({ ...args, seed: `${args.seed}-zones` });
    const users = state.cars.filter((car) => car.isUser);
    const view = render(
      <ManagerContext.Provider value={{ career }}>
        <LiveRace state={state} onFinished={() => {}} title="Race" />
      </ManagerContext.Provider>,
    );
    act(() => {
      jest.advanceTimersByTime(120);
    });
    const live = screen.getByTestId("live-race");
    expect(live).toHaveClass("is-zoned");
    expect(live).toHaveClass("is-immersive");
    expect(within(screen.getByTestId("immersive-layer")).getByTestId("live-race")).toBe(live);
    expect(live.style.getPropertyValue("--z-tower-w")).toBe(`${HUD.layout.blocks.tower.widthPx}px`);
    expect(live.dataset.clockMode).toBe("live");
    const first = screen.getByRole("region", { name: users[0].name });
    const second = screen.getByRole("region", { name: users[1].name });
    expect(first).not.toHaveClass("is-collapsed");
    expect(second).toHaveClass("is-collapsed");
    expect(first.dataset.zone).toBe("card0");
    // Unfold the second card (words on the button, RNF-09).
    fireEvent.click(screen.getByRole("button", { name: new RegExp(`unfold ${users[1].name}`, "i") }));
    expect(screen.getByRole("region", { name: users[1].name })).not.toHaveClass("is-collapsed");
    // The radio opens on demand.
    fireEvent.click(screen.getByRole("button", { name: /unfold the radio/i }));
    expect(screen.getByRole("complementary", { name: /track/i })).not.toHaveClass("is-feed-closed");
    // Esc leaves the immersive mode: the same view, back in the page.
    fireEvent.keyDown(window, { key: HUD.layout.immersive.exitKey });
    expect(screen.getByTestId("live-race")).not.toHaveClass("is-immersive");
    expect(screen.queryByTestId("immersive-layer")).toBeNull();
    // And the button goes back in.
    fireEvent.click(screen.getByRole("button", { name: /live/i, pressed: false }));
    expect(screen.getByTestId("live-race")).toHaveClass("is-immersive");
    expect(screen.getByTestId("immersive-layer")).toBeInTheDocument();
    view.unmount();
    expect(screen.queryByTestId("immersive-layer")).toBeNull();
  });

  it("on a small window nothing changes: no zones, every card open, inline in the page", () => {
    setWindow(1024, 768);
    jest.useFakeTimers();
    const state = createRace({ ...args, seed: `${args.seed}-small` });
    const users = state.cars.filter((car) => car.isUser);
    const view = render(
      <ManagerContext.Provider value={{ career }}>
        <LiveRace state={state} onFinished={() => {}} title="Race" />
      </ManagerContext.Provider>,
    );
    act(() => {
      jest.advanceTimersByTime(120);
    });
    const live = screen.getByTestId("live-race");
    expect(live).not.toHaveClass("is-zoned");
    expect(screen.queryByTestId("immersive-layer")).toBeNull();
    users.forEach((car) => expect(screen.getByRole("region", { name: car.name })).not.toHaveClass("is-collapsed"));
    expect(screen.queryByRole("button", { name: /unfold/i })).toBeNull();
    view.unmount();
  });
});

describe("AUD-C1 · the sound hears the playback speed (RF-CMD-04)", () => {
  it("LiveRace and SessionLive pass `speed` in every audio frame", () => {
    [source("LiveRace.js"), source("SessionLive.js")].forEach((text) => {
      const frame = text.slice(text.indexOf("audio.frame({"), text.indexOf("audio.frame({") + 400);
      expect(frame).toMatch(/speed:/);
    });
  });
});
