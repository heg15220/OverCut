/**
 * WKD-6 pre-race-briefing (docs/manager/F1M24-GAMEPLAY.md §2.12.2, §3.3; RF-INB-01, RF-SIM-10,
 * RF-SIM-12): the circuit card tells the team, before the weekend, the measured chance of a
 * safety car at this circuit (the pack's calendar[].scRate, OpenF1 race_control, SIM-5) and the
 * net time a stop costs under green, SC and VSC (the engine's own pit lane, PIT-1/WP6). Nothing
 * outside its era (SRS §6, criterio 7.2): no SC before 1993, no VSC before 2015. Pure: it never
 * moves a draw (RF-SIM-15, RNF-05).
 */

import React from "react";
import { render, screen } from "@testing-library/react";
import { fallbackBootstrap } from "../../overcutTrayectoria/data/fallbackBootstrap";
import { reference } from "../data/reference";
import { createCareer, createContext, currentRace, eraOf, seasonWorld } from "../engine/career";
import { loadSeasonPack, seasonPackYears } from "../engine/packs/seasonPacks";
import { preRaceBriefing } from "../engine/briefing";
import { pitLaneOf, rulesOf, stationaryTime } from "../engine/race";
import { circuitScFactor } from "../engine/sim/safetyCar";
import { circuitFor } from "../engine/venue";
import bahrain2024 from "../engine/sim/__fixtures__/pit-bahrain-2024.json";
import scRates from "../data/seasons/curated/circuit-sc-rates.json";
import CircuitCard from "./CircuitCard";

jest.mock("../../../helpers/sourceTictactoeImages", () => {
  const resolve = () => "logo.png";
  resolve.keys = () => [];
  return { sourceTictactoeImages: resolve };
});

let packs = {};
let context = null;
beforeAll(async () => {
  const loaded = await Promise.all(seasonPackYears().map((year) => loadSeasonPack(year)));
  packs = Object.fromEntries(loaded.map(({ pack }) => [pack.year, pack]));
  context = createContext(fallbackBootstrap, reference, packs);
});

const careerOf = (year) => {
  const world = seasonWorld(context, year, `briefing-${year}`);
  const teamId = world.order.find((id) => !world.teams[id].partial);
  return createCareer(context, { year, teamId, seed: `briefing-${year}`, mode: "free" });
};

const briefingOf = (career, round = career.round) => {
  const race = career.world.races[round];
  return { race, briefing: preRaceBriefing({ race, era: eraOf(career), year: career.year, crew: career.staff?.operations?.rating }) };
};

describe("WKD-6 · the pack's scRate reaches the race (packWorld packCalendar)", () => {
  it("carries calendar[].scRate on the measured seasons and null on the others", () => {
    const measured = careerOf(2024).world.races;
    expect(measured.length).toBe(packs[2024].calendar.length);
    packs[2024].calendar.forEach((event) => {
      const race = measured.find((entry) => entry.round === event.round);
      expect(race.scRate).toBe(Number.isFinite(event.scRate) ? event.scRate : null);
    });
    expect(measured.filter((race) => race.scRate !== null).length).toBeGreaterThan(20);
    expect(careerOf(2008).world.races.every((race) => race.scRate === null)).toBe(true);
  });

  it("the engine's safety-car factor reads it (sim/safetyCar.js circuitScFactor), neutral without it", () => {
    const career = careerOf(2024);
    const bahrain = career.world.races.find((race) => race.packCircuitId === "bahrain");
    expect(bahrain.scRate).toBe(scRates.circuits.bahrain.scRate);
    expect(circuitScFactor(bahrain)).not.toBe(1);
    expect(circuitScFactor(careerOf(2008).world.races[0])).toBe(1);
  });
});

describe("WKD-6 · preRaceBriefing (engine/briefing.js)", () => {
  it("Bahrain 2024: the measured SC rate and a green-flag loss within 1 s of the real one (OpenF1)", () => {
    const career = careerOf(2024);
    const round = career.world.races.findIndex((race) => race.packCircuitId === "bahrain");
    const { race, briefing } = briefingOf(career, round);
    expect(briefing.laps).toBe(bahrain2024.race.laps);
    expect(briefing.scAllowed).toBe(true);
    expect(briefing.vscAllowed).toBe(true);
    expect(briefing.scMeasured).toBe(true);
    expect(briefing.scRate).toBe(scRates.circuits.bahrain.scRate);
    expect(Math.abs(briefing.lossGreen - bahrain2024.openf1.lossMedian)).toBeLessThanOrEqual(bahrain2024.toleranceSec);
    // Net loss, not f1db's line-to-line lane time (F1M24-GAMEPLAY §1.6).
    expect(briefing.lossGreen).toBeLessThan(bahrain2024.f1db.pitLaneMedian);
    // Neutralised, the track stretch is slower, so the stop costs less.
    expect(briefing.lossSc).toBeLessThan(briefing.lossGreen);
    expect(briefing.lossVsc).toBeLessThan(briefing.lossGreen);
    expect(briefing.pitLimitKmh).toBe(80);

    // The same numbers the race will charge: createRace's pitLane plus the expected stop.
    const rules = rulesOf(eraOf(career), career.year);
    const lane = pitLaneOf({ circuit: circuitFor(race, career.year), race, rules });
    const stop = stationaryTime({ era: eraOf(career), crew: career.staff?.operations?.rating });
    expect(briefing.lossGreen).toBeCloseTo(lane.stop + stop, 2);
    expect(briefing.lossSc).toBeCloseTo(lane.sc + stop, 2);
    expect(briefing.lossVsc).toBeCloseTo(lane.vsc + stop, 2);
  });

  it("shows nothing outside its era: no SC before 1993, no VSC before 2015, unmeasured before 2023", () => {
    const year = (y) => briefingOf(careerOf(y)).briefing;
    const early = year(1990);
    expect(early.scAllowed).toBe(false);
    expect(early.scRate).toBeNull();
    expect(early.lossSc).toBeNull();
    expect(early.lossVsc).toBeNull();
    expect(Number.isFinite(early.lossGreen)).toBe(true);

    const refuelled = year(2008);
    expect(refuelled.scAllowed).toBe(true);
    expect(refuelled.vscAllowed).toBe(false);
    expect(refuelled.scMeasured).toBe(false);
    expect(refuelled.scRate).toBeNull();
    expect(refuelled.refuelling).toBe(true);
    expect(Number.isFinite(refuelled.lossSc)).toBe(true);
    expect(refuelled.lossVsc).toBeNull();

    const hybrid = year(2016);
    expect(hybrid.vscAllowed).toBe(true);
    expect(hybrid.refuelling).toBe(false);
    expect(Number.isFinite(hybrid.lossVsc)).toBe(true);
  });

  it("is pure: the same briefing twice and the race left untouched (RF-SIM-15, RNF-05)", () => {
    const career = careerOf(2024);
    const before = JSON.stringify(career.world.races[career.round]);
    const a = briefingOf(career).briefing;
    const b = briefingOf(career).briefing;
    expect(a).toEqual(b);
    expect(JSON.stringify(career.world.races[career.round])).toBe(before);
  });

  it("an old save's race without scRate reads as not measured, never invented", () => {
    const career = careerOf(2024);
    const { scRate, ...old } = currentRace(career);
    const briefing = preRaceBriefing({ race: old, era: eraOf(career), year: career.year });
    expect(briefing.scMeasured).toBe(false);
    expect(briefing.scRate).toBeNull();
    expect(preRaceBriefing({ race: null, year: 2024 })).toBeNull();
  });
});

describe("WKD-6 · the circuit card shows the briefing", () => {
  it("2024: laps, SC chance and the three stop losses", () => {
    const career = careerOf(2024);
    const round = career.world.races.findIndex((race) => race.packCircuitId === "bahrain");
    const race = career.world.races[round];
    render(<CircuitCard race={race} year={career.year} era={eraOf(career)} crew={career.staff?.operations?.rating} drs />);
    expect(screen.getByText(`${Math.round(scRates.circuits.bahrain.scRate * 100)}%`)).toBeInTheDocument();
    expect(screen.getByText(/Parada en verde|Stop under green/)).toBeInTheDocument();
    expect(screen.getByText(/Parada con SC|Stop under SC/)).toBeInTheDocument();
    expect(screen.getByText(/Parada con VSC|Stop under VSC/)).toBeInTheDocument();
  });

  it("1990: no safety-car or VSC loss on the card", () => {
    const career = careerOf(1990);
    render(<CircuitCard race={currentRace(career)} year={career.year} era={eraOf(career)} />);
    expect(screen.getByText(/Parada en verde|Stop under green/)).toBeInTheDocument();
    expect(screen.queryByText(/Parada con SC|Stop under SC/)).toBeNull();
    expect(screen.queryByText(/Parada con VSC|Stop under VSC/)).toBeNull();
  });
});
