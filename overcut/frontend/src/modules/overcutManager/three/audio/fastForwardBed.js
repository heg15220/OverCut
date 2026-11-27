/**
 * The fast-forward bed (AUD-C1, F1M24-CHINA §1.5, §2.7; RF-CMD-04, RF-3D-04, RNF-02, RNF-07):
 * what the race sounds like at x4 and up, in place of the engine voices. At those speeds
 * the synthesiser would get rpm compressed in time (gear changes 8 or 16 times too fast),
 * so the voices fall silent and this bed plays: the shared seeded noise buffer read at two
 * offsets (`decorrelateSec` apart) into the left and the right channel, band-passed and
 * low-passed at fixed frequencies. No rpm, no camera, no Doppler: a wide, diffuse field.
 * Its level is the view's `ffBed` share on the mixer's fast-forward bus (mixer.applyView).
 * Numbers in audio.json mixer.views.fastForward.bed (NV, own design).
 */

import audioData from "../../data/balance/audio.json";

const FF = audioData.mixer.views.fastForward;

/** The bed's level at the ear for a mix (the offline model, levels.js): bed gain times the view's share. */
export const fastForwardBedLevel = (mix, cfg = FF) => (cfg && cfg.bed && mix && Number.isFinite(mix.ffBed) ? cfg.bed.gain * Math.min(1, Math.max(0, mix.ffBed)) : 0);

/**
 * Build the bed on `bus` (the mixer's fastForward input) from the seeded `noise` buffer.
 * Without a channel merger (an old browser, a mock) both reads go to the bus summed: mono,
 * but still never tracking rpm. Without the config block nothing is built (null).
 */
export const createFastForwardBed = (ctx, bus, noise, cfg = FF) => {
  if (!cfg || !cfg.bed || !ctx || !bus || !noise) return null;
  const bed = cfg.bed;
  const merger = typeof ctx.createChannelMerger === "function" ? ctx.createChannelMerger(2) : null;
  const out = ctx.createGain();
  out.gain.value = bed.gain;
  const duration = Number.isFinite(noise.duration) && noise.duration > 0 ? noise.duration : 2;
  const sources = [0, 1].map((channel) => {
    const src = ctx.createBufferSource();
    src.buffer = noise;
    src.loop = true;
    const band = ctx.createBiquadFilter();
    band.type = "bandpass";
    band.frequency.value = bed.bandHz;
    band.Q.value = bed.q;
    const low = ctx.createBiquadFilter();
    low.type = "lowpass";
    low.frequency.value = bed.lowpassHz;
    src.connect(band).connect(low);
    if (merger) low.connect(merger, 0, channel);
    else low.connect(out);
    src.start(0, (channel * bed.decorrelateSec) % duration);
    return src;
  });
  if (merger) merger.connect(out);
  out.connect(bus);
  return {
    stop() {
      sources.forEach((src) => {
        try {
          src.stop();
        } catch (error) {
          /* already stopped */
        }
      });
      out.disconnect();
    },
  };
};
