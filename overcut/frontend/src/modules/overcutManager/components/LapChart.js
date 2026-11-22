/**
 * The race told as a lap chart (RF-WKD-07): every car's position at the end of
 * every lap, from the grid to the flag. The player's cars are drawn in their
 * team colour (lifted to 3:1 on the card, RNF-09; the second car dashed so the
 * two read apart without relying on colour) with their stops marked; the rest
 * of the field is the quiet background the story is told against.
 */

import React, { useEffect, useRef, useState } from "react";
import { readableOn } from "./atoms";
import { t } from "./texts";
import "./styles/weekend.css";

const PAD = { left: 28, right: 48, top: 10, bottom: 24 };

const code = (name = "") => {
  const parts = name.split(" ").filter((part) => part && !/^(jr|sr|ii|iii)\.?$/i.test(part));
  return (parts[parts.length - 1] || name).replace(/[^\p{L}]/gu, "").slice(0, 3).toUpperCase();
};

/** Drawn at the width it is shown, so the labels stay 11 px on a phone and on a wide screen. */
const useWidth = (fallback = 720) => {
  const ref = useRef(null);
  const [width, setWidth] = useState(fallback);
  useEffect(() => {
    const node = ref.current;
    if (!node || typeof ResizeObserver === "undefined") return undefined;
    const observer = new ResizeObserver(([entry]) => setWidth(Math.max(280, Math.round(entry.contentRect.width))));
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  return [ref, width];
};

export default function LapChart({ chart }) {
  const [ref, W] = useWidth();
  if (!chart?.cars?.length) return null;
  const H = Math.round(Math.min(360, Math.max(220, W * 0.32)));
  const size = chart.cars.length;
  const x = (lap) => PAD.left + (lap / Math.max(1, chart.laps)) * (W - PAD.left - PAD.right);
  const y = (position) => PAD.top + ((position - 1) / Math.max(1, size - 1)) * (H - PAD.top - PAD.bottom);
  const line = (car) => [`M${x(0).toFixed(1)},${y(car.grid).toFixed(1)}`, ...car.positions.map((position, index) => `L${x(index + 1).toFixed(1)},${y(position).toFixed(1)}`)].join("");
  const ordered = [...chart.cars].sort((a, b) => Number(a.isUser) - Number(b.isUser));
  const users = chart.cars.filter((car) => car.isUser);
  const dashOf = (car) => (users.indexOf(car) === 1 ? "6 4" : undefined);
  const ticks = [];
  const step = chart.laps > 40 && W > 480 ? 10 : chart.laps > 40 ? 20 : 5;
  for (let lap = step; lap < chart.laps; lap += step) ticks.push(lap);

  return (
    <figure style={{ margin: 0 }} ref={ref}>
      <svg className="wk-lapchart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={t("Gráfica de posiciones por vuelta", "Lap chart")}>
        {[1, Math.ceil(size / 2), size].map((position) => (
          <g key={`p-${position}`}>
            <line x1={PAD.left} x2={W - PAD.right} y1={y(position)} y2={y(position)} className="wk-lapchart__grid" />
            <text x={PAD.left - 8} y={y(position) + 4} className="wk-lapchart__axis" textAnchor="end">
              {position}
            </text>
          </g>
        ))}
        {ticks.map((lap) => (
          <g key={`l-${lap}`}>
            <line x1={x(lap)} x2={x(lap)} y1={PAD.top} y2={H - PAD.bottom} className="wk-lapchart__grid" />
            <text x={x(lap)} y={H - 6} className="wk-lapchart__axis" textAnchor="middle">
              {t("V", "L")}
              {lap}
            </text>
          </g>
        ))}
        {ordered.map((car) => (
          <g key={car.id}>
            {car.isUser && <path d={line(car)} className="wk-lapchart__halo" />}
            <path d={line(car)} className={`wk-lapchart__line${car.isUser ? " is-user" : ""}`} style={car.isUser ? { stroke: readableOn(car.color) } : undefined} strokeDasharray={car.isUser ? dashOf(car) : undefined} />
          </g>
        ))}
        {users.map((car) => (
          <g key={`u-${car.id}`}>
            {car.stops.map((lap) => (
              <circle key={lap} cx={x(lap)} cy={y(car.positions[lap - 1] ?? car.grid)} r={4} className="wk-lapchart__stop" style={{ stroke: readableOn(car.color) }} />
            ))}
            {car.positions.length > 0 && (
              <text x={x(car.positions.length) + 6} y={y(car.positions[car.positions.length - 1]) + 4} className="wk-lapchart__name" style={{ fill: readableOn(car.color) }}>
                {code(car.name)}
              </text>
            )}
          </g>
        ))}
      </svg>
      <figcaption className="wk-legend">
        {users.map((car) => (
          <span key={car.id}>
            <i style={{ "--stripe": readableOn(car.color), ...(dashOf(car) ? { background: `repeating-linear-gradient(90deg, ${readableOn(car.color)} 0 6px, transparent 6px 10px)` } : {}) }} aria-hidden="true" />
            {car.name}
          </span>
        ))}
        <span>
          <i aria-hidden="true" />
          {t("Resto de la parrilla", "Rest of the field")}
        </span>
        <span>
          <i className="is-stop" aria-hidden="true" />
          {t("Parada", "Pit stop")}
        </span>
      </figcaption>
    </figure>
  );
}
