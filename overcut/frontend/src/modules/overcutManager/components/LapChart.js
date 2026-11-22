/**
 * The race told as a lap chart: every car's position at the end of every lap,
 * from the grid to the flag. The player's cars are drawn in their colours with
 * their stops marked; the rest of the field is the background the story is
 * told against.
 */

import React from "react";
import { t } from "./texts";

const W = 640;
const H = 300;
const PAD = { left: 28, right: 46, top: 10, bottom: 22 };

export default function LapChart({ chart }) {
  if (!chart?.cars?.length) return null;
  const size = chart.cars.length;
  const x = (lap) => PAD.left + (lap / Math.max(1, chart.laps)) * (W - PAD.left - PAD.right);
  const y = (position) => PAD.top + ((position - 1) / Math.max(1, size - 1)) * (H - PAD.top - PAD.bottom);
  const line = (car) => [`M${x(0).toFixed(1)},${y(car.grid).toFixed(1)}`, ...car.positions.map((position, index) => `L${x(index + 1).toFixed(1)},${y(position).toFixed(1)}`)].join("");
  const ordered = [...chart.cars].sort((a, b) => Number(a.isUser) - Number(b.isUser));
  const ticks = [];
  const step = chart.laps > 40 ? 10 : 5;
  for (let lap = step; lap < chart.laps; lap += step) ticks.push(lap);

  return (
    <svg className="mn-lapchart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={t("Gráfica de posiciones por vuelta", "Lap chart")}>
      {[1, Math.ceil(size / 2), size].map((position) => (
        <g key={`p-${position}`}>
          <line x1={PAD.left} x2={W - PAD.right} y1={y(position)} y2={y(position)} className="mn-lapchart__grid" />
          <text x={PAD.left - 6} y={y(position) + 3} className="mn-lapchart__axis" textAnchor="end">
            {position}
          </text>
        </g>
      ))}
      {ticks.map((lap) => (
        <g key={`l-${lap}`}>
          <line x1={x(lap)} x2={x(lap)} y1={PAD.top} y2={H - PAD.bottom} className="mn-lapchart__grid" />
          <text x={x(lap)} y={H - 6} className="mn-lapchart__axis" textAnchor="middle">
            {t("V", "L")}
            {lap}
          </text>
        </g>
      ))}
      {ordered.map((car) => (
        <g key={car.id}>
          {/* A pale halo keeps a dark livery readable on the navy. */}
          {car.isUser && <path d={line(car)} className="mn-lapchart__halo" />}
          <path d={line(car)} className={`mn-lapchart__line${car.isUser ? " is-user" : ""}`} style={{ stroke: car.color }} />
        </g>
      ))}
      {ordered
        .filter((car) => car.isUser)
        .map((car) => (
          <g key={`u-${car.id}`}>
            {car.stops.map((lap) => (
              <circle key={lap} cx={x(lap)} cy={y(car.positions[lap - 1] ?? car.grid)} r={4} className="mn-lapchart__stop" style={{ stroke: car.color }} />
            ))}
            {car.positions.length > 0 && (
              <text x={x(car.positions.length) + 6} y={y(car.positions[car.positions.length - 1]) + 4} className="mn-lapchart__name" style={{ fill: car.color }}>
                {car.name.split(" ").pop().slice(0, 3).toUpperCase()}
              </text>
            )}
          </g>
        ))}
    </svg>
  );
}
