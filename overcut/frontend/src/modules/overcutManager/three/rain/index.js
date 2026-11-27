/**
 * Rain of the view (GS-10 / VIEW-07 modules, LOOK-C2; RF-SIM-11, RF-3D-04, RNF-02, RNF-05, RNF-07):
 * wet asphalt (wetSurface), spray (spray), lens drops (lens), rain fog and streaks (fog). Every module
 * reads only the engine's snapshot (`snapshot.weather`, `snapshot.spray[i]`, F1M24-CHINA §1.5) and
 * data/balance/view-look.json; nothing here is wired to Race3D.js until LOOK-C4.
 */

import { wetLookFor } from "./wetSurface";
import { rainFogDensity, streakCountFor } from "./fog";
import { lensActiveFor } from "./lens";

export * from "./wetSurface";
export * from "./spray";
export * from "./lens";
export * from "./fog";
export { seedFor } from "./seeded";

/**
 * The frame's rain parameters from an engine snapshot (the array `snapshot(state)` with `.weather` and
 * `.spray`) or a weather object: `{wet, fogDensity, streaks, lens}`. A snapshot without weather (old
 * saves, the quick mode) gives the dry look.
 */
export const rainViewFor = (snapshot, { quality = "medium", cameraKind = "tv", humidity = 50 } = {}) => {
  const weather = !snapshot ? null : snapshot.waterMm !== undefined ? snapshot : snapshot.weather ?? null;
  const rainMmH = weather && Number.isFinite(weather.rainRate) ? Math.max(0, weather.rainRate) : 0;
  return {
    wet: wetLookFor(weather),
    rainMmH,
    fogDensity: rainFogDensity({ humidity, rainMmH }),
    streaks: streakCountFor(rainMmH, quality),
    lens: lensActiveFor(cameraKind),
  };
};
