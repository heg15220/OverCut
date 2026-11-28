/**
 * The steering-wheel display (CAM-C4, VIEW-15, F1M24-CHINA §2.4 and §1.5 «Volante»; RF-3D-04, RF-SIM-05,
 * SRS §6, RNF-07).
 *
 * One source each: what the screen shows by era is data/balance/cameras.json wheelDisplay.byEra (gear,
 * speed, KERS or ERS - nothing of energy before 2009, none in 2010, KERS 2009/2011-2013, ERS from 2014),
 * the shift lights come on from the engine's `pose.rpm` against the era's (or the maker's) `shiftRpm` of
 * data/balance/race-powertrain.json (engine/sim/powertrain.js, read only). The view draws the frame of
 * the same pose it places the car with - the pose of the race clock the sound also reads - so the lights
 * change on the frame the revs change (≤ 1 frame, under the ≤ 0,1 s of VIEW-15 / AUD-C12). Pure apart
 * from `drawWheelDisplay`, which paints a 2D canvas context.
 */

import cameraData from "../data/balance/cameras.json";
import { eraOf, manufacturerOf } from "../engine/sim/powertrain";

export const WHEEL_DISPLAY = cameraData.wheelDisplay;

/** The byEra row of `year` (null before the wheel had a screen, SRS §6). */
export const wheelLayoutFor = (year) => {
  if (!Number.isFinite(year) || year < WHEEL_DISPLAY.from || year > WHEEL_DISPLAY.to) return null;
  return (WHEEL_DISPLAY.byEra || []).find((row) => year >= row.from && year <= row.to) || null;
};

/** The rpm the lights fill at: the maker's measured shift point when the era has one, else the era's. */
export const shiftRpmFor = (year, manufacturer = null) => {
  const era = eraOf(Number.isFinite(year) ? year : 2020);
  const maker = manufacturer ? manufacturerOf(era, manufacturer) : null;
  return maker ? maker.shiftRpm : era.engine.shiftRpm;
};

/**
 * The shift lights for `rpm`: { lit, count, share }. None lit below `leds.startShare` of `shiftRpm`,
 * all of them from `shiftRpm` up, a straight fill between (floored to whole lights).
 */
export const shiftLightsOf = (rpm, shiftRpm, leds) => {
  if (!leds || !(leds.count > 0)) return { lit: 0, count: 0, share: 0 };
  const count = leds.count;
  if (!Number.isFinite(rpm) || !(shiftRpm > 0)) return { lit: 0, count, share: 0 };
  const start = Number.isFinite(leds.startShare) ? leds.startShare : 0;
  const fill = Math.min(1, Math.max(0, (rpm / shiftRpm - start) / Math.max(1e-6, 1 - start)));
  const lit = rpm >= shiftRpm ? count : Math.min(count, Math.floor(fill * count + 1e-9));
  return { lit, count, share: lit / count };
};

/** The colour of light `i` of `count`: leds.colors spread in equal bands from left to right. */
export const ledColourOf = (leds, i) => {
  const colours = leds.colors;
  const band = Math.min(colours.length - 1, Math.floor((i * colours.length) / leds.count));
  return colours[band];
};

/** What the display reads for a gear from the power unit: N in neutral, R in reverse. */
export const gearText = (gear) => (!Number.isFinite(gear) ? "" : gear === 0 ? "N" : gear < 0 ? "R" : String(Math.round(gear)));

const MS_TO_KMH = 3.6;

/**
 * What the screen shows this frame: { gear, speed, energy, lights, key } for a car of `year` with the
 * pose of the race clock (`pose.gear`, `pose.rpm`, `pose.v` m/s). `battery` is the car's charge in %
 * (null when the engine gives none: then no energy field is drawn, not a made-up one). `key` changes
 * only when something drawn changes, so the canvas repaints only then. null without a display.
 */
export const wheelFrameOf = ({ year, pose = {}, battery = null, shiftRpm = null, layout = wheelLayoutFor(year) } = {}) => {
  if (!layout) return null;
  const fields = layout.fields || [];
  const gear = fields.includes("gear") ? gearText(pose.gear) : "";
  const speed = fields.includes("speed") && Number.isFinite(pose.v) ? Math.round(pose.v * MS_TO_KMH) : null;
  const energyField = fields.find((field) => field === "kers" || field === "ers") || null;
  const energy = energyField && Number.isFinite(battery) ? { label: energyField.toUpperCase(), share: Math.min(1, Math.max(0, battery / 100)) } : null;
  const lights = shiftLightsOf(pose.rpm, shiftRpm ?? shiftRpmFor(year), layout.leds);
  const key = `${gear}|${speed ?? ""}|${energy ? `${energy.label}${Math.round(energy.share * 20)}` : ""}|${lights.lit}`;
  return { gear, speed, energy, lights, leds: layout.leds, key };
};

/** Canvas size (px) of the screen texture. */
export const CANVAS = { width: 128, height: 64 };

/**
 * Paint a frame on a 2D context `g` of CANVAS size: the lights in a row on top, the gear big in the
 * middle, the speed to the left and the energy bar to the right when the era has them. Only numbers
 * and the technical names KERS / ERS (the same in Spanish and English, RNF-08).
 */
export const drawWheelDisplay = (g, frame, colors = WHEEL_DISPLAY.colors) => {
  const { width, height } = CANVAS;
  g.fillStyle = colors.bg;
  g.fillRect(0, 0, width, height);
  if (!frame) return;
  const leds = frame.leds;
  if (leds && frame.lights.count > 0) {
    const step = width / frame.lights.count;
    for (let i = 0; i < frame.lights.count; i += 1) {
      g.fillStyle = i < frame.lights.lit ? ledColourOf(leds, i) : leds.offColor || "#1b1f26";
      g.fillRect(i * step + 1, 2, step - 2, 8);
    }
  }
  g.fillStyle = colors.fg;
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.font = "900 38px Arial, sans-serif";
  if (frame.gear) g.fillText(frame.gear, width / 2, 40);
  g.font = "700 16px Arial, sans-serif";
  if (frame.speed !== null) g.fillText(String(frame.speed), 22, 40);
  if (frame.energy) {
    g.font = "700 10px Arial, sans-serif";
    g.fillText(frame.energy.label, width - 20, 24);
    g.fillRect(width - 32, 50, 24 * frame.energy.share, 6);
  }
};
