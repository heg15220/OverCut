/**
 * HUD-C3 of docs/manager/F1M24-CHINA.md (wave 5): VIEW-10 and GS-12, the HUD parts; GS-14 (the fifth rubber
 * band on the HUD); the HUD-lane hooks of AUD-C-3/4, CAM-C3 and LOOK-C3/C4. RF-3D-04, RF-SIM-08, RF-SIM-10,
 * RF-SIM-11, RNF-05, RNF-07, RNF-08, RNF-09, SRS §6.
 *   - hud.json passes its schema with the new keys (start.hiddenPhases, raceControl, conditions, banner keep/stale)
 *   - VIEW-10: the HUD's opacity is < 0.1 until +0.9 s after lights out (from the engine's start), 0 with the
 *     lights, 1 once faded in; live, the race view hides it with the lights and brings it back
 *   - GS-12: race control's control events become banners in the engine's order, none dropped by the queue;
 *     malformed or absent events say nothing; DRS only in an era with DRS (not 2008, not 2026); the header says
 *     what still holds; the engine's DRS calls silence the view's own rule
 *   - GS-14: the rubber's five bands with word and tone, "veryHigh" included, the engine's own band first
 *   - the sound gets snapshot.weather, each car's compound and the replay phase; the director gets sc and year
 */

import React from "react";
import Ajv from "ajv";
import { act, render, screen } from "@testing-library/react";
import hudSchema from "../engine/packs/schema/hud.schema.json";
import HUD from "../data/balance/hud.json";
import WEATHER from "../data/balance/race-weather.json";
import { weekendRaceArgs } from "../engine/career";
import { rulesFor } from "../engine/rules";
import { weekend } from "../engine/sim/simTestKit";
import { ManagerContext } from "./context";
import { StatusStrip } from "./Broadcast";
import { bannerText, createBannerQueue, currentBanner, drsBanners, offerBanners } from "./hudBanners";
import { controlBanners, controlEventsOf, engineHasDrsControl, raceControlLabel, raceControlState } from "./hudRaceControl";
import { frameWeatherOf, raceConditionsOf, rubberLevel } from "./hudConditions";
import { hudOpacityOf } from "./hudStart";
import { tvShotOf } from "./tvDirector";
import LiveRace from "./LiveRace";

jest.mock("../../../helpers/sourceTictactoeImages", () => {
  const resolve = () => "logo.png";
  resolve.keys = () => [];
  return { sourceTictactoeImages: resolve };
});

const mockFrames = [];
jest.mock("../three/audio", () => {
  const actual = jest.requireActual("../three/audio");
  return {
    ...actual,
    useRaceAudio: () => ({
      enabled: true,
      supported: false,
      settings: { muted: false },
      update: () => {},
      enable: () => {},
      cue: () => false,
      cameraBus: { current: null },
      recordedAvailable: () => false,
      frame: (frame) => mockFrames.push(frame),
    }),
  };
});

describe("HUD-C3 · data (RNF-07)", () => {
  it("hud.json passes its schema with the keys of HUD-C3", () => {
    const ajv = new Ajv({ allErrors: true, strict: false });
    expect(ajv.validate(hudSchema, HUD)).toBe(true);
    expect(ajv.errors).toBeNull();
    expect(HUD.start.fadeSec).toBeGreaterThan(0);
    expect(HUD.banners.kinds).toContain("raceControl");
    expect(HUD.raceControl.wetKinds).toEqual(["climaticChange", "wetTrack", "slippery", "lowGrip"]);
  });
});

describe("HUD-C3 · VIEW-10: the HUD fades in after lights out", () => {
  it("opacity < 0.1 until +0.9 s after lights out, 0 with the lights, 1 once faded in, never down again", () => {
    expect(hudOpacityOf({ phase: "lights", sinceOut: 0 })).toBe(0);
    expect(hudOpacityOf({ phase: "grid", sinceOut: 0 })).toBe(0);
    expect(hudOpacityOf({ phase: "formation", sinceOut: 0 })).toBe(1);
    for (let s = 0; s <= 0.9 + 1e-9; s += 0.05) expect(hudOpacityOf({ phase: "out", sinceOut: s })).toBeLessThan(0.1);
    const end = (HUD.start.hudDelaySec ?? 0) + HUD.start.fadeSec;
    expect(hudOpacityOf({ phase: "out", sinceOut: end })).toBe(1);
    expect(hudOpacityOf({ phase: "out", sinceOut: end + 60 })).toBe(1);
    let last = 0;
    for (let s = 0; s <= end + 1; s += 0.01) {
      const value = hudOpacityOf({ phase: "out", sinceOut: s });
      expect(value).toBeGreaterThanOrEqual(last);
      last = value;
    }
  });

  it("without a fade (fadeSec null) the HUD comes back at once at hudDelaySec, as before", () => {
    const start = { ...HUD.start, fadeSec: null };
    expect(hudOpacityOf({ phase: "out", sinceOut: start.hudDelaySec - 0.01 }, start)).toBe(0);
    expect(hudOpacityOf({ phase: "out", sinceOut: start.hudDelaySec }, start)).toBe(1);
  });
});

describe("HUD-C3 · GS-12: race control from the engine", () => {
  // A wet chain as SIM-C4 emits it: all in one worker chunk (same `at`), each at its own `t`.
  const chain = [
    { type: "control", kind: "climaticChange", lap: 12, t: 1000.1, at: 1004 },
    { type: "control", kind: "wetTrack", lap: 12, t: 1000.2, at: 1004 },
    { type: "control", kind: "slippery", sector: 1, lap: 12, t: 1000.3, at: 1004 },
    { type: "control", kind: "slippery", sector: 2, lap: 12, t: 1000.4, at: 1004 },
    { type: "control", kind: "lowGrip", lap: 12, t: 1000.5, at: 1004 },
    { type: "control", kind: "drsDisabled", reason: "wet", lap: 13, t: 1001, at: 1004 },
  ];
  const wetOrder = ["climaticChange", "wetTrack", "slippery", "slippery", "lowGrip"];

  it("banners in the engine's order, the whole chain (none dropped by queueMax), DRS with its reason", () => {
    const items = controlBanners({ events: chain, rules: rulesFor(2013) });
    expect(items.map((item) => item.kind)).toEqual(["raceControl", "raceControl", "raceControl", "raceControl", "raceControl", "drs"]);
    const queue = createBannerQueue();
    // The chain arrives with other banners at the same time; more than queueMax wait.
    offerBanners(queue, [{ key: "pass:x", kind: "pass", at: 1000.15, own: false, detail: {} }, ...items], 1004);
    const shown = [];
    for (let real = 0; real < 200; real += 0.5) {
      const banner = currentBanner(queue, real, 1004);
      if (banner && shown[shown.length - 1] !== banner) shown.push(banner);
    }
    const control = shown.filter((banner) => banner.kind === "raceControl").map((banner) => banner.detail.control);
    expect(control).toEqual(wetOrder);
    expect(shown[shown.length - 1].kind).toBe("drs");
    expect(bannerText(shown[shown.length - 1]).line).toMatch(/DRS disabled · wet track/i);
    expect(bannerText(shown.find((banner) => banner.detail.sector === 2)).line).toMatch(/slippery in sector 2/i);
  });

  it("absent or malformed control events say nothing", () => {
    const junk = [{ type: "control" }, { type: "control", kind: "aliens", t: 3 }, { type: "control", kind: "wetTrack" }, { type: "pass", kind: "wetTrack", t: 2 }, null];
    expect(controlEventsOf(junk)).toEqual([]);
    expect(controlBanners({ events: junk, rules: rulesFor(2013) })).toEqual([]);
    expect(controlBanners({ events: [], rules: rulesFor(2013) })).toEqual([]);
    expect(raceControlState(junk, Infinity, { rules: rulesFor(2013) })).toBeNull();
    expect(raceControlLabel(null)).toBeNull();
  });

  it("no DRS message outside the DRS eras (2008, 2026), the wet chain still there", () => {
    [2008, 2026].forEach((year) => {
      const kinds = controlBanners({ events: chain, rules: rulesFor(year) }).map((item) => item.kind);
      expect(kinds).not.toContain("drs");
      expect(kinds.filter((kind) => kind === "raceControl")).toHaveLength(5);
      expect(raceControlLabel(raceControlState(chain, Infinity, { rules: rulesFor(year) }))).not.toMatch(/DRS/);
    });
  });

  it("the header says what still holds, in order, until the engine opens DRS again", () => {
    const rules = rulesFor(2013);
    expect(raceControlState(chain, 1000.15, { rules })).toBeNull();
    expect(raceControlLabel(raceControlState(chain, 1000.25, { rules }))).toBe("Wet track");
    const all = raceControlLabel(raceControlState(chain, Infinity, { rules }));
    expect(all).toBe("Wet track · slippery in sectors 1, 2 · low grip · DRS disabled (wet track)");
    const dry = [...chain, { type: "control", kind: "drsEnabled", lap: 30, t: 2500, at: 2504 }];
    expect(raceControlState(dry, Infinity, { rules })).toBeNull();
  });

  it("once the engine announces DRS the view's own rule is quiet, and the same call never shows twice", () => {
    const enabled = [{ type: "control", kind: "drsEnabled", lap: 3, t: 200, at: 204 }];
    expect(engineHasDrsControl(enabled)).toBe(true);
    expect(engineHasDrsControl([{ type: "pass" }])).toBe(false);
    const engine = controlBanners({ events: enabled, rules: rulesFor(2013) });
    const view = drsBanners([{ lap: 3, open: true }], { ends: [100, 199] });
    expect(engine[0].key).toBe(view[0].key);
  });

  it("the strip carries race control's words", () => {
    render(<StatusStrip flag={{ kind: "green", label: "Green flag" }} clock="16:01:00" airTemp={18} rainChance={80} change="" trackTemp={24} wetness={0.4} waterMm={0.5} rubber={0.5} raceControl="Wet track · low grip" />);
    expect(screen.getByTestId("race-control")).toHaveTextContent(/race control.*wet track · low grip/i);
  });
});

describe("HUD-C3 · GS-14: five rubber bands with word and tone (RNF-09)", () => {
  it("veryHigh is a band of its own, with its words; the engine's band comes first", () => {
    const top = rubberLevel(0.95);
    expect(top).toMatchObject({ id: "veryHigh", label: "Very high", tone: "high" });
    expect(rubberLevel(0.1, "veryHigh").id).toBe("veryHigh");
    expect(rubberLevel(null, "veryHigh").id).toBe("veryHigh");
    expect(rubberLevel(0.5, "nonsense").id).toBe("normal");
    expect(WEATHER.rubber.levels.bands.map((band) => band.id)).toEqual(["veryLow", "low", "normal", "high", "veryHigh"]);
    expect(raceConditionsOf({ weather: { wetness: [0] } }, 0, { rubber: 0.95, rubberLevel: "veryHigh" }).rubberLevel).toBe("veryHigh");
  });

  it("the strip shows the band's word with its tone, and a rhombus on the low ones", () => {
    const { rerender } = render(<StatusStrip flag={{ kind: "green", label: "Green flag" }} clock="15:00:00" airTemp={20} rainChance={0} change="" trackTemp={30} rubber={0.95} rubberBand="veryHigh" />);
    const cell = () => screen.getByTestId("rubber-level");
    expect(cell()).toHaveTextContent("Very high");
    expect(cell().getAttribute("data-level")).toBe("veryHigh");
    expect(cell().getAttribute("data-tone")).toBe("high");
    rerender(<StatusStrip flag={{ kind: "green", label: "Green flag" }} clock="15:00:00" airTemp={20} rainChance={0} change="" trackTemp={30} rubber={0.05} />);
    expect(cell()).toHaveTextContent("◆Very low");
    expect(cell().getAttribute("data-tone")).toBe("low");
  });
});

describe("HUD-C3 · hooks: the sound and the director", () => {
  afterEach(() => jest.useRealTimers());

  it("snapshot.weather in the §1.5 shape from the worker's weatherNow, renamed and nothing computed", () => {
    const now = { state: "lightRain", rainMmPerHour: 2.5, waterMm: 0.4, offLineMm: 0.7, sectorsMm: [0.3, 0.4, 0.5], wetness: 0.4 };
    expect(frameWeatherOf(now)).toEqual({ state: "lightRain", rainRate: 2.5, waterMm: { line: 0.4, off: 0.7, sectors: [0.3, 0.4, 0.5] } });
    const shaped = { state: "dry", rainRate: 0, waterMm: { line: 0, off: 0, sectors: [] } };
    expect(frameWeatherOf(shaped)).toBe(shaped);
    expect(frameWeatherOf(null)).toBeNull();
  });

  it("the director gets the engine's safety car and the season (absent = as before)", () => {
    const rows = [{ car: { id: "a", name: "A" }, position: 1, pose: { x: 0, y: 0, heading: 0, progress: 0.2 } }];
    const plain = tvShotOf({ focusId: "a", rows, tau: 10, seed: 1 });
    const withSc = tvShotOf({ focusId: "a", rows, tau: 10, seed: 1, sc: null, year: 2013, userIds: ["a"] });
    expect(withSc.subjectId).toBe(plain.subjectId);
    expect(withSc.shot.shotKind).toBe(plain.shot.shotKind);
  });

  it("live: the HUD is hidden with the lights and fades in; every audio frame carries weather, compounds and the replay phase", () => {
    jest.useFakeTimers();
    mockFrames.length = 0;
    const { career } = weekend({ seed: "hudC3-live" });
    const args = weekendRaceArgs(career);
    render(
      <ManagerContext.Provider value={{ career }}>
        <LiveRace args={args} onFinished={() => {}} title="Race" />
      </ManagerContext.Provider>,
    );
    const root = () => screen.getByTestId("live-race");
    const fade = () => Number(root().getAttribute("data-hud-fade"));
    let litFade = null;
    // One animation frame at a time (50 ms), so lights out is caught within a frame of race time.
    for (let k = 0; k < 600 && root().getAttribute("data-start") !== "out"; k += 1) {
      act(() => {
        jest.advanceTimersByTime(50);
      });
      if (root().getAttribute("data-start") === "lights") litFade = Math.max(litFade ?? 0, fade());
    }
    expect(litFade).toBe(0);
    expect(root().getAttribute("data-start")).toBe("out");
    // Lights out: the HUD is still hidden (the first frames are far inside +0.9 s at the starting speed).
    expect(fade()).toBeLessThan(0.1);
    expect(root().hasAttribute("data-hud-hidden")).toBe(true);
    for (let k = 0; k < 40 && fade() < 1; k += 1) {
      act(() => {
        jest.advanceTimersByTime(250);
      });
    }
    expect(fade()).toBe(1);
    expect(root().hasAttribute("data-hud-hidden")).toBe(false);

    const frame = mockFrames[mockFrames.length - 1];
    expect(frame).toBeTruthy();
    expect(frame.weather).toBeTruthy();
    expect(Number.isFinite(frame.weather.waterMm.line)).toBe(true);
    expect(frame.cars.length).toBeGreaterThan(0);
    frame.cars.forEach((car) => expect(typeof car.compound).toBe("string"));
    expect("replayPhase" in frame).toBe(true);
    expect(frame.replayPhase).toBeUndefined();
    expect(frame).toHaveProperty("spray");
    expect(frame).toHaveProperty("sc");
  });
});
