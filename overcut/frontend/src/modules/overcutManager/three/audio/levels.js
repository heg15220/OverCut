/**
 * Offline mix model (mix-snapshots-per-view, F1M24-GAMEPLAY §2.1; RF-3D-04, RNF-07): the
 * level the live graph would give at the ear for a scene, without Web Audio, so the level
 * relations between views can be tested (onboard 12-15 dB over the far TV camera, the map
 * 15 dB or more under TV). It follows the graph of index.js frame by frame: the same
 * listener (car, post, above or the camera on air), the same voice pool, the same shares
 * and the panner's inverse distance law, the field bed, the crowd and the wind, the view
 * snapshot's bus trims. Every source counts as unit RMS times its gain (the voices' and the
 * beds' own loudness is the synthesiser's business, the same in every view), so only the
 * relations between views mean anything, not the absolute dBFS.
 */

import audioData from "../../data/balance/audio.json";
import { fieldBedOf, windOf } from "./ambience";
import { cameraListener, cameraUsable, dbToGain, distanceGain, listenerFor, resolveView, selectVoices, viewMix } from "./mixer";

const SOURCE_UP = 0.6;
const toDb = (power) => (power > 1e-12 ? 10 * Math.log10(power) : -120);

/**
 * `scene`: { mode, view, playing, focusId, cars: [{ id, x, y, heading, v, firingHz }],
 * camera (Race3D cameraBus value, optional), crowd (0..1 crowd level), kmh (focus car) }.
 * Returns { view, engineDb, ambienceDb, totalDb, voices }.
 */
export const mixLevels = (scene, data = audioData) => {
  const { mode = "tv", playing = true, focusId = null, cars = [], camera = null, crowd = data.ambience.crowd.base, kmh = 0 } = scene;
  const view = resolveView({ view: scene.view, playing, mode });
  const mix = viewMix(mode, view);
  const focus = cars.find((car) => car.id === focusId) || cars[0] || null;
  const listener = cameraUsable(camera, mode, mix) ? cameraListener(camera) : listenerFor(mix, focus);
  const voices = selectVoices(cars, listener, focus?.id);
  let engine = 0;
  voices.forEach((id) => {
    const car = cars.find((c) => c.id === id);
    const atEar = id === focus?.id && mix.listener === "car";
    const share = id === focus?.id ? mix.focus : mix.field;
    const gain = atEar ? 1 : distanceGain(Math.hypot(car.x - listener.x, car.y - listener.y, (listener.z || 0) - SOURCE_UP));
    engine += (share * gain) ** 2;
  });
  engine += (fieldBedOf(cars, listener, voices).level * mix.field) ** 2;
  engine *= dbToGain(mix.engineDb) ** 2;
  let ambience = (crowd * mix.crowd) ** 2 + windOf(kmh, mix.wind).gain ** 2;
  ambience *= dbToGain(mix.bedDb) ** 2;
  return { view, engineDb: toDb(engine), ambienceDb: toDb(ambience), totalDb: toDb(engine + ambience), voices };
};
