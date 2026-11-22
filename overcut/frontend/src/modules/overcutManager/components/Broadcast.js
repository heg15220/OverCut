/**
 * The broadcast furniture shared by practice, qualifying and the race - the
 * way a modern F1 game frames a session: the picture fills the screen and the
 * data sits on it.
 *
 *   TimingTower      top left: session and lap or clock, the order with team
 *                    colour bars, your drivers lit, cars in the pits, the
 *                    fastest lap in purple, the knockout zone in red.
 *   ConditionsPanel  top right: time of day, air and track, rain, rubber and
 *                    grip, and the circuit with the cars on it.
 *   PlaybackBar      bottom centre: play, speed and camera, each stepped with
 *                    arrows.
 *   Dots             a level picked by tapping one of a row of dots - pace,
 *                    mixture, battery.
 */

import React from "react";
import { LuChevronLeft, LuChevronRight, LuCloudRain, LuCloudSun, LuDroplets, LuPause, LuPlay, LuSun, LuThermometer, LuTimer, LuVideo } from "react-icons/lu";
import { Flag } from "./atoms";
import { t } from "./texts";

/** The tower. `rows` are { id, position, code, color, value, nat, flags: { user, out, pit, eliminated, fastest, focus, battle, danger } }. */
export const TimingTower = ({ title, subtitle, modeLabel, onMode, rows, onPick, label }) => (
  <section className="bc-tower" aria-label={label}>
    <header className="bc-tower__head">
      <strong>OVERCUT</strong>
      <span>{title}</span>
    </header>
    {subtitle && <div className="bc-tower__sub">{subtitle}</div>}
    {modeLabel && (
      <div className="bc-tower__mode">
        <button type="button" onClick={() => onMode(-1)} aria-label={t("Modo anterior", "Previous mode")}>
          <LuChevronLeft />
        </button>
        <span>{modeLabel}</span>
        <button type="button" onClick={() => onMode(1)} aria-label={t("Modo siguiente", "Next mode")}>
          <LuChevronRight />
        </button>
      </div>
    )}
    <ol className="bc-tower__rows" aria-label={label}>
      {rows.map((row) => {
        const f = row.flags || {};
        return (
          <li
            key={row.id}
            className={`${f.user ? " is-user" : ""}${f.out ? " is-out" : ""}${f.pit ? " is-pit" : ""}${f.eliminated ? " is-eliminated" : ""}${f.danger ? " is-danger" : ""}${f.focus ? " is-focus" : ""}${f.battle ? " is-battle" : ""}`}
            style={{ "--team": row.color }}
            onClick={() => onPick?.(row.id)}
          >
            <b>{row.position}</b>
            <i className="bc-tower__bar" />
            <span className="bc-tower__code">{row.code}</span>
            <span className="bc-tower__value">{row.value}</span>
            {f.fastest && <em className="bc-tower__fastest" title={t("Vuelta rápida", "Fastest lap")}><LuTimer aria-hidden="true" /></em>}
            {row.extra}
          </li>
        );
      })}
    </ol>
  </section>
);

const rubberLabel = (level) => (level < 0.2 ? t("Muy bajo", "Very low") : level < 0.45 ? t("Bajo", "Low") : level < 0.75 ? t("Medio", "Medium") : t("Alto", "High"));
const gripLabel = (wet, rubber) => (wet > 0.55 ? t("Muy bajo", "Very low") : wet > 0.2 ? t("Bajo", "Low") : rubber > 0.6 ? t("Alto", "High") : t("Normal", "Normal"));

/** Conditions: clock, air, rain, the track, and the circuit map underneath. */
export const ConditionsPanel = ({ title, clock, airTemp, rainChance, change, trackTemp, wetness = 0, rubber = 0, children }) => (
  <section className="bc-conditions" aria-label={t("Condiciones", "Conditions")}>
    <header>{title}</header>
    <div className="bc-conditions__row">
      <strong>{clock}</strong>
      <span>
        {wetness > 0.2 ? <LuCloudRain aria-hidden="true" /> : rainChance > 30 ? <LuCloudSun aria-hidden="true" /> : <LuSun aria-hidden="true" />} {airTemp.toFixed(1)} °C
      </span>
    </div>
    <div className="bc-conditions__row">
      <span>{change}</span>
      <span>
        <LuDroplets aria-hidden="true" /> {rainChance}%
      </span>
    </div>
    <div className="bc-conditions__track">
      <div>
        <strong>{t("Pista", "Track")}</strong>
        <span>
          <LuThermometer aria-hidden="true" /> {trackTemp.toFixed(1)} °C
        </span>
      </div>
      <div>
        <span>{wetness > 0.05 ? t("Lluvia", "Rainfall") : t("Seca", "Dry")}</span>
        <b className={wetness > 0.05 ? "is-wet" : ""}>{(wetness * 3).toFixed(2)} mm</b>
      </div>
      <div>
        <span>{t("Caucho", "Rubber")}</span>
        <b className={rubber < 0.45 ? "is-low" : "is-good"}>{rubberLabel(rubber)}</b>
      </div>
      <div>
        <span>{t("Agarre", "Grip")}</span>
        <b className={wetness > 0.2 ? "is-low" : "is-good"}>{gripLabel(wetness, rubber)}</b>
      </div>
    </div>
    {children && <div className="bc-conditions__map">{children}</div>}
  </section>
);

/** Play, speed and camera - the bar under the picture. */
export const PlaybackBar = ({ playing, onPlay, speedLabel, onSpeed, cameraLabel, onCamera, children, disabled }) => (
  <div className="bc-playback">
    <button type="button" className="bc-playback__btn" onClick={onPlay} aria-label={playing ? t("Pausa", "Pause") : t("Seguir", "Play")} disabled={disabled}>
      {playing ? <LuPause /> : <LuPlay />}
    </button>
    <div className="bc-playback__step" role="group" aria-label={t("Velocidad", "Speed")}>
      <button type="button" onClick={() => onSpeed(-1)} aria-label={t("Más lento", "Slower")}>
        <LuChevronLeft />
      </button>
      <span>{speedLabel}</span>
      <button type="button" onClick={() => onSpeed(1)} aria-label={t("Más rápido", "Faster")}>
        <LuChevronRight />
      </button>
    </div>
    <div className="bc-playback__step is-camera" role="group" aria-label={t("Cámara", "Camera")}>
      <button type="button" onClick={() => onCamera(-1)} aria-label={t("Cámara anterior", "Previous camera")}>
        <LuChevronLeft />
      </button>
      <span>
        <LuVideo aria-hidden="true" /> {cameraLabel}
      </span>
      <button type="button" onClick={() => onCamera(1)} aria-label={t("Cámara siguiente", "Next camera")}>
        <LuChevronRight />
      </button>
    </div>
    {children}
  </div>
);

/** A level picked from a row of dots: `options` are { value, label }. */
export const Dots = ({ value, options, onChange, label, tone = "gold" }) => {
  const index = Math.max(0, options.findIndex((option) => option.value === value));
  return (
    <div className={`bc-dots bc-dots--${tone}`} role="radiogroup" aria-label={label}>
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

/** Name tag content used by the 2D stage and the 3D tags: position, flag, name, gap. */
export const DriverLabel = ({ position, nat, name, gap }) => (
  <span className="bc-label">
    <b>{position}</b>
    {nat && <Flag code={nat} width={16} />}
    <strong>{name}</strong>
    {gap && <em>{gap}</em>}
  </span>
);
