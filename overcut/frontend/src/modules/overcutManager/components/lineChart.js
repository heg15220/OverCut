/**
 * A small line chart for the data screens (points by round, board confidence).
 *
 * Follows the dataviz rules of DESIGN.md: one emphasised series per story (the
 * player's) in its readable team colour, everything else in the neutral data
 * colour; hairline grid, mono tick labels, 2 px lines, direct labels only on
 * the emphasised lines, a crosshair with a tooltip on hover and on arrow keys.
 * The tooltip never gates a value: every screen that draws one also shows the
 * numbers in a table.
 *
 * series: [{ id, label, color, values: number[], emphasis }]
 * xLabels: string[] (one per index), xTitle(index) for the tooltip
 * threshold: { value, label } drawn as a quiet reference line
 */

import React, { useLayoutEffect, useMemo, useRef, useState } from "react";
import "./styles/chart.css";

const useWidth = (ref, fallback = 480) => {
  const [width, setWidth] = useState(fallback);
  useLayoutEffect(() => {
    const node = ref.current;
    if (!node) return undefined;
    const measure = () => {
      const next = Math.round(node.getBoundingClientRect().width);
      if (next > 0) setWidth(next);
    };
    measure();
    if (typeof ResizeObserver === "undefined") return undefined;
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, [ref]);
  return width;
};

const niceStep = (max, ticks = 4) => {
  const raw = Math.max(1, max) / ticks;
  const power = 10 ** Math.floor(Math.log10(raw));
  const unit = [1, 2, 2.5, 5, 10].find((m) => m * power >= raw) * power;
  return unit;
};

export default function LineChart({ series, xLabels, xTitle, yMax: fixedMax, yMin = 0, threshold, height = 220, format = (v) => v, ariaLabel, labelWidth = 0 }) {
  const box = useRef(null);
  const width = useWidth(box);
  const [hover, setHover] = useState(null);
  const count = xLabels.length;

  const geometry = useMemo(() => {
    const dataMax = Math.max(1, ...series.flatMap((entry) => entry.values.filter((v) => v !== null && v !== undefined)));
    const step = fixedMax ? (fixedMax - yMin) / 4 : niceStep(dataMax - yMin);
    const top = fixedMax ?? Math.ceil(dataMax / step) * step;
    const pad = { top: 12, right: 12 + labelWidth, bottom: 24, left: 36 };
    const plotW = Math.max(40, width - pad.left - pad.right);
    const plotH = height - pad.top - pad.bottom;
    const x = (index) => pad.left + (count > 1 ? (index / (count - 1)) * plotW : plotW / 2);
    const y = (value) => pad.top + plotH - ((value - yMin) / (top - yMin || 1)) * plotH;
    const ticks = [];
    for (let v = yMin; v <= top + 1e-9; v += step) ticks.push(Math.round(v * 100) / 100);
    const every = Math.max(1, Math.ceil(count / Math.max(2, Math.floor(plotW / 44))));
    return { pad, plotW, plotH, x, y, ticks, every, top };
  }, [series, width, height, count, fixedMax, yMin, labelWidth]);

  const { pad, plotH, x, y, ticks, every } = geometry;
  const ordered = [...series].sort((a, b) => Number(Boolean(a.emphasis)) - Number(Boolean(b.emphasis)));
  const pathOf = (values) =>
    values
      .map((value, index) => (value === null || value === undefined ? null : `${x(index).toFixed(1)},${y(value).toFixed(1)}`))
      .reduce((out, point) => {
        if (!point) return { d: out.d, open: false };
        return { d: `${out.d}${out.open ? " L" : " M"}${point}`, open: true };
      }, { d: "", open: false }).d;

  // Direct labels at the line ends, emphasised series only, nudged apart.
  const labels = series
    .filter((entry) => entry.emphasis && labelWidth > 0)
    .map((entry) => {
      const last = entry.values.reduce((found, value, index) => (value !== null && value !== undefined ? index : found), -1);
      return last < 0 ? null : { id: entry.id, label: entry.label, color: entry.color, x: x(last), y: y(entry.values[last]), y0: y(entry.values[last]) };
    })
    .filter(Boolean)
    .sort((a, b) => a.y - b.y);
  labels.forEach((label, index) => {
    if (index && label.y - labels[index - 1].y < 14) label.y = labels[index - 1].y + 14;
  });

  const pick = (clientX) => {
    const rect = box.current.getBoundingClientRect();
    const local = clientX - rect.left;
    const share = (local - pad.left) / Math.max(1, geometry.plotW);
    setHover(Math.max(0, Math.min(count - 1, Math.round(share * (count - 1)))));
  };
  const onKey = (event) => {
    if (event.key === "ArrowRight") setHover((index) => Math.min(count - 1, (index ?? -1) + 1));
    else if (event.key === "ArrowLeft") setHover((index) => Math.max(0, (index ?? count) - 1));
    else if (event.key === "Escape") setHover(null);
    else return;
    event.preventDefault();
  };

  const rows = hover === null ? [] : series.map((entry) => ({ ...entry, value: entry.values[hover] })).filter((entry) => entry.value !== null && entry.value !== undefined).sort((a, b) => b.value - a.value).slice(0, 8);
  const tipLeft = hover === null ? 0 : x(hover);
  const flip = tipLeft > width * 0.6;

  return (
    <div className="mn-lc" ref={box}>
      <svg
        width={width}
        height={height}
        role="img"
        aria-label={ariaLabel}
        tabIndex={0}
        onPointerMove={(event) => pick(event.clientX)}
        onPointerLeave={() => setHover(null)}
        onKeyDown={onKey}
        onBlur={() => setHover(null)}
      >
        <title>{ariaLabel}</title>
        {ticks.map((tick) => (
          <g key={tick}>
            <line className="mn-lc__grid" x1={pad.left} x2={width - pad.right} y1={y(tick)} y2={y(tick)} />
            <text className="mn-lc__tick" x={pad.left - 8} y={y(tick)} dy="0.32em" textAnchor="end">
              {format(tick)}
            </text>
          </g>
        ))}
        {xLabels.map((label, index) =>
          index % every === 0 || index === count - 1 ? (
            <text key={index} className="mn-lc__tick" x={x(index)} y={pad.top + plotH + 16} textAnchor="middle">
              {label}
            </text>
          ) : null,
        )}
        {threshold && (
          <g>
            <line className="mn-lc__threshold" x1={pad.left} x2={width - pad.right} y1={y(threshold.value)} y2={y(threshold.value)} />
            <text className="mn-lc__tick" x={width - pad.right} y={y(threshold.value) - 6} textAnchor="end">
              {threshold.label}
            </text>
          </g>
        )}
        {ordered.map((entry) => (
          <path key={entry.id} d={pathOf(entry.values)} className={`mn-lc__line${entry.emphasis ? " is-emphasis" : ""}`} style={{ stroke: entry.color }} />
        ))}
        {labels.map((label) => (
          <g key={label.id}>
            <circle cx={label.x} cy={label.y0} r="3" style={{ fill: label.color }} />
            <text className="mn-lc__label" x={label.x + 8} y={label.y} dy="0.32em">
              {label.label}
            </text>
          </g>
        ))}
        {hover !== null && (
          <g>
            <line className="mn-lc__cross" x1={x(hover)} x2={x(hover)} y1={pad.top} y2={pad.top + plotH} />
            {rows.map((entry) => (
              <circle key={entry.id} className="mn-lc__dot" cx={x(hover)} cy={y(entry.value)} r="4" style={{ fill: entry.color }} />
            ))}
          </g>
        )}
      </svg>
      {hover !== null && rows.length > 0 && (
        <div className={`mn-lc__tip${flip ? " is-flip" : ""}`} style={{ left: tipLeft, top: pad.top }} role="status">
          <strong>{xTitle ? xTitle(hover) : xLabels[hover]}</strong>
          <ul>
            {rows.map((entry) => (
              <li key={entry.id}>
                <i style={{ background: entry.color }} aria-hidden="true" />
                <span>{entry.label}</span>
                <b>{format(entry.value)}</b>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
