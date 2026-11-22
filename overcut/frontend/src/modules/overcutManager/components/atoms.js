/**
 * Small pieces every screen of the manager reuses. None of them knows about the
 * career; they draw what they are handed.
 */

import React, { useEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import { CarSide } from "./carShapes";
import { canRender3D } from "../three/support";

import { Link } from "react-router-dom";
import { sourceTictactoeImages } from "../../../helpers/sourceTictactoeImages";
import { inkOn } from "../engine/identity";
import { COMPOUND, COMPOUND_LETTER, t } from "./texts";
import { IconClose } from "./icons";

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
export const Livery = ({ color = "#f2b705", color2 = "#10294f", width = 120, year = 2024, name = "", height, teamRef = null }) => {
  const side = <CarSide year={year} color={color} color2={color2} width={width} />;
  if (!canRender3D()) return side;
  return (
    <React.Suspense fallback={side}>
      <Showroom year={year} color={color} color2={color2} name={name} height={height || Math.round(width * 0.62)} label={name} teamRef={teamRef} />
    </React.Suspense>
  );
};

// Same values as the --mn-tyre-* tokens in OvercutManager.css (DESIGN.md, "Data colours").
const TYRE_COLORS = { soft: "#e8463c", medium: "#f2c230", hard: "#ebe8df", inter: "#3fae4a", wet: "#3d8fe0", dry: "#9aa0a6" };

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

/**
 * The card every screen is built from. `meta` is a quiet line next to the
 * title (a count, a date); `flush` drops the body padding so a DataTable or a
 * picture can run to the edges.
 */
export const Panel = ({ title, action, children, className = "", meta, flush = false, as: Tag = "section", ...rest }) => (
  <Tag className={`mn-panel${flush ? " mn-panel--flush" : ""} ${className}`.trim()} {...rest}>
    {(title || action) && (
      <header className="mn-panel__head">
        {title && <h3>{title}</h3>}
        {meta !== undefined && <span className="mn-panel__meta">{meta}</span>}
        {action}
      </header>
    )}
    {children}
  </Tag>
);

/**
 * Layer for anything that floats over the whole page (sheets, moments). The
 * site's fixed header (z-index 1000) lives outside the manager, and the
 * manager's own tree sits in stacking contexts below it (every direct child of
 * `.mn-root` is one, at z-index 1), so a layer drawn inside a screen can never
 * rise above that header. `Layer` portals to <body> inside a fresh, fixed
 * `.mn-root` - so the design tokens apply - carrying the team colours of the
 * manager it was opened from. Inline styles beat the `.mn-root` rules.
 */
export const MN_LAYER_Z = 1200;
export const useLayerHost = (active) => {
  const anchor = useRef(null);
  const [host, setHost] = React.useState(null);
  React.useLayoutEffect(() => {
    if (!active || typeof document === "undefined") return;
    const root = anchor.current?.closest?.(".mn-root");
    const style = root ? window.getComputedStyle(root) : null;
    setHost({ node: document.body, team: style?.getPropertyValue("--team").trim() || null, team2: style?.getPropertyValue("--team2").trim() || null });
  }, [active]);
  return [anchor, host];
};
export const layerStyle = { position: "absolute", inset: 0 };
export const Layer = ({ host, children }) => {
  if (!host) return null;
  const style = { position: "fixed", inset: 0, zIndex: MN_LAYER_Z, minHeight: 0, background: "transparent", overflow: "visible" };
  if (host.team) style["--team"] = host.team;
  if (host.team2) style["--team2"] = host.team2;
  return createPortal(
    <div className="mn-root mn-layer-root" style={style}>
      {children}
    </div>,
    host.node,
  );
};

/** A modal sheet: a bottom sheet on phones, a centred card elsewhere. */
export const Sheet = ({ open, onClose, title, children, wide = false }) => {
  const ref = useRef(null);
  const [anchor, host] = useLayerHost(open);
  useEffect(() => {
    if (!open || !host) return undefined;
    const onKey = (event) => {
      if (event.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKey);
    ref.current?.focus?.();
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, host]);
  if (!open) return null;
  const layer = (
    <div className="mn-sheet-layer" style={layerStyle} role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose?.()}>
      <div className={`mn-sheet${wide ? " mn-sheet--wide" : ""}`} role="dialog" aria-modal="true" aria-label={title} tabIndex={-1} ref={ref}>
        <header className="mn-sheet__head">
          <h2>{title}</h2>
          {onClose && (
            <button type="button" className="mn-icon-btn" onClick={onClose} aria-label={t("Cerrar", "Close")}>
              <IconClose size={18} />
            </button>
          )}
        </header>
        <div className="mn-sheet__body">{children}</div>
      </div>
    </div>
  );
  return (
    <>
      <span ref={anchor} hidden />
      <Layer host={host}>{layer}</Layer>
    </>
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

/* ------------------------------------------------------------------------
 * Design-system primitives (DESIGN.md, "Component inventory"). New screens
 * build from these; the older atoms above stay for the screens not yet moved.
 * --------------------------------------------------------------------- */

const hexToRgb = (hex = "") => {
  const clean = String(hex).replace("#", "");
  const full = clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean.padEnd(6, "0").slice(0, 6);
  const value = parseInt(full, 16);
  return Number.isNaN(value) ? [128, 128, 128] : [(value >> 16) & 255, (value >> 8) & 255, value & 255];
};
const luminance = (rgb) => {
  const [r, g, b] = rgb.map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
export const contrastRatio = (a, b) => {
  const [hi, lo] = [luminance(hexToRgb(a)), luminance(hexToRgb(b))].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

/** The surface team colours are checked against: --mn-surface-1. */
export const SURFACE = "#131c2b";

/**
 * A team colour that can be seen on the dark surfaces (RNF-09): the team's own
 * colour when it reaches `min` contrast, otherwise the same hue lifted toward
 * white until it does. Use it for stripes, chart lines and text; never fill a
 * surface with the raw colour and put text on it without `inkOn`.
 */
export const readableOn = (hex, background = SURFACE, min = 3) => {
  if (!hex) return "#9aa4b5";
  const base = hexToRgb(hex);
  for (let step = 0; step <= 20; step += 1) {
    const mix = step / 20;
    const rgb = base.map((v) => Math.round(v + (255 - v) * mix));
    const out = `#${rgb.map((v) => v.toString(16).padStart(2, "0")).join("")}`;
    if (contrastRatio(out, background) >= min) return out;
  }
  return "#ffffff";
};

/** The team's colour as a thin vertical stripe, the mark of a team in every table. */
export const TeamStripe = ({ color, height = 16 }) => (
  <span className="mn-team-stripe" style={{ "--stripe": readableOn(color), height }} aria-hidden="true" />
);

/** The title row of a screen: what it is, a quiet line of context, the screen's actions. */
export const PageHeader = ({ title, meta, actions, children }) => (
  <header className="mn-page-head">
    <div className="mn-page-head__text">
      <h1>{title}</h1>
      {meta && <p>{meta}</p>}
    </div>
    {actions && <div className="mn-page-head__actions">{actions}</div>}
    {children}
  </header>
);

/**
 * A number that matters: label, figure, and what it is compared with.
 * `trend` is "up" | "down" | undefined and only colours the delta.
 */
export const StatTile = ({ label, value, unit, delta, trend, hint, accent = false, onClick }) => {
  const Tag = onClick ? "button" : "div";
  return (
    <Tag type={onClick ? "button" : undefined} className={`mn-tile${accent ? " is-accent" : ""}${onClick ? " is-link" : ""}`} onClick={onClick}>
      <span className="mn-tile__label">{label}</span>
      <span className="mn-tile__value">
        {value}
        {unit && <small>{unit}</small>}
      </span>
      {(delta !== undefined || hint) && (
        <span className="mn-tile__foot">
          {delta !== undefined && <b className={trend ? `is-${trend}` : ""}>{delta}</b>}
          {hint && <span>{hint}</span>}
        </span>
      )}
    </Tag>
  );
};

/** Nothing to show yet, said plainly, with the one thing to do about it. */
export const EmptyState = ({ title, body, action, compact = false }) => (
  <div className={`mn-empty-state${compact ? " is-compact" : ""}`}>
    <strong>{title}</strong>
    {body && <p>{body}</p>}
    {action}
  </div>
);

/**
 * The timing-screen table (DESIGN.md, "Data tables").
 * columns: [{ key, label, align: "left"|"right"|"center", width, mono, render(row, index), className }]
 * `highlight(row)` marks the player's rows; `onRowClick` makes rows reachable by keyboard too.
 */
export const DataTable = ({ columns, rows, rowKey = (row, index) => row.id ?? index, highlight, onRowClick, empty, caption, dense = false, className = "" }) => {
  if (!rows?.length) return <EmptyState title={empty || t("Sin datos", "No data")} compact />;
  const activate = (event, row) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    onRowClick(row);
  };
  return (
    <div className={`mn-dt-wrap ${className}`.trim()}>
      <table className={`mn-dt${dense ? " mn-dt--dense" : ""}`}>
        {caption && <caption className="mn-sr">{caption}</caption>}
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key} scope="col" className={`is-${column.align || "left"}${column.className ? ` ${column.className}` : ""}`} style={column.width ? { width: column.width } : undefined}>
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => {
            const classes = [highlight?.(row) && "is-own", onRowClick && "is-link"].filter(Boolean).join(" ");
            return (
              <tr
                key={rowKey(row, index)}
                className={classes || undefined}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                onKeyDown={onRowClick ? (event) => activate(event, row) : undefined}
                tabIndex={onRowClick ? 0 : undefined}
              >
                {columns.map((column) => (
                  <td key={column.key} className={`is-${column.align || "left"}${column.mono ? " is-mono" : ""}${column.className ? ` ${column.className}` : ""}`}>
                    {column.render ? column.render(row, index) : row[column.key]}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

/** Tabs that switch a view in place. options: [{ value, label, count }] */
export const Tabs = ({ options, value, onChange, label }) => (
  <div className="mn-tabs" role="tablist" aria-label={label}>
    {options.map((option) => (
      <button type="button" key={option.value} role="tab" aria-selected={value === option.value} className={value === option.value ? "is-active" : ""} onClick={() => onChange(option.value)} disabled={option.disabled}>
        {option.label}
        {option.count !== undefined && <span className="mn-tabs__count">{option.count}</span>}
      </button>
    ))}
  </div>
);

/** A square button holding one icon; `label` is required, it is the accessible name. */
export const IconButton = ({ icon: Icon, label, onClick, active = false, className = "", size = 18, ...rest }) => (
  <button type="button" className={`mn-icon-btn${active ? " is-on" : ""} ${className}`.trim()} onClick={onClick} aria-label={label} title={label} {...rest}>
    <Icon size={size} />
  </button>
);

/** Quiet text label for a state. tone: neutral | accent | pos | neg | warn | info */
export const Badge = ({ tone = "neutral", children, dot = false }) => (
  <span className={`mn-tag2 mn-tag2--${tone}`}>
    {dot && <i aria-hidden="true" />}
    {children}
  </span>
);

/** A keycap for a shortcut. */
export const Kbd = ({ children }) => <kbd className="mn-kbd">{children}</kbd>;

/** A thin 0..100 meter whose tone follows the value unless one is given. */
export const Meter = ({ value, tone, label, width }) => {
  const clamped = Math.max(0, Math.min(100, value));
  const auto = tone || (clamped < 30 ? "neg" : clamped < 50 ? "warn" : "pos");
  return (
    <span className={`mn-meter2 is-${auto}`} style={width ? { width } : undefined} role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(clamped)} aria-label={label}>
      <i style={{ width: `${clamped}%` }} />
    </span>
  );
};
