/**
 * The career trace.
 *
 * The season strip shows one year. This shows all of them, and it is the only
 * place in the game that answers the question a retiring driver is actually
 * judged on: were you better than the car you were given?
 *
 * Two lines on one axis - where you finished the championship, and where the
 * car you drove should have put you. The engine already defines that second
 * number (`season.js`: a car ranked Nth on the grid is worth `N * 2 - 0.5` in
 * the drivers' table), so the gap between the lines is not a new invention. It
 * is `overperformance`, the same number the retirement verdict is written from,
 * drawn instead of asserted.
 *
 * Gold above the steel line is what you added. Steel above yours is what you
 * left behind. Title years get a full-height gold hairline, because those are
 * the years the eye should find first.
 */

import React, { useEffect, useRef, useState } from "react";
import { TeamLogo } from "./atoms";
import { t } from "../i18n";

const GUTTER = 32;
const PAD_RIGHT = 10;
const PAD_TOP = 16;
const PAD_BOTTOM = 24;

/**
 * The plot has to be drawn at real pixels: text inside a scaled viewBox goes
 * illegible on a phone, and the whole point of the chart is being read fast.
 */
const useWidth = (ref, fallback = 960) => {
  const [width, setWidth] = useState(fallback);

  useEffect(() => {
    const node = ref.current;
    if (!node) return undefined;

    const read = () => setWidth(node.clientWidth || fallback);
    read();

    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", read);
      return () => window.removeEventListener("resize", read);
    }

    const observer = new ResizeObserver(read);
    observer.observe(node);
    return () => observer.disconnect();
  }, [ref, fallback]);

  return width;
};

/** A season's two numbers, both on the drivers' championship scale. */
const rowsOf = (history) =>
  history.map((season) => {
    const field = (season.teamCount || 0) * 2;
    const finished = season.position > 0 && season.position < 90 ? season.position : field || 20;
    const car =
      season.carRank > 0 && field > 0
        ? Math.min(Math.max(season.carRank * 2 - 0.5, 1), field)
        : null;
    return { ...season, finished, car };
  });

/**
 * The band between the lines, cut where they cross.
 *
 * Without the cut, a stretch that starts ahead of the car and ends behind it
 * fills one shape in a single colour, which says the opposite of what happened
 * for half of its width.
 */
const bandOf = (points) => {
  const bands = [];

  for (let i = 0; i < points.length - 1; i += 1) {
    const a = points[i];
    const b = points[i + 1];
    if (a.carY === null || b.carY === null) continue;

    // Positive means the player's line sits above the car's: fewer pixels down.
    const gapA = a.carY - a.y;
    const gapB = b.carY - b.y;

    if (gapA * gapB >= 0) {
      bands.push({
        good: gapA + gapB >= 0,
        points: [
          [a.x, a.y],
          [b.x, b.y],
          [b.x, b.carY],
          [a.x, a.carY],
        ],
      });
      continue;
    }

    const share = gapA / (gapA - gapB);
    const crossX = a.x + (b.x - a.x) * share;
    const crossY = a.y + (b.y - a.y) * share;
    bands.push({
      good: gapA > 0,
      points: [
        [a.x, a.y],
        [crossX, crossY],
        [a.x, a.carY],
      ],
    });
    bands.push({
      good: gapB > 0,
      points: [
        [crossX, crossY],
        [b.x, b.y],
        [b.x, b.carY],
      ],
    });
  }

  return bands;
};

/** Consecutive years at one team, so the band underneath reads as chapters. */
const spellsOf = (history) =>
  history.reduce((spells, season) => {
    const last = spells[spells.length - 1];
    if (last && last.team === season.team) {
      last.years += 1;
      last.to = season.year;
      return spells;
    }
    return [...spells, { team: season.team, years: 1, from: season.year, to: season.year }];
  }, []);

const lineOf = (points, key) =>
  points
    .filter((point) => point[key] !== null)
    .map((point, index) => `${index === 0 ? "M" : "L"}${point.x.toFixed(1)} ${point[key].toFixed(1)}`)
    .join(" ");

export const CareerTrace = ({ history = [] }) => {
  const frame = useRef(null);
  const width = useWidth(frame);

  if (history.length < 2) return null;

  const rows = rowsOf(history);
  const height = width < 560 ? 190 : 250;
  const plotWidth = Math.max(60, width - GUTTER - PAD_RIGHT);
  const plotHeight = height - PAD_TOP - PAD_BOTTOM;

  const deepest = rows.reduce((worst, row) => Math.max(worst, row.finished, row.car || 0), 10);
  const scale = Math.ceil(deepest / 5) * 5;

  const xOf = (index) => GUTTER + (index / (rows.length - 1)) * plotWidth;
  const yOf = (value) => PAD_TOP + ((value - 1) / (scale - 1)) * plotHeight;

  const points = rows.map((row, index) => ({
    ...row,
    x: xOf(index),
    y: yOf(row.finished),
    carY: row.car === null ? null : yOf(row.car),
  }));

  const grid = [1, 5, 10, 15, 20, 25, 30].filter((value) => value <= scale);
  const step = Math.max(1, Math.ceil(rows.length / 8));
  const spells = spellsOf(history);
  const labelled = (index) =>
    index === 0 ||
    index === points.length - 1 ||
    (index % step === 0 && points.length - 1 - index >= step * 0.7);

  return (
    <div className="tr-trace" ref={frame} data-testid="career-trace">
      <svg
        className="tr-trace__plot"
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={`${t.traceTitle}. ${t.traceNote}.`}
      >
        {/* The years the car was better than you are hatched rather than just
            tinted: at this opacity gold and steel are two similar browns, and
            the one thing this chart must never be is ambiguous about which
            side of the line you were on. */}
        <defs>
          <pattern id="tr-trace-under" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width="6" height="6" fill="rgba(127, 150, 189, 0.14)" />
            <line x1="0" y1="0" x2="0" y2="6" stroke="rgba(127, 150, 189, 0.5)" strokeWidth="1.6" />
          </pattern>
        </defs>

        {grid.map((value) => (
          <g key={value}>
            <line
              className="tr-trace__grid"
              x1={GUTTER}
              x2={width - PAD_RIGHT}
              y1={yOf(value)}
              y2={yOf(value)}
            />
            <text className="tr-trace__axis" x={GUTTER - 8} y={yOf(value) + 3} textAnchor="end">
              {value === 1 ? "P1" : value}
            </text>
          </g>
        ))}

        {bandOf(points).map((band, index) => (
          <polygon
            key={`band-${index}`}
            className={`tr-trace__band${band.good ? " is-over" : ""}`}
            data-testid="trace-band"
            points={band.points.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ")}
          />
        ))}

        {points
          .filter((point) => point.champion)
          .map((point) => (
            <line
              key={`title-${point.year}`}
              className="tr-trace__title"
              x1={point.x}
              x2={point.x}
              y1={PAD_TOP}
              y2={point.y}
            />
          ))}

        <path className="tr-trace__car" d={lineOf(points, "carY")} />
        <path className="tr-trace__you" d={lineOf(points, "y")} />

        {points.map((point) => (
          <g key={`node-${point.year}`}>
            {point.champion ? (
              <rect
                className="tr-trace__crown"
                data-testid="trace-crown"
                x={point.x - 4.5}
                y={point.y - 4.5}
                width={9}
                height={9}
                transform={`rotate(45 ${point.x} ${point.y})`}
              />
            ) : (
              <rect className="tr-trace__node" x={point.x - 2} y={point.y - 2} width={4} height={4} />
            )}
            <rect
              className="tr-trace__hit"
              x={point.x - plotWidth / (rows.length * 2)}
              y={PAD_TOP}
              width={Math.max(6, plotWidth / rows.length)}
              height={plotHeight}
            >
              <title data-testid="trace-season">
                {point.champion
                  ? t.traceChampionSeason(point.year, point.team)
                  : t.traceSeason(point.year, point.team, point.finished)}
              </title>
            </rect>
          </g>
        ))}

        {points.map((point, index) =>
          labelled(index) ? (
            <text
              key={`year-${point.year}`}
              className="tr-trace__year"
              x={point.x}
              y={height - 7}
              textAnchor={index === 0 ? "start" : index === points.length - 1 ? "end" : "middle"}
            >
              {point.year}
            </text>
          ) : null
        )}
      </svg>

      <ol className="tr-trace__spells" style={{ marginLeft: GUTTER, marginRight: PAD_RIGHT }}>
        {spells.map((spell) => (
          <li
            className="tr-trace__spell"
            key={`${spell.team}-${spell.from}`}
            style={{ flexGrow: spell.years }}
            title={`${spell.team} · ${spell.from}${spell.to === spell.from ? "" : `–${spell.to}`}`}
          >
            <TeamLogo teamName={spell.team} size={14} />
            <span className="tr-trace__spellname">{spell.team}</span>
          </li>
        ))}
      </ol>

      <p className="tr-trace__key">
        <span className="tr-trace__keyitem tr-trace__keyitem--you">{t.traceYou}</span>
        <span className="tr-trace__keyitem tr-trace__keyitem--car">{t.traceCar}</span>
      </p>
    </div>
  );
};

export default CareerTrace;
