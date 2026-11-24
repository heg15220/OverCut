/**
 * HUD-2 of docs/manager/F1M24-GAMEPLAY.md (§2.12.1, §3.3 ola 2): tower-modes, flag-header-sectors
 * (view), director-follow-focus (hook into LiveRace) and garage-exit-presentation (RunCard).
 * RF-WKD-07, RF-WKD-02, RF-SIM-10, RF-3D-04, RNF-07, RNF-09.
 *
 * The package's own test (§3.3): the yellow is never told by colour alone - the tower's header
 * and the status strip always carry its words, and its sector.
 */

import React, { useState } from "react";
import Ajv from "ajv";
import { fireEvent, render, screen, within } from "@testing-library/react";
import hudSchema from "../engine/packs/schema/hud.schema.json";
import HUD from "../data/balance/hud.json";
import broadcast from "../data/balance/broadcast.json";
import { SectorBars, StatusStrip, TimingTower } from "./Broadcast";
import {
  boxDistanceOf, distanceText, flagWords, hasSectorTimes, headerFlagOf, incidentOf, isInPhase, isOutPhase, lapSectorsOf, lastLapOf, raceInLap, raceOutLap,
  runPhaseOf, runPhaseText, sectorOfShare, sectorTone, sessionYellowsAt, stopsOf, towerModeName, towerModesFor, yellowFlag, yellowSectorOf,
} from "./tower";
import { tvShotOf } from "./tvDirector";

jest.mock("../../../helpers/sourceTictactoeImages", () => {
  const resolve = () => "logo.png";
  resolve.keys = () => [];
  return { sourceTictactoeImages: resolve };
});

const circuit = {
  length: 5400,
  sectors: [0, 0.31, 0.68],
  corners: [
    { number: 1, from: 0.05, to: 0.07 },
    { number: 4, from: 0.4, to: 0.43 },
    { number: 10, from: 0.75, to: 0.78 },
  ],
};

describe("HUD-2 · data (RNF-07)", () => {
  it("hud.json passes its schema with the tower blocks of HUD-2", () => {
    const ajv = new Ajv({ allErrors: true });
    const ok = ajv.validate(hudSchema, HUD);
    expect(ajv.errors).toBeNull();
    expect(ok).toBe(true);
    expect(HUD.tower.status).toBe("behaviour");
  });

  it("every mode of the race and the sessions has a name in the selector", () => {
    [...HUD.tower.modes, ...HUD.tower.session.modes].forEach((mode) => {
      expect(towerModeName(mode)).not.toBe(mode);
      expect(towerModeName(mode).length).toBeGreaterThan(0);
    });
  });
});

describe("HUD-2 · tower-modes", () => {
  it("race: hud.json's order, the modes the engine has data for", () => {
    expect(towerModesFor({ session: "race", year: 2024 })).toEqual(HUD.tower.modes);
    const noSectors = towerModesFor({ session: "race", year: 2024, available: HUD.tower.modes.filter((mode) => mode !== "sectors") });
    expect(noSectors).not.toContain("sectors");
    expect(noSectors[0]).toBe(HUD.tower.modes[0]);
  });

  it("byEra replaces the list for its years only (SRS §6)", () => {
    const hud = { ...HUD, tower: { ...HUD.tower, byEra: [{ from: 1976, to: 1993, modes: ["interval", "gap", "stops"] }] } };
    expect(towerModesFor({ session: "race", year: 1988 }, hud)).toEqual(["interval", "gap", "stops"]);
    expect(towerModesFor({ session: "race", year: 2012 }, hud)).toEqual(HUD.tower.modes);
  });

  it("sessions use tower.session.modes", () => {
    expect(towerModesFor({ session: "qualifying", year: 2024 })).toEqual(HUD.tower.session.modes);
  });

  const car = {
    id: "a",
    status: "running",
    history: [
      { lap: 1, start: 0, end: 95.2 },
      { lap: 2, start: 95.2, end: 189.9, pit: { compound: "hard" }, sectors: [30.1, 33.2, 31.4] },
      { lap: 3, start: 189.9, end: 281.4, sectors: [29.8, 32.9, 28.8] },
    ],
  };

  it("last lap, stops and sectors read the history only up to the clock", () => {
    expect(lastLapOf(car, 100)).toBeCloseTo(95.2, 6);
    expect(lastLapOf(car, 200)).toBeCloseTo(94.7, 6);
    expect(lastLapOf(car, 10)).toBeNull();
    expect(stopsOf(car, 150)).toBe(0);
    expect(stopsOf(car, 300)).toBe(1);
    expect(lapSectorsOf(car, 200)).toEqual([30.1, 33.2, 31.4]);
    expect(lapSectorsOf(car, 90)).toBeNull();
    expect(hasSectorTimes([car])).toBe(true);
    expect(hasSectorTimes([{ history: [{ start: 0, end: 90 }] }])).toBe(false);
  });

  it("out lap after a stop, in lap with the stop called; never in the lane or at the flag", () => {
    expect(raceOutLap(car, 200, { inPit: false })).toBe(true);
    expect(raceOutLap(car, 200, { inPit: true })).toBe(false);
    expect(raceOutLap(car, 300, { inPit: false })).toBe(false);
    expect(raceInLap({ ...car, pitRequest: { compound: "soft" } }, { inPit: false })).toBe(true);
    expect(raceInLap({ ...car, pitRequest: { compound: "soft" } }, { inPit: true })).toBe(false);
    expect(raceInLap(car, { inPit: false })).toBe(false);
  });

  it("the incident diamond: investigation until decided, a recent contact, an error being paid", () => {
    const hold = HUD.tower.flags.incident.holdSec;
    const events = [
      { type: "contact", carId: "b", otherId: "a", at: 100 },
      { type: "investigation", carId: "c", at: 100 },
      { type: "no-action", carId: "c", at: 160 },
    ];
    expect(incidentOf("a", events, 100 + hold / 2)).toBe(true);
    expect(incidentOf("a", events, 100 + hold + 1)).toBe(false);
    expect(incidentOf("c", events, 150)).toBe(true);
    expect(incidentOf("c", events, 170)).toBe(false);
    expect(incidentOf("d", events, 101, { incident: { kind: "lockup" } })).toBe(true);
    expect(incidentOf("a", events, 50)).toBe(false);
  });

  it("sector tones carry words, not only colour (RNF-09)", () => {
    expect(sectorTone(30, 30, 31).tone).toBe("best");
    expect(sectorTone(30.5, 30, 31).tone).toBe("pb");
    expect(sectorTone(31.5, 30, 31).tone).toBe("slow");
    ["best", "pb", "slow"].forEach((tone, index) => {
      const values = [30, 30.5, 31.5];
      expect(sectorTone(values[index], 30, 31).text.length).toBeGreaterThan(0);
      expect(sectorTone(values[index], 30, 31).tone).toBe(tone);
    });
    render(<SectorBars sectors={[30, 30.5, 31.5]} best={[30, 30, 30]} own={[31, 30.6, 31]} />);
    const bars = screen.getByRole("group", { name: /sectors|sectores/i });
    expect(within(bars).getByText(/S1 30\.000 · (session best|mejor de la sesión)/)).toBeInTheDocument();
    expect(within(bars).getByText(/S2 30\.500 · (personal best|mejor propio)/)).toBeInTheDocument();
    expect(within(bars).getByText(/S3 31\.500 · (slower|más lento)/)).toBeInTheDocument();
  });

  it("row tags are words or named icons", () => {
    const rows = [
      { id: "a", position: 1, code: "LEC", color: "#dc0000", value: "1:30.000", flags: { incident: true } },
      { id: "b", position: 2, code: "VER", color: "#1e41ff", value: "+0.2", flags: { outLap: true } },
      { id: "c", position: 3, code: "NOR", color: "#ff8000", value: "+0.4", flags: { inLap: true } },
      { id: "d", position: 4, code: "ALO", color: "#006f62", value: "+0.6", flags: { finished: true } },
    ];
    render(<TimingTower label="Torre" title="Race" rows={rows} />);
    expect(screen.getByTitle(/^(incident|incidente)$/i)).toHaveTextContent(/incident|incidente/i);
    expect(screen.getByTitle(/^(out lap|vuelta de salida)$/i)).toHaveTextContent(/^(OUT|SAL)$/);
    expect(screen.getByTitle(/^(in lap|vuelta de entrada)$/i)).toHaveTextContent(/^(IN|ENT)$/);
    expect(screen.getByTitle(/^(finished|terminado)$/i)).toHaveTextContent(/finished|terminado/i);
  });
});

describe("HUD-2 · flag-header-sectors (RF-SIM-10, RNF-09)", () => {
  it("the yellow's sector: the engine's when it sends one, else the corner on circuit.sectors", () => {
    expect(sectorOfShare(circuit, 0.1)).toBe(1);
    expect(sectorOfShare(circuit, 0.5)).toBe(2);
    expect(sectorOfShare(circuit, 0.9)).toBe(3);
    expect(sectorOfShare(circuit, 1.9)).toBe(3);
    expect(yellowSectorOf(circuit, { sector: 3, corner: 1 })).toBe(3);
    expect(yellowSectorOf(circuit, { corner: 4 })).toBe(2);
    expect(yellowSectorOf(circuit, { s: 4320 })).toBe(3);
    expect(yellowSectorOf(circuit, { corner: 99 })).toBeNull();
  });

  it("the yellow's words: flag, sector and corner; double when the engine says so", () => {
    const single = yellowFlag(circuit, [{ corner: 4, until: 50 }]);
    expect(single.kind).toBe("yellow");
    expect(single.label).toMatch(/^(Yellow|Amarilla) · sector 2 · (T|C)4$/);
    const double = yellowFlag(circuit, [{ corner: 1, double: true }, { corner: 10 }]);
    expect(double.label).toMatch(/^(Double yellow|Doble amarilla) · (sectors|sectores) 1, 3/);
    expect(yellowFlag(circuit, [])).toBeNull();
  });

  it("the tower header is tinted for the flags of hud.json, always with words; green is not", () => {
    HUD.tower.header.kinds.forEach((kind) => {
      const header = headerFlagOf({ kind, label: "" });
      expect(header.kind).toBe(kind);
      expect(header.label).toBe(flagWords(kind));
      expect(header.label.length).toBeGreaterThan(0);
    });
    expect(headerFlagOf({ kind: "green", label: "Green flag" })).toBeNull();
  });

  it("a yellow is never only colour: the header and the strip say it, with the sector", () => {
    const flag = yellowFlag(circuit, [{ corner: 4, until: 50 }]);
    const rows = [{ id: "a", position: 1, code: "LEC", color: "#dc0000", value: "", flags: {} }];
    render(
      <>
        <StatusStrip flag={flag} clock="15:00:00" airTemp={24} rainChance={0} change="" trackTemp={35} />
        <TimingTower label="Torre" title="Race" rows={rows} flag={flag} />
      </>,
    );
    const header = screen.getByRole("status", { name: /^(track flag|bandera en pista)$/i });
    expect(header).toHaveAttribute("data-flag", "yellow");
    expect(header).toHaveTextContent(/(Yellow|Amarilla) · sector 2/);
    expect(screen.getByRole("region", { name: "Torre" })).toHaveAttribute("data-flag", "yellow");
    expect(screen.getByRole("status", { name: /track status|estado de la pista/i })).toHaveTextContent(/(Yellow|Amarilla) · sector 2/);
  });

  it("no yellow in a session unless its engine waves one (SES-3 contract), and only while waved", () => {
    expect(sessionYellowsAt({ events: [] }, 10)).toEqual([]);
    const engine = { events: [{ type: "yellow", sector: 2, t: 5, until: 20 }, { type: "yellow", sector: 3, t: 30 }] };
    expect(sessionYellowsAt(engine, 10).map((zone) => zone.sector)).toEqual([2]);
    expect(sessionYellowsAt(engine, 25)).toEqual([]);
    expect(sessionYellowsAt({ events: [], yellowZones: [{ corner: 4, until: 40 }] }, 30)).toHaveLength(1);
  });
});

describe("HUD-2 · director-follow-focus: the tower picks the TV's subject (RF-3D-04)", () => {
  const car = (id, isUser = false) => ({ id, name: `Driver ${id}`, isUser });
  const pose = (progress, x) => ({ progress, x, y: 0, heading: 0 });
  const cars = [car("a"), car("b"), car("c", true), car("d")];
  // a and b racing at the front (0.4 s), c and d far apart.
  const rows = [
    { car: cars[0], pose: pose(3.5, 100), position: 1, interval: undefined, lapsDown: 0 },
    { car: cars[1], pose: pose(3.49, 90), position: 2, interval: 0.4, lapsDown: 0 },
    { car: cars[2], pose: pose(3.3, 40), position: 3, interval: 6, lapsDown: 0 },
    { car: cars[3], pose: pose(3.1, 0), position: 4, interval: 7, lapsDown: 0 },
  ];

  it("the TV films the car picked, not the fight elsewhere (followAction off by default)", () => {
    expect(broadcast.director.followAction.enabled).toBe(false);
    const tv = tvShotOf({ focusId: "c", rows, cars });
    expect(tv.subjectId).toBe("c");
    expect(tv.rivalId).toBeNull();
    expect(tv.target).toBe(rows[2].pose);
    expect(tv.label).toBe("Driver c");
  });

  it("racing, the shot takes in the rival and names the place", () => {
    const tv = tvShotOf({ focusId: "b", rows, cars });
    expect(tv.subjectId).toBe("b");
    expect(tv.rivalId).toBe("a");
    expect(tv.target.x).toBeCloseTo(95, 6);
    expect(tv.label).toMatch(/P1/);
  });

  it("SIM-4's battle state wins over the gap when the engine sends it", () => {
    const tv = tvShotOf({ focusId: "b", rows, cars, battle: ["RUNNING", "RUNNING", "RUNNING", "RUNNING"] });
    expect(tv.rivalId).toBeNull();
  });

  it("clicking a row of the tower changes the TV's subject", () => {
    const towerRows = rows.map((row) => ({ id: row.car.id, position: row.position, code: row.car.id.toUpperCase(), color: "#888888", value: "", flags: {} }));
    const Harness = () => {
      const [focusId, setFocusId] = useState("c");
      const tv = tvShotOf({ focusId, rows, cars });
      return (
        <>
          <output data-testid="tv">{tv.subjectId}</output>
          <TimingTower label="Torre" title="Race" rows={towerRows} onPick={setFocusId} />
        </>
      );
    };
    render(<Harness />);
    expect(screen.getByTestId("tv")).toHaveTextContent("c");
    fireEvent.click(screen.getByText("D"));
    expect(screen.getByTestId("tv")).toHaveTextContent("d");
    fireEvent.click(screen.getByText("A"));
    expect(screen.getByTestId("tv")).toHaveTextContent("a");
  });

  it("with followAction on, the director keeps the fight it chose for its hold", () => {
    const config = { ...broadcast.director, followAction: { ...broadcast.director.followAction, enabled: true } };
    const first = tvShotOf({ focusId: "c", rows, cars, now: 0, config });
    expect(first.subjectId).toBe("b");
    const later = tvShotOf({ focusId: "d", rows, cars, now: 1, prev: first.shot, config });
    expect(later.subjectId).toBe("b");
  });
});

describe("HUD-2 · garage-exit-presentation (RunCard phase and distance)", () => {
  it("today's phases in the §1.7 terms, and the contract's as they come", () => {
    expect(runPhaseOf({ phase: "garage" })).toBe("GARAGE");
    expect(runPhaseOf({ phase: "queued" })).toBe("GARAGE_EXIT");
    expect(runPhaseOf({ phase: "out" })).toBe("OUT_LAP");
    expect(runPhaseOf({ phase: "flying" })).toBe("PUSH");
    expect(runPhaseOf({ phase: "in" })).toBe("IN_LAP");
    expect(runPhaseOf({ phase: "PUSH_PREP" })).toBe("PUSH_PREP");
    expect(runPhaseOf({ phase: "out", runPhase: "GARAGE_EXIT" })).toBe("GARAGE_EXIT");
    ["GARAGE", "GARAGE_EXIT", "OUT_LAP", "PUSH_PREP", "PUSH", "IN_LAP"].forEach((phase) => expect(runPhaseText(phase).length).toBeGreaterThan(0));
    expect(isOutPhase("GARAGE_EXIT") && isOutPhase("OUT_LAP")).toBe(true);
    expect(isInPhase("IN_LAP") && isInPhase("PIT_LANE")).toBe(true);
    expect(isOutPhase("PUSH") || isInPhase("PUSH")).toBe(false);
  });

  it("the box call's distance only when the engine gives it (SES-2 boxRequest.distanceM)", () => {
    expect(boxDistanceOf({ boxRequest: true })).toBeNull();
    expect(boxDistanceOf({ boxRequest: false })).toBeNull();
    expect(boxDistanceOf({ boxRequest: { distanceM: 3870 } })).toBe(3870);
    expect(distanceText(3870)).toMatch(/^3[.,]9 km$/);
    expect(distanceText(640)).toBe("640 m");
    expect(distanceText(NaN)).toBe("");
  });
});
