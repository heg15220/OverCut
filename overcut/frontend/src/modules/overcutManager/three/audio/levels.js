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
import { fieldBedOf, trackBedOf, windOf } from "./ambience";
import { fastForwardBedLevel } from "./fastForwardBed";
import { busGains, cameraListener, cameraUsable, dbToGain, distanceGain, listenerFor, makeupDb, resolveView, selectVoices, viewMix } from "./mixer";
import { cueShots, panGains, radioPanOf } from "./uiSounds";

const SOURCE_UP = 0.6;
const toDb = (power) => (power > 1e-12 ? 10 * Math.log10(power) : -120);

/**
 * The radio at the ear (AUD-C3): the loudest shot of the cue through the ui bus and the
 * makeup, split left and right by the message's pan. Nothing here reads the view or the speed:
 * the ui bus has no view trim, which is what the 1x/8x check measures.
 * `message` (optional) and `panels` place it; `settings` are the viewer's volumes.
 */
export const radioLevels = ({ message = null, panels = null, settings = audioData.mixer.defaults } = {}, data = audioData) => {
  const shots = cueShots("radio", { alert: Boolean(message && message.alert) }, data.ui);
  const peak = shots.reduce((max, shot) => Math.max(max, shot.gain), 0);
  const gains = busGains(settings);
  const level = peak * gains.master * gains.ui * dbToGain(makeupDb(data.mixer.loudness));
  const pan = radioPanOf(message, panels, data.ui);
  const { left, right } = panGains(pan);
  return { pan, leftDb: toDb((level * left) ** 2), rightDb: toDb((level * right) ** 2), db: toDb(level ** 2) };
};

/**
 * `scene`: { mode, view, playing, speed (x1 when absent), focusId, cars: [{ id, x, y, heading, v, firingHz }],
 * camera (Race3D cameraBus value, optional), crowd (0..1 crowd level), kmh (focus car) }.
 * Returns { view, engineDb, ambienceDb, totalDb, voices, correlation }: `correlation` is the
 * L/R correlation of the mix, the coherent power (the voices, the field bed and the wind,
 * point sources or mono loops) over the total; the crowd, the track bed and the fast-forward
 * bed are decorrelated left and right (AUD-C4) and only add to the denominator.
 */
export const mixLevels = (scene, data = audioData) => {
  const { mode = "tv", playing = true, focusId = null, cars = [], camera = null, crowd = data.ambience.crowd.base, kmh = 0 } = scene;
  const view = resolveView({ view: scene.view, playing, mode, speed: scene.speed });
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
  // The fast-forward bed (AUD-C1) sits on its own bus, outside the engine trim.
  const ffBed = fastForwardBedLevel(mix) ** 2;
  const bedTrim = dbToGain(mix.bedDb) ** 2;
  const wind = windOf(kmh, mix.wind).gain ** 2 * bedTrim;
  const crowdPower = (crowd * mix.crowd) ** 2 * bedTrim;
  const trackBed = trackBedOf(mix, data.ambience.trackBed) ** 2 * bedTrim;
  const ambience = crowdPower + wind + trackBed;
  const total = engine + ffBed + ambience;
  const coherent = engine + wind;
  return { view, engineDb: toDb(engine + ffBed), ambienceDb: toDb(ambience), totalDb: toDb(total), voices, correlation: total > 0 ? coherent / total : 1 };
};