/**
 * Era features (SRS 6.2, amended): DRS from 2011 to 2025 only (RF-SIM-08); 2026
 * replaces it with active aero and a manual overtake mode (RF-SIM-05), as the Manager's
 * rules (engine/rules.js) already do.
 */

import { eraFeaturesFor } from "./eras";

describe("eraFeaturesFor DRS and active aero", () => {
  it("has DRS only in 2011-2025", () => {
    expect(eraFeaturesFor(2010).drs).toBe(false);
    expect(eraFeaturesFor(2011).drs).toBe(true);
    expect(eraFeaturesFor(2025).drs).toBe(true);
    expect(eraFeaturesFor(2026).drs).toBe(false);
  });

  it("flags active aero and the overtake mode from 2026", () => {
    expect(eraFeaturesFor(2025)).toMatchObject({ activeAero: false, overtakeMode: false });
    expect(eraFeaturesFor(2026)).toMatchObject({ activeAero: true, overtakeMode: true });
  });
});
