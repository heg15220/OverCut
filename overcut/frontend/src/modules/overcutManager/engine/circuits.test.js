import { LAYOUTS, LAYOUT_REFS, layoutFor } from "./layouts";
import { buildCircuit, distanceAtTimeShare, timeShareAtDistance } from "./trackGeometry";
import { circuitFor, circuitRefFor } from "./venue";
import { feelingsOf, idealSetup, neutralSetup, practiceRun, satisfactionOf } from "./setup";
import { createStream } from "../../overcutTrayectoria/engine/rng";

describe("circuits", () => {
  it("builds every sketched venue at its real length, with corners and a lap that makes sense", () => {
    LAYOUT_REFS.forEach((ref) => {
      LAYOUTS[ref].forEach((version, index) => {
        const circuit = buildCircuit({ id: `${ref}#${index}`, ...version }, version.to ?? 2020);
        expect(Math.abs(circuit.length - version.km * 1000)).toBeLessThan(15);
        expect(circuit.corners.length).toBeGreaterThanOrEqual(3);
        expect(circuit.sectors).toHaveLength(3);
        expect(circuit.pit.lineAt).toBeGreaterThan(circuit.pit.boxAt);
        // Average speed between 120 km/h and what a modern car could average on AVUS's two straights.
        const kmh = (circuit.length / circuit.simulatedLap) * 3.6;
        expect(kmh).toBeGreaterThan(120);
        expect(kmh).toBeLessThan(345);
      });
    });
  });

  it("maps time to distance and back", () => {
    const circuit = circuitFor({ name: "Monaco Grand Prix", circuit: "monaco" }, 2020);
    [0.1, 0.35, 0.8].forEach((share) => {
      expect(timeShareAtDistance(circuit, distanceAtTimeShare(circuit, share))).toBeCloseTo(share, 2);
    });
  });

  it("finds the right venue for a Grand Prix and its era", () => {
    expect(circuitRefFor({ name: "Italian Grand Prix" }, 1990)).toBe("monza");
    expect(circuitRefFor({ name: "Australian Grand Prix" }, 1990)).toBe("adelaide");
    expect(circuitRefFor({ name: "Australian Grand Prix" }, 2010)).toBe("albert_park");
    expect(circuitRefFor({ name: "Belgian Grand Prix", circuit: "zolder" }, 1980)).toBe("zolder");
    expect(layoutFor("monza", 1965).km).toBeLessThan(layoutFor("monza", 2000).km);
    expect(layoutFor("spa", 1960).km).toBeGreaterThan(10);
    expect(LAYOUT_REFS).toContain(circuitRefFor({ name: "Grand Prix of Nowhere" }, 2020));
  });

  it("puts DRS zones only where the era had DRS", () => {
    expect(circuitFor({ name: "Italian Grand Prix", circuit: "monza" }, 2005).drsZones).toHaveLength(0);
    expect(circuitFor({ name: "Italian Grand Prix", circuit: "monza" }, 2020).drsZones.length).toBeGreaterThan(0);
  });
});

describe("setup", () => {
  it("rewards the setup the driver wants and narrows the window run by run", () => {
    const ideal = idealSetup({ driverId: "d1", profile: { aero: 0.85, power: 0.3 }, seed: "x" });
    const lowDrag = idealSetup({ driverId: "d1", profile: { aero: 0.2, power: 0.95 }, seed: "x" });
    expect(ideal.rearWing).toBeGreaterThan(lowDrag.rearWing);
    expect(satisfactionOf(ideal, ideal)).toBeCloseTo(1, 5);
    expect(satisfactionOf(neutralSetup(), ideal)).toBeLessThan(1);
    const stream = createStream("runs");
    let knowledge = 0;
    const widths = [];
    for (let run = 0; run < 4; run += 1) {
      const result = practiceRun({ setup: neutralSetup(), ideal, knowledge, technical: 60, engineering: 60, stream });
      knowledge = result.knowledge;
      widths.push(result.report.oversteer.hi - result.report.oversteer.lo);
    }
    expect(widths[3]).toBeLessThan(widths[0]);
    const feel = feelingsOf(neutralSetup());
    Object.values(feel).forEach((value) => {
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(1);
    });
  });
});

describe("sessions", () => {
  it("turns a knockout qualifying into Q1, Q2 and Q3 whose best laps are the grid", () => {
    // eslint-disable-next-line global-require
    const { qualifyingTimeline, sessionStatus } = require("./sessions");
    const ids = Array.from({ length: 20 }, (_, i) => `d${i}`);
    const lap = (offset) => ids.map((id, i) => ({ id, time: 90 + i * 0.1 + offset })).slice(0, 20 - offset * 0);
    const quali = { format: "knockout", sessions: [lap(0), lap(0).slice(0, 15), lap(0).slice(0, 10)], order: ids, times: {} };
    const timeline = qualifyingTimeline({ quali, baseLap: 92, seed: "s", ids });
    expect(timeline.sessions.map((session) => session.name)).toEqual(["Q1", "Q2", "Q3"]);
    expect(timeline.sessions[0].drop).toBe(5);
    expect(timeline.sessions[1].drop).toBe(5);
    const q3 = timeline.sessions[2];
    const bests = q3.ids.map((id) => sessionStatus(q3.histories[id], q3.duration + 600).best);
    bests.forEach((best, index) => expect(best).toBeCloseTo(90 + index * 0.1, 5));
    expect(sessionStatus(q3.histories.d0, 0).state).toBe("garage");
  });
});
