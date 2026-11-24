/**
 * The playback speed of a live session as a React hook, shared by the race and the
 * sessions (HUD-1 of docs/manager/F1M24-GAMEPLAY.md: auto-velocidad, auto-speed-drop;
 * RF-CMD-04, RNF-05, RNF-07). Wraps the pure machine of playback.js:
 *
 *   speed, choose(speed)      the speed playing and the player's pick (RF-CMD-04, 1-16)
 *   notify(triggers, simTime) something happened: the speed may drop (live-view.json eventPriority)
 *   tick(simTime)             from the animation frame: ramps and the speed given back
 *   enabled, setEnabled       auto-speed on or off (the playback bar's toggle)
 *   hold(reason) / release    a dialog that pauses the session while it is open (pauseOn);
 *   held                      true while any of them is open
 *   callout                   { speed, reason } for hud.json speedCallout.showMs after a change
 *   machine                   the mutable state the animation loop reads every frame
 *
 * Only the view's clock is touched: never the engine, the seed or the number of steps.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { HUD, LIVE_VIEW, chooseSpeed, createAutoSpeed, notify as notifyMachine, setAutoSpeedEnabled, speedsOf, tickAutoSpeed } from "./playback";

const realSeconds = () => (typeof performance !== "undefined" ? performance.now() : Date.now()) / 1000;

export default function useAutoSpeed({ initial, config = LIVE_VIEW, hud = HUD, clock = realSeconds } = {}) {
  const machineRef = useRef(null);
  if (!machineRef.current) machineRef.current = createAutoSpeed({ speed: initial, speeds: speedsOf(config), config });
  const machine = machineRef.current;
  const [, bump] = useState(0);
  const repaint = useCallback(() => bump((value) => (value + 1) % 1e9), []);
  const [holds, setHolds] = useState([]);
  const [callout, setCallout] = useState(null);

  // Show the callout of the last change for showMs, then drop it.
  const shown = useRef(0);
  const surface = useCallback(() => {
    if (machine.changes === shown.current || !machine.callout) return;
    shown.current = machine.changes;
    setCallout({ ...machine.callout, key: machine.changes });
  }, [machine]);
  useEffect(() => {
    if (!callout) return undefined;
    const id = setTimeout(() => setCallout(null), hud.speedCallout.showMs);
    return () => clearTimeout(id);
  }, [callout, hud]);

  const after = useCallback(
    (changed) => {
      if (!changed) return false;
      surface();
      repaint();
      return true;
    },
    [surface, repaint],
  );

  const choose = useCallback((speed) => after(chooseSpeed(machine, speed, clock())), [machine, after, clock]);
  const notify = useCallback((triggers, simTime) => after(notifyMachine(machine, triggers, simTime, clock())), [machine, after, clock]);
  const tick = useCallback((simTime) => after(tickAutoSpeed(machine, simTime, clock())), [machine, after, clock]);
  const setEnabled = useCallback(
    (value) => {
      setAutoSpeedEnabled(machine, value);
      repaint();
    },
    [machine, repaint],
  );

  const pauseOn = config.pauseOn.list;
  const hold = useCallback((reason) => {
    if (!pauseOn.includes(reason)) return;
    setHolds((current) => (current.includes(reason) ? current : [...current, reason]));
  }, [pauseOn]);
  const release = useCallback((reason) => setHolds((current) => current.filter((entry) => entry !== reason)), []);

  return useMemo(
    () => ({ machine, speed: machine.speed, choose, notify, tick, enabled: machine.enabled, setEnabled, hold, release, held: holds.length > 0, holds, callout }),
    // machine.speed / machine.enabled change in place; the bump re-renders and rebuilds this.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [machine, machine.speed, machine.enabled, choose, notify, tick, setEnabled, hold, release, holds, callout],
  );
}
