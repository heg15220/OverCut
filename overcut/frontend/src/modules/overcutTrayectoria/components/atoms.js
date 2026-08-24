/**
 * The small pieces every screen reuses: a team badge, a flag, a helmet, a stat
 * tile, a meter. Nothing here holds state or knows about the career.
 */

import React, { useMemo } from "react";
import racingHelmetUrl from "../../../assets/images/miniGames/RacingHelmet.png";
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

/* --------------------------------------------------------------- the helmet
 *
 * The same helmet the older career mode wears - `RacingHelmet.png`, the full
 * face silhouette, used as a mask - so a driver looks like the same driver in
 * both games. The picture is only the shape; the paint is a CSS background
 * behind it, which is what lets the editor recolour it live.
 *
 * Every design is a hard-stop gradient, no soft blends: the helmet is shown far
 * more often small than large, and a soft mark turns to mud at sixteen pixels.
 * The mask does the clipping, so a design never has to know where the shell
 * ends.
 */

const HELMET_PAINT = {
  solid: (a) => `linear-gradient(${a}, ${a})`,
  // The OverCut seam, worn on the head: one hard diagonal, nothing else.
  split: (a, b) => `linear-gradient(135deg, ${a} 0 52%, ${b} 52% 100%)`,
  lines: (a, b) =>
    `linear-gradient(180deg, ${a} 0 46%, ${b} 46% 58%, ${a} 58% 64%, ${b} 64% 70%, ${a} 70% 100%)`,
  cap: (a, b) => `linear-gradient(180deg, ${b} 0 34%, ${a} 34% 100%)`,
  halves: (a, b) => `linear-gradient(90deg, ${a} 0 52%, ${b} 52% 100%)`,
  // A single diagonal stripe across the shell. A chevron was tried here and
  // cut straight across the visor, where it read as damage rather than paint:
  // every design has to survive the one hole in the silhouette.
  flash: (a, b) => `linear-gradient(115deg, ${a} 0 38%, ${b} 38% 58%, ${a} 58% 100%)`,
};

export const HELMET_STYLES = Object.keys(HELMET_PAINT);

/** `gradient` is what the diagonal was called before the editor existed. */
const HELMET_ALIASES = { gradient: "split" };

export const helmetStyleOf = (style) =>
  HELMET_ALIASES[style] || (HELMET_PAINT[style] ? style : "solid");

export const helmetPaint = (style, primary, secondary) =>
  HELMET_PAINT[helmetStyleOf(style)](primary, secondary);

/** The player's helmet. */
export const Helmet = ({ primary = "#F2B705", secondary = "#10294F", style = "solid", size = 56, title }) => (
  <span
    className="tr-helmet"
    data-testid="helmet"
    role={title ? "img" : undefined}
    aria-hidden={title ? undefined : "true"}
    aria-label={title}
    style={{
      width: size,
      height: size,
      backgroundImage: helmetPaint(style, primary, secondary),
      WebkitMaskImage: `url(${racingHelmetUrl})`,
      maskImage: `url(${racingHelmetUrl})`,
    }}
  />
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

/**
 * The paint box.
 *
 * Racing colours rather than a generic swatch grid: every one of these is a
 * colour Formula 1 has actually been painted in, which is what makes a helmet
 * built out of them look like it belongs on this grid.
 */
export const HELMET_COLORS = [
  { key: "gold", hex: "#F2B705" },
  { key: "navy", hex: "#10294F" },
  { key: "bone", hex: "#F3F1E9" },
  { key: "black", hex: "#14151A" },
  { key: "red", hex: "#C8102E" },
  { key: "green", hex: "#165A3C" },
  { key: "blue", hex: "#0E5BB5" },
  { key: "silver", hex: "#C6CBD2" },
  { key: "papaya", hex: "#FF7A1A" },
  { key: "yellow", hex: "#FFD400" },
  { key: "teal", hex: "#00A19C" },
  { key: "purple", hex: "#6B2FA0" },
  { key: "pink", hex: "#E6007E" },
  { key: "sky", hex: "#6CB4E4" },
  { key: "maroon", hex: "#7A1B2E" },
  { key: "sand", hex: "#C9A227" },
];

export const HELMET_PRESETS = [
  { primary: "#F2B705", secondary: "#10294F", style: "split" },
  { primary: "#C8102E", secondary: "#F3F1E9", style: "lines" },
  { primary: "#F3F1E9", secondary: "#14151A", style: "flash" },
  { primary: "#165A3C", secondary: "#F2B705", style: "cap" },
  { primary: "#0E5BB5", secondary: "#FF7A1A", style: "halves" },
  { primary: "#6B2FA0", secondary: "#FFD400", style: "flash" },
  { primary: "#C6CBD2", secondary: "#C8102E", style: "split" },
  { primary: "#14151A", secondary: "#E6007E", style: "lines" },
];

/** Rough perceived lightness, 0..1. Enough to keep a mark off its own ground. */
const lightnessOf = (hex) => {
  const value = parseInt(hex.slice(1), 16);
  const [r, g, b] = [(value >> 16) & 255, (value >> 8) & 255, value & 255];
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
};

export const helmetContrast = (a, b) => Math.abs(lightnessOf(a) - lightnessOf(b));

/**
 * A whole helmet at random.
 *
 * The two colours have to be far enough apart in lightness or the design is
 * invisible and the button looks broken - a black stripe on a navy shell is
 * technically a random helmet and practically a plain one.
 */
export const randomHelmet = (pick = Math.random) => {
  const styles = HELMET_STYLES.filter((style) => style !== "solid");
  const style = styles[Math.floor(pick() * styles.length)];
  const primary = HELMET_COLORS[Math.floor(pick() * HELMET_COLORS.length)];
  const options = HELMET_COLORS.filter((colour) => helmetContrast(colour.hex, primary.hex) > 0.22);
  const secondary = (options.length ? options : HELMET_COLORS)[
    Math.floor(pick() * (options.length || HELMET_COLORS.length))
  ];

  return { primary: primary.hex, secondary: secondary.hex, style };
};
