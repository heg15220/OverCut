/**
 * Small pieces every screen of the manager reuses. None of them knows about the
 * career; they draw what they are handed.
 */

import React, { useEffect, useMemo, useRef } from "react";
import { CarSide } from "./carShapes";
import { canRender3D } from "../three/support";

import { Link } from "react-router-dom";
import { LuX } from "react-icons/lu";
import { sourceTictactoeImages } from "../../../helpers/sourceTictactoeImages";
import { inkOn } from "../engine/identity";
import { COMPOUND, COMPOUND_LETTER, t } from "./texts";

// The 3D showroom brings three.js with it, so it is fetched only where it is shown.
const Showroom = React.lazy(() => import("../three/Showroom"));

const logoFor = (name) => {
  if (!name) return null;
  try {
    const keys = sourceTictactoeImages.keys();
    const normalised = name.replace(/ /g, "_");
    const found = [".png", ".svg", ".jpg"].map((extension) => `./${normalised}${extension}`).find((path) => keys.includes(path));
    return found ? sourceTictactoeImages(found) : null;
  } catch {
    return null;
  }
};

/**
 * A team's badge: the real logo when OverCut has one, otherwise the team's
 * colours and its three letters - which is also what a team you built wears.
 */
export const TeamBadge = ({ team, size = 32 }) => {
  const logo = useMemo(() => (team?.custom ? null : logoFor(team?.name)), [team?.name, team?.custom]);
  if (!team) return <span className="mn-badge" style={{ width: size, height: size }} />;
  if (logo) {
    return (
      <span className="mn-badge mn-badge--logo" style={{ width: size, height: size, "--team": team.color }}>
        <img src={logo} alt="" aria-hidden="true" />
      </span>
    );
  }
  return (
    <span
      className="mn-badge mn-badge--letters"
      style={{ width: size, height: size, background: `linear-gradient(135deg, ${team.color} 0 58%, ${team.color2 || team.color} 58% 100%)`, color: inkOn(team.color), fontSize: Math.max(9, size * 0.32) }}
      aria-hidden="true"
    >
      {team.short}
    </span>
  );
};

export const Flag = ({ code, width = 18, title }) =>
  code ? <img className="mn-flag" style={{ width }} src={`https://flagcdn.com/w40/${code === "eu" ? "eu" : code}.png`} alt={title || ""} loading="lazy" /> : <span className="mn-flag mn-flag--empty" style={{ width }} aria-hidden="true" />;

/** A side view of a Formula 1 car in a team's colours, drawn rather than pictured. */
/**
 * The car in the team's colours, as the cars of that era looked: a 3D model on
 * a turntable where the browser can draw one, the side view otherwise.
 */
export const Livery = ({ color = "#f2b705", color2 = "#10294f", width = 120, year = 2024, name = "", height }) => {
  const side = <CarSide year={year} color={color} color2={color2} width={width} />;
  if (!canRender3D()) return side;
  return (
    <React.Suspense fallback={side}>
      <Showroom year={year} color={color} color2={color2} name={name} height={height || Math.round(width * 0.62)} label={name} />
    </React.Suspense>
  );
};

const TYRE_COLORS = { soft: "#e10600", medium: "#ffd400", hard: "#f3f1e9", inter: "#43b02a", wet: "#2f8fdd", dry: "#9aa0a6" };

export const Tyre = ({ compound, age, size = 22 }) => (
  <span className="mn-tyre" style={{ width: size, height: size, "--tyre": TYRE_COLORS[compound] || "#9aa0a6", fontSize: size * 0.42 }} title={COMPOUND[compound] ? COMPOUND[compound]() : compound}>
    {COMPOUND_LETTER[compound] || "?"}
    {age !== undefined && <small>{age}</small>}
  </span>
);

/** A 0..100 bar. `marker` draws a second value as a tick, e.g. the field's best. */
export const Bar = ({ value, max = 100, min = 0, marker, tone = "gold", label, caption }) => {
  const share = (v) => `${Math.max(0, Math.min(100, ((v - min) / (max - min)) * 100))}%`;
  return (
    <div className="mn-bar">
      {(label || caption) && (
        <div className="mn-bar__head">
          {label && <span>{label}</span>}
          {caption !== undefined && <b>{caption}</b>}
        </div>
      )}
      <div className={`mn-bar__track mn-bar__track--${tone}`}>
        <i style={{ width: share(value) }} />
        {marker !== undefined && <em style={{ left: share(marker) }} />}
      </div>
    </div>
  );
};

export const Stat = ({ label, value, hint, accent = false }) => (
  <div className={`mn-stat${accent ? " is-accent" : ""}`}>
    <span className="mn-stat__label">{label}</span>
    <strong className="mn-stat__value">{value}</strong>
    {hint && <small className="mn-stat__hint">{hint}</small>}
  </div>
);

export const Rating = ({ value, size = "md" }) => {
  const rounded = Math.round(value);
  const tone = rounded >= 88 ? "elite" : rounded >= 78 ? "good" : rounded >= 66 ? "mid" : "low";
  return <span className={`mn-rating mn-rating--${tone} mn-rating--${size}`}>{rounded}</span>;
};

export const Pill = ({ tone = "muted", children }) => <span className={`mn-pill mn-pill--${tone}`}>{children}</span>;

export const Panel = ({ title, action, children, className = "" }) => (
  <section className={`mn-panel ${className}`}>
    {(title || action) && (
      <header className="mn-panel__head">
        {title && <h3>{title}</h3>}
        {action}
      </header>
    )}
    {children}
  </section>
);

/** A modal sheet: a bottom sheet on phones, a centred card elsewhere. */
export const Sheet = ({ open, onClose, title, children, wide = false }) => {
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event) => {
      if (event.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKey);
    ref.current?.focus?.();
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="mn-sheet-layer" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose?.()}>
      <div className={`mn-sheet${wide ? " mn-sheet--wide" : ""}`} role="dialog" aria-modal="true" aria-label={title} tabIndex={-1} ref={ref}>
        <header className="mn-sheet__head">
          <h2>{title}</h2>
          {onClose && (
            <button type="button" className="mn-icon-btn" onClick={onClose} aria-label={t("Cerrar", "Close")}>
              <LuX />
            </button>
          )}
        </header>
        <div className="mn-sheet__body">{children}</div>
      </div>
    </div>
  );
};

export const Segmented = ({ options, value, onChange, label }) => (
  <div className="mn-seg" role="radiogroup" aria-label={label}>
    {options.map((option) => (
      <button type="button" key={option.value} role="radio" aria-checked={value === option.value} className={value === option.value ? "is-active" : ""} onClick={() => onChange(option.value)} disabled={option.disabled}>
        {option.label}
      </button>
    ))}
  </div>
);

export const Empty = ({ children }) => <p className="mn-empty">{children}</p>;

export const ManagerBackLink = ({ to, children }) => (
  <Link className="mn-back" to={to}>
    {children}
  </Link>
);
