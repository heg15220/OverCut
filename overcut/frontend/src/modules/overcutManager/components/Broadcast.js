/**
 * The furniture shared by practice, qualifying and the race (DESIGN.md §6.5,
 * "Live session"): the pit wall's own monitors, not a TV clone.
 *
 *   TimingTower   left column: session and lap or clock, the order with a team
 *                 stripe and a three-letter code, your drivers in gold, cars in
 *                 the pits, the fastest lap in purple, the knockout cut, and an
 *                 arrow for three seconds when a car gains or loses a place
 *                 (§5.5). On phones it folds to the five rows around your car.
 *   StatusStrip   over the picture: the flag state (colour and words, never
 *                 colour alone) and the conditions - clock, air, track, rain,
 *                 rubber and grip.
 *   PlaybackBar   under the picture: play, speed (RF-CMD-04), camera
 *                 (RF-3D-04) and the skips the session allows.
 *   Feed          the engineer on the radio and the commentary (RF-CMD-03),
 *                 filterable.
 *   Dots          a level picked from a row of steps - pace, mixture, battery.
 */

import React, { useRef, useState } from "react";
import { Flag, Segmented, Tabs, readableOn } from "./atoms";
import { IconArrowDown, IconArrowUp, IconChevronLeft, IconChevronRight, IconPlay, IconRadio } from "./icons";
import { IconCamera, IconCloud, IconDroplet, IconPause, IconRain, IconSun, IconThermometer, IconTimer } from "./icons";
import { t } from "./texts";
import "./styles/weekend.css";

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

/**
 * The tower. `rows` are { id, position, code, color, value, flags: { user, out, pit, eliminated,
 * fastest, focus, battle, danger } }; `modes` is { options, value, onChange } or null.
 */
export const TimingTower = ({ title, subtitle, modes, rows, onPick, label }) => {
  const [collapsed, setCollapsed] = useState(true);
  const moves = useMoves(rows);
  const userIndex = rows.findIndex((row) => row.flags?.user);
  const anchor = userIndex < 0 ? 0 : userIndex;
  const firstCut = rows.findIndex((row) => row.flags?.danger || row.flags?.eliminated);
  return (
    <section className={`lv-tower${collapsed ? " is-collapsed" : ""}`} aria-label={label}>
      <header className="lv-tower__head">
        <strong>{title}</strong>
        {subtitle && <span className="lv-tower__sub">{subtitle}</span>}
      </header>
      {modes && (
        <div className="lv-tower__modes">
          <Segmented label={t("Dato de la torre", "Tower data")} value={modes.value} onChange={modes.onChange} options={modes.options} />
        </div>
      )}
      <ol className="lv-tower__rows" aria-label={label}>
        {rows.map((row, index) => {
          const f = row.flags || {};
          const move = moves[row.id];
          const far = Math.abs(index - anchor) > 2 && index > 2;
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
              </span>
              <span className={`lv-row__value${typeof row.value === "string" && /^\p{L}/u.test(row.value) ? " is-text" : ""}`}>{row.value}</span>
              <span className="lv-row__mark">{f.fastest ? <IconTimer size={14} title={t("Vuelta rápida", "Fastest lap")} /> : null}</span>
            </li>
          );
        })}
      </ol>
      {rows.length > 5 && (
        <div className="lv-tower__more">
          <button type="button" className="mn-link" onClick={() => setCollapsed((value) => !value)}>
            {collapsed ? t(`Ver los ${rows.length}`, `Show all ${rows.length}`) : t("Ver solo mi zona", "Show my part only")}
          </button>
        </div>
      )}
    </section>
  );
};

const rubberLabel = (level) => (level < 0.2 ? t("Muy poca", "Very low") : level < 0.45 ? t("Poca", "Low") : level < 0.75 ? t("Media", "Medium") : t("Mucha", "High"));
const gripLabel = (wet, rubber) => (wet > 0.55 ? t("Muy bajo", "Very low") : wet > 0.2 ? t("Bajo", "Low") : rubber > 0.6 ? t("Alto", "High") : t("Normal", "Normal"));

/**
 * The strip over the picture. `flag` is { kind: green|yellow|sc|vsc|red|chequered|session, label }.
 */
export const StatusStrip = ({ flag, clock, airTemp, rainChance, change, trackTemp, wetness = 0, rubber = 0, notes = null }) => (
  <div className="lv-status" data-flag={flag.kind} role="status" aria-label={t("Estado de la pista", "Track status")}>
    <div className="lv-status__top">
      <span className="lv-status__flag">
        <i aria-hidden="true" />
        {flag.label}
      </span>
      <span className="lv-status__clock">{clock}</span>
    </div>
    <dl className="lv-status__grid">
      <div title={t("Aire", "Air")}>
        <dt>
          {wetness > 0.2 ? <IconRain size={16} /> : rainChance > 30 ? <IconCloud size={16} /> : <IconSun size={16} />}
          {t("Aire", "Air")}
        </dt>
        <dd>{airTemp.toFixed(0)} °C</dd>
      </div>
      <div>
        <dt>
          <IconThermometer size={16} />
          {t("Pista", "Track")}
        </dt>
        <dd>{trackTemp.toFixed(0)} °C</dd>
      </div>
      <div className={wetness > 0.05 ? "is-wet" : ""}>
        <dt>
          <IconDroplet size={16} />
          {wetness > 0.05 ? t("Agua", "Water") : t("Lluvia", "Rain")}
        </dt>
        <dd>{wetness > 0.05 ? `${(wetness * 3).toFixed(1)} mm` : `${rainChance}%`}</dd>
      </div>
      <div>
        <dt>{t("Goma", "Rubber")}</dt>
        <dd>{rubberLabel(rubber)}</dd>
      </div>
      <div>
        <dt>{t("Agarre", "Grip")}</dt>
        <dd>{gripLabel(wetness, rubber)}</dd>
      </div>
    </dl>
    {(change || notes) && <p className="lv-status__note">{[change, notes].filter(Boolean).join(" · ")}</p>}
  </div>
);

/**
 * Play, speed and camera - the bar under the picture. `speeds` are numbers; `children`
 * are the skips and calls the session allows.
 */
export const PlaybackBar = ({ playing, onPlay, speeds, speed, onSpeed, speedText = (value) => `×${value}`, cameraLabel, onCamera, children, disabled }) => (
  <div className="lv-play">
    <button type="button" className="mn-icon-btn lv-play__toggle" onClick={onPlay} aria-label={playing ? t("Pausa", "Pause") : t("Seguir", "Play")} title={playing ? t("Pausa", "Pause") : t("Seguir", "Play")} disabled={disabled}>
      {playing ? <IconPause size={18} /> : <IconPlay size={18} />}
    </button>
    <Segmented label={t("Velocidad", "Speed")} value={speed} onChange={onSpeed} options={speeds.map((value) => ({ value, label: speedText(value) }))} />
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

/** Name tag content: position, flag, name, gap. */
export const DriverLabel = ({ position, nat, name, gap }) => (
  <span className="lv-label">
    <b>{position}</b>
    {nat && <Flag code={nat} width={16} />}
    <strong>{name}</strong>
    {gap && <em>{gap}</em>}
  </span>
);
