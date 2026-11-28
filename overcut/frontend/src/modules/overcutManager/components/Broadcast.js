/**
 * The furniture shared by practice, qualifying and the race (DESIGN.md §6.5,
 * "Live session"): the pit wall's own monitors, not a TV clone.
 *
 *   TimingTower   left column: session and lap or clock, the order with a team
 *                 stripe and a three-letter code, your drivers in gold, cars in
 *                 the pits, the fastest lap in purple, the knockout cut, and an
 *                 arrow for three seconds when a car gains or loses a place
 *                 (§5.5). On phones it folds to the five rows around your car.
 *                 HUD-2 (tower-modes, flag-header-sectors): the header tinted by
 *                 the flag with its words (the yellow says its sector), and row
 *                 tags with words - incident, out lap, in lap, finished.
 *   SectorBars    three sector times, purple / green / yellow with their words.
 *   StatusStrip   over the picture: the flag state (colour and words, never
 *                 colour alone) and the conditions - clock, air, track, rain,
 *                 rubber and grip.
 *   PlaybackBar   under the picture: play, speed (RF-CMD-04), auto-speed, the
 *                 view (map, TV, camera) apart from the camera (RF-3D-04), the
 *                 car before or after by position, and the skips the session allows.
 *   SpeedCallout  the big ×N over the picture when the speed changes.
 *   Feed          the engineer on the radio and the commentary (RF-CMD-03),
 *                 filterable.
 *   Dots          a level picked from a row of steps - pace, mixture, battery.
 *   EventBanner   HUD-3: the event banner up now (passes, incidents, fastest lap,
 *                 DRS, laps to go), one at a time.
 *   PitTimer      HUD-3: your cars' stops as they happen - lane, stationary, total.
 *   TyreTemp      HUD-6: the tyre in °C (surface and carcass, §1.7 tyreC), its trend and
 *                 the warning against the compound's window, all in words too.
 *   HudMiniMap    HUD-C2 (F1M24-CHINA VIEW-16): the circuit in a corner with every car and the
 *                 DRS zones only in the eras that have DRS, with the word on them.
 *
 * HUD-C2 also adds the lap countdown to the tower header (tower.lapCountdownOf), the steps
 * and the estimate to the pit widget (pitTimer.pitStepsOf, previewPit lineToLine), the
 * segment of the camera to its label and the fast-forward-to-map option to the playback bar.
 */

import React, { useMemo, useRef, useState } from "react";
import { offsetSpan, pathOf } from "../engine/trackGeometry";
import HUD_DATA from "../data/balance/hud.json";
import { Flag, Segmented, Tabs, readableOn } from "./atoms";
import { IconArrowDown, IconArrowUp, IconChevronLeft, IconChevronRight, IconFlag, IconPlay, IconRadio } from "./icons";
import { IconCamera, IconCloud, IconDroplet, IconPause, IconRain, IconSun, IconThermometer, IconTimer } from "./icons";
import { t } from "./texts";
import { headerFlagOf, sectorTone } from "./tower";
import { bannerText } from "./hudBanners";
import { gripLevel, rubberLevel, showsWater, skyOf } from "./hudConditions";
import { depthOfWetness } from "../engine/weather";
import "./styles/weekend.css";
import "./styles/playback.css";
import "./styles/tower.css";
import "./styles/hud.css";

const MOVE_MS = 3000;

/** Remembers each car's last position and when it last changed, for the tower's arrows. */
const useMoves = (rows) => {
  const memory = useRef(new Map());
  const clock = typeof performance !== "undefined" ? performance.now() : Date.now();
  const moves = {};
  rows.forEach((row) => {
    const seen = memory.current.get(row.id);
    if (!seen) memory.current.set(row.id, { position: row.position, at: -Infinity, dir: 0 });
    else if (seen.position !== row.position) {
      seen.dir = row.position < seen.position ? 1 : -1;
      seen.at = clock;
      seen.position = row.position;
    }
    const entry = memory.current.get(row.id);
    if (clock - entry.at < MOVE_MS && !row.flags?.out) moves[row.id] = entry.dir;
  });
  return moves;
};

/** Row tags (HUD-2): each with its words, never a colour alone (RNF-09). */
const RowTags = ({ flags }) => (
  <>
    {flags.incident && (
      <span className="lv-row__tag" data-tag="incident" title={t("Incidente", "Incident")}>
        <span aria-hidden="true">◆</span>
        <span className="lv-sr">{t("Incidente", "Incident")}</span>
      </span>
    )}
    {flags.outLap && (
      <span className="lv-row__tag" data-tag="out" title={t("Vuelta de salida", "Out lap")}>
        {t("SAL", "OUT")}
      </span>
    )}
    {flags.inLap && (
      <span className="lv-row__tag" data-tag="in" title={t("Vuelta de entrada", "In lap")}>
        {t("ENT", "IN")}
      </span>
    )}
    {flags.finished && (
      <span className="lv-row__tag" data-tag="finished" title={t("Terminado", "Finished")}>
        <IconFlag size={12} />
        <span className="lv-sr">{t("Terminado", "Finished")}</span>
      </span>
    )}
  </>
);

/**
 * Three sector times (HUD-2 tower-modes): `sectors` the times, `best` the session's best
 * sectors (purple), `own` the car's (green); slower ones in yellow. The tone is in the
 * words too (title and screen-reader text).
 */
export const SectorBars = ({ sectors, best = [], own = [] }) => (
  <span className="lv-bars" role="group" aria-label={t("Sectores", "Sectors")}>
    {[0, 1, 2].map((index) => {
      const value = sectors?.[index];
      const tone = sectorTone(value, best[index], own[index]);
      const words = Number.isFinite(value) ? `S${index + 1} ${value.toFixed(3)}${tone.text ? ` · ${tone.text}` : ""}` : `S${index + 1}`;
      return (
        <span key={index} className={`lv-bars__chip${tone.tone ? ` is-${tone.tone}` : ""}`} title={words} data-tone={tone.tone || undefined}>
          <span aria-hidden="true">{Number.isFinite(value) ? value.toFixed(1) : `S${index + 1}`}</span>
          <span className="lv-sr">{words}</span>
        </span>
      );
    })}
  </span>
);

/**
 * The tower. `rows` are { id, position, code, color, value, flags: { user, out, pit, eliminated,
 * fastest, focus, battle, danger, incident, outLap, inLap, finished } }; `modes` is
 * { options, value, onChange } or null; `flag` the flag state { kind, label } (HUD-2: the
 * header is tinted, with the words, for the kinds of hud.json tower.header). VIEW-01 (HUD-C1): `fold`
 * { open, onToggle, rows } - over the picture (hud.json layout) the tower folds to its first `rows` rows
 * plus yours and the one you follow, and the viewer opens or folds it (the view keeps the state, for the
 * zones); without it, the phone fold of always (five rows around your car).
 */
export const TimingTower = ({ title, subtitle, modes, rows, onPick, label, flag = null, fold = null, countdown = null }) => {
  const [collapsedOwn, setCollapsedOwn] = useState(true);
  const collapsed = fold ? !fold.open : collapsedOwn;
  const setCollapsed = fold ? (next) => fold.onToggle(!(typeof next === "function" ? next(collapsed) : next)) : setCollapsedOwn;
  const header = headerFlagOf(flag);
  const moves = useMoves(rows);
  const userIndex = rows.findIndex((row) => row.flags?.user);
  const anchor = userIndex < 0 ? 0 : userIndex;
  const firstCut = rows.findIndex((row) => row.flags?.danger || row.flags?.eliminated);
  return (
    <section className={`lv-tower${collapsed ? " is-collapsed" : ""}`} aria-label={label} data-flag={header?.kind}>
      <header className="lv-tower__head">
        <strong>{title}</strong>
        {subtitle && <span className="lv-tower__sub">{subtitle}</span>}
        {countdown && (
          <span className={`lv-tower__countdown${countdown.last ? " is-last" : ""}`} role="status" aria-live="polite" data-testid="lap-countdown" data-left={countdown.left}>
            {countdown.label}
          </span>
        )}
      </header>
      {header && (
        <p className="lv-tower__flag" data-flag={header.kind} role="status" aria-label={t("Bandera en pista", "Track flag")}>
          <i aria-hidden="true" />
          {header.label}
        </p>
      )}
      {modes && (
        <div className="lv-tower__modes">
          <Segmented label={t("Dato de la torre", "Tower data")} value={modes.value} onChange={modes.onChange} options={modes.options} />
        </div>
      )}
      <ol className="lv-tower__rows" aria-label={label}>
        {rows.map((row, index) => {
          const f = row.flags || {};
          const move = moves[row.id];
          const far = fold ? index >= fold.rows && !f.user && !f.focus : Math.abs(index - anchor) > 2 && index > 2;
          const classes = [
            "lv-row",
            f.user && "is-user",
            f.out && "is-out",
            f.pit && "is-pit",
            f.eliminated && "is-eliminated",
            f.danger && "is-danger",
            f.focus && "is-focus",
            f.battle && "is-battle",
            index === firstCut && index > 0 && "is-cut",
            far && "is-far",
          ].filter(Boolean).join(" ");
          return (
            <li
              key={row.id}
              className={classes}
              style={{ "--stripe": readableOn(row.color, "#0e1520") }}
              onClick={() => onPick?.(row.id)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onPick?.(row.id);
                }
              }}
              tabIndex={0}
              aria-current={f.focus ? "true" : undefined}
            >
              <span className="lv-row__pos">{row.position}</span>
              <i className="lv-row__stripe" aria-hidden="true" />
              <span className="lv-row__code">
                {row.code}
                {move ? (
                  <span className={`lv-row__move ${move > 0 ? "is-up" : "is-down"}`} title={move > 0 ? t("Gana un puesto", "Gained a place") : t("Pierde un puesto", "Lost a place")}>
                    {move > 0 ? <IconArrowUp size={12} /> : <IconArrowDown size={12} />}
                  </span>
                ) : null}
                <RowTags flags={f} />
              </span>
              <span className={`lv-row__value${typeof row.value === "string" && /^\p{L}/u.test(row.value) ? " is-text" : ""}`}>{row.value}</span>
              <span className="lv-row__mark">{f.fastest ? <IconTimer size={14} title={t("Vuelta rápida", "Fastest lap")} /> : null}</span>
            </li>
          );
        })}
      </ol>
      {rows.length > (fold ? fold.rows : 5) && (
        <div className="lv-tower__more">
          <button type="button" className="mn-link" onClick={() => setCollapsed((value) => !value)}>
            {collapsed ? t(`Ver los ${rows.length}`, `Show all ${rows.length}`) : t("Ver solo mi zona", "Show my part only")}
          </button>
        </div>
      )}
    </section>
  );
};

const SKY_ICON = { rain: IconRain, cloud: IconCloud, sun: IconSun };
const degrees = (value) => (Number.isFinite(value) ? `${value.toFixed(0)} °C` : "—");

/**
 * The strip over the picture. `flag` is { kind: green|yellow|sc|vsc|red|chequered|session, label }.
 * HUD-4 status-strip-data: every value comes from the engine (components/hudConditions.js) - `waterMm`
 * the water on the racing line, `rubber` the engine's 0..1 - and the words from race-weather.json
 * display; a value the engine does not give shows as "—", never as a guess.
 * HUD-C3 (GS-14, GS-12 the HUD part): the rubber among the engine's five bands (`rubberBand`, the engine's
 * own band when it sends one) with its word and tone - a rhombus on the low ones, never colour alone
 * (RNF-09) - and `raceControl`, the words of what race control has said that still holds (wet track,
 * slippery sectors, low grip, DRS disabled; hudRaceControl.raceControlLabel), or nothing.
 */
export const StatusStrip = ({ flag, clock, airTemp, rainChance, change, trackTemp, wetness = 0, waterMm = null, rubber = null, rubberBand = null, notes = null, raceControl = null }) => {
  const Sky = SKY_ICON[skyOf(wetness, rainChance)];
  const water = showsWater(wetness);
  const rubberNow = rubberLevel(rubber, rubberBand);
  return (
  <div className="lv-status" data-flag={flag.kind} role="status" aria-label={t("Estado de la pista", "Track status")}>
    <div className="lv-status__top">
      <span className="lv-status__flag">
        <i aria-hidden="true" />
        {flag.label}
      </span>
      <span className="lv-status__clock" data-testid="status-clock">{clock}</span>
    </div>
    {raceControl && (
      <p className="lv-status__rc" data-testid="race-control" aria-label={t("Dirección de carrera", "Race control")}>
        <b>{t("Dirección de carrera", "Race control")}</b> {raceControl}
      </p>
    )}
    <dl className="lv-status__grid">
      <div title={t("Aire", "Air")}>
        <dt>
          <Sky size={16} />
          {t("Aire", "Air")}
        </dt>
        <dd>{degrees(airTemp)}</dd>
      </div>
      <div>
        <dt>
          <IconThermometer size={16} />
          {t("Pista", "Track")}
        </dt>
        <dd>{degrees(trackTemp)}</dd>
      </div>
      <div className={water ? "is-wet" : ""}>
        <dt>
          <IconDroplet size={16} />
          {water ? t("Agua", "Water") : t("Lluvia", "Rain")}
        </dt>
        <dd>{water ? `${(Number.isFinite(waterMm) ? waterMm : depthOfWetness(wetness)).toFixed(1)} mm` : `${rainChance}%`}</dd>
      </div>
      <div>
        <dt>{t("Goma", "Rubber")}</dt>
        <dd className="lv-status__rubber" data-testid="rubber-level" data-level={rubberNow.id || undefined} data-tone={rubberNow.tone || undefined}>
          {rubberNow.tone === "low" && <span className="lv-status__mark" aria-hidden="true">◆</span>}
          {rubberNow.label}
        </dd>
      </div>
      <div>
        <dt>{t("Agarre", "Grip")}</dt>
        <dd>{gripLevel(wetness, rubber).label}</dd>
      </div>
    </dl>
    {(change || notes) && <p className="lv-status__note">{[change, notes].filter(Boolean).join(" · ")}</p>}
  </div>
  );
};

/**
 * Play, speed and camera - the bar under the picture. `speeds` are numbers; `children`
 * are the skips and calls the session allows. Optional (HUD-1, user-camera-lock and
 * auto-velocidad): `views` { value, options, onChange } - the view (map, TV, camera) apart
 * from the camera arrows; `car` { label, onStep } - the car before or after the focused one
 * by position; `autoSpeed` { enabled, onToggle }; `held` - paused by an open dialog.
 * HUD-C2 (VIEW-17): `fastForwardMap` { enabled, onToggle, atSpeed } - the option to go to the map at that speed.
 */
export const PlaybackBar = ({ playing, onPlay, speeds, speed, onSpeed, speedText = (value) => `×${value}`, cameraLabel, onCamera, children, disabled, views = null, car = null, autoSpeed = null, held = false, fastForwardMap = null }) => (
  <div className="lv-play" data-held={held ? "" : undefined}>
    <button type="button" className="mn-icon-btn lv-play__toggle" onClick={onPlay} aria-label={playing ? t("Pausa", "Pause") : t("Seguir", "Play")} title={held ? t("En pausa mientras el diálogo está abierto", "Paused while the dialog is open") : playing ? t("Pausa", "Pause") : t("Seguir", "Play")} disabled={disabled}>
      {playing && !held ? <IconPause size={18} /> : <IconPlay size={18} />}
    </button>
    <Segmented label={t("Velocidad", "Speed")} value={speed} onChange={onSpeed} options={speeds.map((value) => ({ value, label: speedText(value) }))} />
    {fastForwardMap && (
      <button
        type="button"
        className={`mn-btn mn-btn--sm mn-btn--ghost lv-play__ffmap${fastForwardMap.enabled ? " is-on" : ""}`}
        aria-pressed={fastForwardMap.enabled}
        data-testid="ff-map"
        onClick={() => fastForwardMap.onToggle(!fastForwardMap.enabled)}
        title={t(`Mapa en avance rápido: a ×${fastForwardMap.atSpeed} o más la vista pasa al mapa y vuelve a tu cámara al bajar`, `Map in fast forward: at ×${fastForwardMap.atSpeed} or more the view goes to the map and back to your camera when you slow down`)}
      >
        {t("Mapa ×", "Map ×")}
        {fastForwardMap.atSpeed}
      </button>
    )}
    {autoSpeed && (
      <button
        type="button"
        className={`mn-btn mn-btn--sm mn-btn--ghost lv-play__auto${autoSpeed.enabled ? " is-on" : ""}`}
        aria-pressed={autoSpeed.enabled}
        onClick={() => autoSpeed.onToggle(!autoSpeed.enabled)}
        title={t("Auto-velocidad: baja sola cuando pasa algo con tu equipo o en pista", "Auto speed: slows down by itself when something happens to your team or on track")}
      >
        {t("Auto", "Auto")}
      </button>
    )}
    {views && (
      <div className="lv-play__views">
        <Segmented label={t("Vista", "View")} value={views.value} onChange={views.onChange} options={views.options} />
      </div>
    )}
    {car && (
      <div className="lv-play__camera lv-play__car" role="group" aria-label={t("Coche", "Car")}>
        <button type="button" className="mn-icon-btn" onClick={() => car.onStep(-1)} aria-label={t("Coche anterior", "Previous car")} title={t("Coche anterior (por posición)", "Previous car (by position)")}>
          <IconChevronLeft size={16} />
        </button>
        <span data-car-label="">{car.label}</span>
        <button type="button" className="mn-icon-btn" onClick={() => car.onStep(1)} aria-label={t("Coche siguiente", "Next car")} title={t("Coche siguiente (por posición)", "Next car (by position)")}>
          <IconChevronRight size={16} />
        </button>
      </div>
    )}
    <div className="lv-play__camera" role="group" aria-label={t("Cámara", "Camera")}>
      <button type="button" className="mn-icon-btn" onClick={() => onCamera(-1)} aria-label={t("Cámara anterior", "Previous camera")} title={t("Cámara anterior", "Previous camera")}>
        <IconChevronLeft size={16} />
      </button>
      <span data-camera-label="">
        <IconCamera size={16} />
        {cameraLabel}
      </span>
      <button type="button" className="mn-icon-btn" onClick={() => onCamera(1)} aria-label={t("Cámara siguiente", "Next camera")} title={t("Cámara siguiente", "Next camera")}>
        <IconChevronRight size={16} />
      </button>
    </div>
    <span className="lv-play__spacer" />
    <div className="lv-play__skips">{children}</div>
  </div>
);

/**
 * The big speed label over the picture after a change (HUD-1): `callout` is
 * { key, speed, reason } from useAutoSpeed, `reasonText` what to say about the reason.
 */
export const SpeedCallout = ({ callout, reasonText = () => "" }) => {
  if (!callout) return null;
  const why = reasonText(callout.reason);
  return (
    <div className="lv-speedcall" role="status" key={callout.key}>
      <strong>×{callout.speed}</strong>
      {why && <span>{why}</span>}
    </div>
  );
};

/**
 * The engineer and the commentary. `entries` are { key, lap, kind: "radio"|"race", alert, text },
 * newest first.
 */
export const Feed = ({ entries, title = t("Radio y carrera", "Radio and race") }) => {
  const [filter, setFilter] = useState("all");
  const shown = filter === "all" ? entries : entries.filter((entry) => entry.kind === filter);
  return (
    <section className="lv-feed" aria-label={title}>
      <header className="lv-feed__head">
        <strong>{title}</strong>
        <Tabs
          label={t("Filtrar", "Filter")}
          value={filter}
          onChange={setFilter}
          options={[
            { value: "all", label: t("Todo", "All") },
            { value: "radio", label: t("Radio", "Radio") },
            { value: "race", label: t("Pista", "Track") },
          ]}
        />
      </header>
      <ol aria-live="polite">
        {shown.length === 0 && <li className="lv-feed__empty">{t("Nada todavía", "Nothing yet")}</li>}
        {shown.map((entry) => (
          <li key={entry.key} className={`${entry.kind === "radio" ? "is-radio" : ""}${entry.alert ? " is-alert" : ""}`}>
            <b>{entry.lap ? `${t("V", "L")}${entry.lap}` : ""}</b>
            <span>
              {entry.kind === "radio" && (
                <em>
                  <IconRadio size={14} />
                  {t("Radio", "Radio")}
                </em>
              )}
              {entry.text}
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
};

/** A level picked from a row of steps: `options` are { value, label }. */
export const Dots = ({ value, options, onChange, label }) => {
  const index = Math.max(0, options.findIndex((option) => option.value === value));
  return (
    <div className="lv-dots" role="radiogroup" aria-label={label}>
      {options.map((option, position) => (
        <button
          type="button"
          role="radio"
          key={option.value}
          aria-checked={option.value === value}
          aria-label={option.label}
          title={option.label}
          className={position <= index ? "is-on" : ""}
          onClick={() => onChange(option.value)}
        />
      ))}
      <small>{options[index]?.label}</small>
    </div>
  );
};

/**
 * HUD-3 (event-banners): the banner up now, top centre, one at a time (hudBanners.js queue).
 * `banner` is { key, kind, own, ... } or null; `names` id → name; `onReplay(banner)` (optional,
 * HUD-4) adds "watch the replay" when the replay buffer covers it. Words always, never a
 * colour alone (RNF-09); no animation with prefers-reduced-motion (playback.css).
 */
export const EventBanner = ({ banner, names = {}, onReplay = null }) => {
  if (!banner) return null;
  const words = bannerText(banner, names);
  return (
    <div className="lv-eventbanner" role="status" aria-live="polite" data-kind={banner.kind} data-own={banner.own ? "" : undefined} key={banner.key}>
      <strong>{words.title}</strong>
      {words.line && <span>{words.line}</span>}
      {onReplay && (
        <button type="button" className="mn-btn mn-btn--sm mn-btn--ghost" onClick={() => onReplay(banner)}>
          {t("Ver repetición", "Watch replay")}
        </button>
      )}
      <i className="lv-eventbanner__rule" aria-hidden="true" />
    </div>
  );
};

const seconds = (value) => (Number.isFinite(value) ? `${value.toFixed(1)} s` : "—");

/**
 * HUD-3 (pit-widget-and-dialog): the stop of each of your cars as it happens - time in the lane
 * from the entry line, time standing (in red, with its words), leaving, and the total frozen at
 * the exit line, with the position live. `entries` are { id, code, position, clock } where
 * `clock` is pitTimer.stepPitClock's state.
 */
export const PitTimer = ({ entries = [] }) => {
  if (!entries.length) return null;
  const stateWord = (state) =>
    ({
      lane: () => t("En el pit", "In the pit lane"),
      stationary: () => t("Parado", "Stationary"),
      leaving: () => t("Saliendo", "Leaving"),
      done: () => t("Total", "Total"),
    })[state]?.() ?? "";
  return (
    <div className="lv-pittimer" role="group" aria-label={t("Parada en boxes", "Pit stop")}>
      {entries.map(({ id, code, position, clock }) => (
        <div key={id} className="lv-pittimer__car" data-state={clock.state}>
          <b>
            P{position} · {code}
          </b>
          <span className="lv-pittimer__state">{stateWord(clock.state)}</span>
          <span className="lv-pittimer__lane" title={t("Tiempo en el pit lane", "Time in the pit lane")}>
            {seconds(clock.state === "done" ? clock.totalSec : clock.laneSec)}
          </span>
          {clock.stationarySec !== null && (
            <span className={`lv-pittimer__stop${clock.state === "stationary" ? " is-live" : ""}`} title={t("Tiempo parado", "Stationary time")}>
              {t("Parado", "Stopped")} {seconds(clock.stationarySec)}
              {clock.stage ? ` · ${stageWord(clock.stage)}` : ""}
            </span>
          )}
          {clock.estimate && (
            <span className="lv-pittimer__estimate" data-testid="pit-estimate" title={t("Estimación de línea a línea al pedir la parada", "Line-to-line estimate when the stop was called")}>
              {t("Estimado", "Estimate")} {seconds(clock.estimate.sec)}
              {clock.estimate.kind !== "green" ? ` (${clock.estimate.kind === "sc" ? t("con SC", "under SC") : t("con VSC", "under VSC")})` : ""}
              {Number.isFinite(clock.deltaSec) ? ` · ${clock.deltaSec >= 0 ? "+" : "−"}${Math.abs(clock.deltaSec).toFixed(1)} s` : ""}
            </span>
          )}
          {clock.steps && clock.steps.length > 0 && (
            <ol className="lv-pittimer__steps" aria-label={t("Fases de la parada", "Stop phases")}>
              {clock.steps.map((step) => (
                <li key={step.id} data-step={step.id} data-state={step.state} className={`is-${step.state}`}>
                  {pitStepWord(step.id)}
                  <span className="lv-sr"> · {pitStepStateWord(step.state)}</span>
                </li>
              ))}
            </ol>
          )}
        </div>
      ))}
    </div>
  );
};

/** HUD-C2: the words of a stop step and of its state (never colour alone, RNF-09). */
export const pitStepWord = (id) =>
  ({
    entry: () => t("Entrada", "Entry"),
    queue: () => t("En cola", "Queue"),
    stationary: () => t("Parado", "Stop"),
    release: () => t("Suelta", "Release"),
    exit: () => t("Salida", "Exit"),
  })[id]?.() ?? id;
const pitStepStateWord = (state) => ({ done: () => t("hecho", "done"), now: () => t("ahora", "now"), next: () => t("por venir", "to come") })[state]?.() ?? "";
const stageWord = (stage) =>
  ({
    marks: () => t("en sus marcas", "on the marks"),
    jackUp: () => t("elevar", "jack up"),
    wheels: () => t("ruedas", "wheels"),
    wing: () => t("alerón", "wing"),
    refuel: () => t("repostaje", "refuelling"),
    jackDown: () => t("bajar", "jack down"),
    release: () => t("suelta", "release"),
  })[stage]?.() ?? stage;

/** HUD-C2 (VIEW-16): the DRS zones the minimap draws - the circuit's, only when the era has DRS (rules.drs.enabled). */
export const miniMapDrsOf = (circuit, rules, hud = HUD_DATA) => {
  if (!hud.miniMap?.drs?.enabled || !rules?.drs?.enabled) return [];
  return Array.isArray(circuit?.drsZones) ? circuit.drsZones.filter((zone) => Number.isFinite(zone.from) && Number.isFinite(zone.to)) : [];
};

/**
 * HUD-C2 (VIEW-16 «minimapa ≤ 6 % del lienzo»): the share of a `viewport` {w, h} the minimap takes - in zones the
 * side block's map (hud.json layout.blocks.side widthPx × mapHeightPx), outside them the CSS width min(30 %,
 * miniMap.maxWidthPx) with the circuit's aspect (`aspect` = height / width, at most 1).
 */
/**
 * The minimap's width outside the zones for a view of `w × h` px and a circuit `aspect` (height / width of its box,
 * with the padding): min(30 % of the width, miniMap.maxWidthPx, the width whose area is maxCanvasShare of the view).
 */
export const miniMapWidthOf = ({ w, h }, aspect = 1, hud = HUD_DATA) => {
  if (!(w > 0 && h > 0)) return hud.miniMap.maxWidthPx;
  const byShare = Math.sqrt((hud.miniMap.maxCanvasShare * w * h) / Math.max(0.2, Math.min(1, aspect)));
  return Math.floor(Math.min(0.3 * w, hud.miniMap.maxWidthPx, byShare));
};

export const miniMapShareOf = ({ w, h }, { zoned = true, aspect = 1 } = {}, hud = HUD_DATA) => {
  if (!(w > 0 && h > 0)) return 0;
  if (zoned) {
    const side = hud.layout.blocks.side;
    return (side.widthPx * side.mapHeightPx) / (w * h);
  }
  const width = miniMapWidthOf({ w, h }, aspect, hud);
  return (width * width * Math.min(1, aspect)) / (w * h);
};

/**
 * HUD-C2 (VIEW-16): the minimap over the picture - the circuit, every car as a dot (the one you follow bigger, yours
 * outlined) and the DRS zones of the era (miniMapDrsOf) with the word on them (RNF-09). `rules` the race's rules.
 * Outside the zones (`zoned` false) its width is capped by miniMapWidthOf for the view's `box` {w, h}.
 */
export const HudMiniMap = ({ circuit, cars, focusId, label, rules = null, box: viewBox = null, zoned = false }) => {
  const { box } = circuit;
  const span = Math.max(box.maxX - box.minX, box.maxY - box.minY);
  const pad = span * 0.06;
  const loop = useMemo(() => pathOf(circuit.points), [circuit]);
  const drs = useMemo(() => miniMapDrsOf(circuit, rules), [circuit, rules]);
  const drsPaths = useMemo(() => drs.map((zone) => offsetSpan(circuit, zone.from, zone.to, 0)), [circuit, drs]);
  const aspect = (box.maxY - box.minY + pad * 2) / Math.max(1e-6, box.maxX - box.minX + pad * 2);
  const style = !zoned && viewBox && viewBox.w > 0 ? { width: `${miniMapWidthOf(viewBox, aspect)}px` } : undefined;
  return (
    <div className="lv-minimap" data-testid="hud-minimap" data-drs={drs.length} style={style}>
      <svg viewBox={`${box.minX - pad} ${box.minY - pad} ${box.maxX - box.minX + pad * 2} ${box.maxY - box.minY + pad * 2}`} role="img" aria-label={drs.length ? `${label} · ${t(`${drs.length} zonas DRS`, `${drs.length} DRS zones`)}` : label}>
        <path d={loop} className="lv-minimap__road" strokeWidth={span / 40} />
        {drsPaths.map((points, index) => (
          <g key={`drs-${index}`} className="lv-minimap__drs" data-drs-zone={index}>
            <path d={pathOf(points, false)} strokeWidth={span / 40} />
            {HUD_DATA.miniMap.drs.label && points.length > 0 && (
              <text x={points[Math.floor(points.length / 2)].x} y={points[Math.floor(points.length / 2)].y - span / 30} fontSize={span / 16} textAnchor="middle">
                DRS
              </text>
            )}
          </g>
        ))}
        {cars.map(({ car, pose }) =>
          pose.gone ? null : (
            <circle
              key={car.id}
              cx={pose.x}
              cy={pose.y}
              r={car.id === focusId ? span / 36 : car.isUser ? span / 48 : span / 70}
              fill={pose.parked ? "#5d6470" : car.color}
              stroke={car.id === focusId || car.isUser ? "#f2b705" : "#0b111b"}
              strokeWidth={span / 260}
            />
          ),
        )}
      </svg>
    </div>
  );
};

/** HUD-6: the words of a temperature against its window and of its trend (never a colour or an arrow alone, RNF-09). */
const TEMP_STATE_WORD = {
  cold: () => t("Fríos", "Cold"),
  lowEdge: () => t("Al borde frío", "Near cold edge"),
  window: () => t("En ventana", "In window"),
  highEdge: () => t("Al borde caliente", "Near hot edge"),
  overheating: () => t("Sobrecalentados", "Overheating"),
};
const TREND_WORD = {
  rising: () => t("subiendo", "rising"),
  falling: () => t("bajando", "falling"),
  steady: () => t("estable", "steady"),
};
const TREND_GLYPH = { rising: "↑", falling: "↓", steady: "→" };
const TONE_CLASS = { info: "is-info", warn: "is-warn", neg: "is-bad", pos: "is-good" };

/**
 * HUD-6 (driver-panel-units in °C, F1M24-GAMEPLAY §2.8): the engine's tyre temperature (§1.7 `tyreC`,
 * SIM-6) with its trend and, when race-tyres.json gives the compound's window, the warning against it.
 * `tyreC` { surface, carcass } in °C; `window` { lo, hi } or null; `verdict` from tyreTempHud.tyreTempVerdict
 * or null; `trend` { dir } or null; `showCarcass` from hud.json. The window and the trend go in words too.
 */
export const TyreTemp = ({ tyreC, window = null, verdict = null, trend = null, showCarcass = true }) => {
  if (!tyreC) return null;
  const round = (value) => Math.round(value);
  const stateWord = verdict ? TEMP_STATE_WORD[verdict.state]?.() : null;
  const trendWord = trend ? TREND_WORD[trend.dir]?.() : null;
  const windowWord = window ? t(`ventana ${round(window.lo)}–${round(window.hi)} °C`, `window ${round(window.lo)}–${round(window.hi)} °C`) : null;
  const label = [t(`Superficie ${round(tyreC.surface)} °C`, `Surface ${round(tyreC.surface)} °C`), trendWord, windowWord, stateWord].filter(Boolean).join(", ");
  return (
    <span className="lv-tyretemp" data-testid="tyre-temp" data-state={verdict ? verdict.state : "unjudged"} data-trend={trend ? trend.dir : "none"} title={label} aria-label={label}>
      <small className={verdict ? TONE_CLASS[verdict.tone] || "" : ""}>
        {round(tyreC.surface)} °C
        {trend && (
          <span className="lv-tyretemp__trend" aria-hidden="true">
            {" "}
            {TREND_GLYPH[trend.dir]}
          </span>
        )}
      </small>
      {showCarcass && Number.isFinite(tyreC.carcass) && (
        <small>
          {t("carcasa", "carcass")} {round(tyreC.carcass)} °C
        </small>
      )}
      {stateWord && <small className={TONE_CLASS[verdict.tone] || ""}>{stateWord}</small>}
    </span>
  );
};

/** Name tag content: position, flag, name, gap. */
export const DriverLabel = ({ position, nat, name, gap }) => (
  <span className="lv-label">
    <b>{position}</b>
    {nat && <Flag code={nat} width={16} />}
    <strong>{name}</strong>
    {gap && <em>{gap}</em>}
  </span>
);
