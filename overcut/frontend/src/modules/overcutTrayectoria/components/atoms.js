/**
 * The small pieces every screen reuses: a team badge, a flag, a helmet, a stat
 * tile, a meter. Nothing here holds state or knows about the career.
 */

import React, { useMemo } from "react";
import { sourceTictactoeImages } from "../../../helpers/sourceTictactoeImages";

/**
 * Team badge, resolved from the shared tictactoe logo folder.
 *
 * The folder keys are the team name with underscores and any of three
 * extensions, so a team with no badge simply renders its initials instead of a
 * broken image - which happens a lot in the 1950s.
 */
export const TeamLogo = ({ teamName, size = 34 }) => {
  const source = useMemo(() => {
    if (!teamName) return null;
    const normalised = teamName.replace(/ /g, "_");
    const keys = sourceTictactoeImages.keys();
    const found = [".png", ".svg", ".jpg"]
      .map((extension) => `./${normalised}${extension}`)
      .find((path) => keys.includes(path));
    return found ? sourceTictactoeImages(found) : null;
  }, [teamName]);

  if (!source) {
    return (
      <span className="tr-badge tr-badge--letters" style={{ width: size, height: size }}>
        {initialsOf(teamName)}
      </span>
    );
  }

  return (
    <span className="tr-badge" style={{ width: size, height: size }}>
      <img src={source} alt="" aria-hidden="true" />
    </span>
  );
};

const initialsOf = (name = "") =>
  name
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0] || "")
    .join("")
    .toUpperCase();

/** Country flag. `code` is the ISO-3166 alpha-2 the bootstrap resolves per race. */
export const Flag = ({ code, title, width = 21 }) => {
  if (!code) return <span className="tr-flag tr-flag--empty" style={{ width }} aria-hidden="true" />;
  return (
    <img
      className="tr-flag"
      style={{ width }}
      src={`https://flagcdn.com/w40/${code}.png`}
      alt={title || ""}
      loading="lazy"
    />
  );
};

/** The player's helmet, drawn rather than fetched so it can be recoloured live. */
export const Helmet = ({ primary = "#F2B705", secondary = "#10294F", style = "solid", size = 56 }) => (
  <svg className="tr-helmet" width={size} height={size} viewBox="0 0 64 64" role="img" aria-hidden="true">
    <defs>
      <linearGradient id={`tr-helmet-${style}`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor={primary} />
        <stop offset="52%" stopColor={primary} />
        <stop offset="52%" stopColor={secondary} />
        <stop offset="100%" stopColor={secondary} />
      </linearGradient>
    </defs>
    <path
      d="M32 6c14 0 22 9 22 22 0 6-1 10-3 14H35l-2-7H16c-6 0-10-5-10-13C6 15 17 6 32 6Z"
      fill={style === "solid" ? primary : `url(#tr-helmet-${style})`}
    />
    {style === "lines" && (
      <>
        <rect x="8" y="24" width="46" height="4" fill={secondary} />
        <rect x="8" y="32" width="46" height="3" fill={secondary} opacity="0.7" />
      </>
    )}
    <path d="M16 24h20l3 12H18c-4 0-6-3-6-7s2-5 4-5Z" fill="#0A0A0C" opacity="0.82" />
    <path d="M32 6c14 0 22 9 22 22 0 6-1 10-3 14H35l-2-7H16c-6 0-10-5-10-13C6 15 17 6 32 6Z" fill="none" stroke="#0A0A0C" strokeWidth="2" />
  </svg>
);

/** One number with its label. The season summary is a grid of these. */
export const StatTile = ({ label, value, accent = false, hint, icon: Icon }) => (
  <div className={`tr-stat${accent ? " tr-stat--accent" : ""}`}>
    <span className="tr-stat__value">{value}</span>
    <span className="tr-stat__label">
      {Icon && <Icon />}
      {label}
    </span>
    {hint && <span className="tr-stat__hint">{hint}</span>}
  </div>
);

/** A 0..100 bar. Used for team trust and for standing in the garage. */
export const Meter = ({ value, label, caption }) => (
  <div className="tr-meter">
    <div className="tr-meter__head">
      <span>{label}</span>
      {caption && <strong>{caption}</strong>}
    </div>
    <div className="tr-meter__track">
      <div className="tr-meter__fill" style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  </div>
);

/**
 * Car strength, shown as rank rather than as the raw rating.
 *
 * A player should never be reading a 74.3 off the screen; they should be reading
 * "fourth best car on the grid", which is the thing that actually decides their
 * season.
 */
export const CarRankBar = ({ rank, total, label }) => {
  const share = total > 1 ? 1 - (rank - 1) / (total - 1) : 1;
  return (
    <div className="tr-carrank">
      <span className="tr-carrank__label">{label}</span>
      <span className="tr-carrank__track">
        <span className="tr-carrank__fill" style={{ width: `${Math.round(share * 100)}%` }} />
      </span>
      <span className="tr-carrank__value">
        {rank}
        <em>/{total}</em>
      </span>
    </div>
  );
};

export const NATIONALITIES = [
  { code: "es", es: "España", en: "Spain" },
  { code: "gb", es: "Reino Unido", en: "United Kingdom" },
  { code: "it", es: "Italia", en: "Italy" },
  { code: "de", es: "Alemania", en: "Germany" },
  { code: "fr", es: "Francia", en: "France" },
  { code: "br", es: "Brasil", en: "Brazil" },
  { code: "ar", es: "Argentina", en: "Argentina" },
  { code: "mx", es: "México", en: "Mexico" },
  { code: "nl", es: "Países Bajos", en: "Netherlands" },
  { code: "be", es: "Bélgica", en: "Belgium" },
  { code: "at", es: "Austria", en: "Austria" },
  { code: "ch", es: "Suiza", en: "Switzerland" },
  { code: "fi", es: "Finlandia", en: "Finland" },
  { code: "se", es: "Suecia", en: "Sweden" },
  { code: "au", es: "Australia", en: "Australia" },
  { code: "us", es: "Estados Unidos", en: "United States" },
  { code: "ca", es: "Canadá", en: "Canada" },
  { code: "jp", es: "Japón", en: "Japan" },
  { code: "pt", es: "Portugal", en: "Portugal" },
  { code: "co", es: "Colombia", en: "Colombia" },
  { code: "pl", es: "Polonia", en: "Poland" },
  { code: "dk", es: "Dinamarca", en: "Denmark" },
  { code: "th", es: "Tailandia", en: "Thailand" },
  { code: "nz", es: "Nueva Zelanda", en: "New Zealand" },
  { code: "za", es: "Sudáfrica", en: "South Africa" },
  { code: "mc", es: "Mónaco", en: "Monaco" },
];

export const HELMET_PRESETS = [
  { primary: "#F2B705", secondary: "#10294F", style: "solid" },
  { primary: "#10294F", secondary: "#F3F1E9", style: "gradient" },
  { primary: "#C42B2B", secondary: "#0A0A0C", style: "lines" },
  { primary: "#F3F1E9", secondary: "#0A0A0C", style: "gradient" },
  { primary: "#1F7A5A", secondary: "#F2B705", style: "lines" },
  { primary: "#5B2E8C", secondary: "#FFCE3A", style: "gradient" },
];
