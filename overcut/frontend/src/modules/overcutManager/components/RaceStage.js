/**
 * The circuit on screen, and the cameras that watch it.
 *
 *   map      the whole lap from above, cars enlarged so a field of twenty
 *            reads at a glance - the classic pit-wall map.
 *   follow   the overhead camera: true scale, locked onto one car and turned
 *            with it so it always drives up the screen, the way a helicopter
 *            shot follows a driver. Kerbs, run-off, the pit lane and the cars
 *            around it are all drawn in metres.
 *   tv       a director that cuts to the closest fight on the road, north up.
 *
 * Track art is built once per circuit and memoised; per frame only the cars,
 * the camera transform and the upright labels change.
 */

import React, { useId, useMemo } from "react";
import { offsetSpan, pathOf, poseAt } from "../engine/trackGeometry";
import { CarTop } from "./carShapes";

const VIEW_W = 1000;
const VIEW_H = 600;

const deg = (radians) => (radians * 180) / Math.PI;

/** Everything static about the circuit, in metres. */
const useTrackArt = (circuit, near, wet, teams, uid) =>
  useMemo(() => {
    const loop = pathOf(circuit.points);
    const { box } = circuit;
    const span = Math.max(box.maxX - box.minX, box.maxY - box.minY);
    const corners = circuit.corners;

    if (!near) {
      const width = span / 52;
      return (
        <g className="mn-art mn-art--map">
          <path d={loop} className="mn-art__map-edge" strokeWidth={width * 1.9} />
          <path d={loop} className={`mn-art__map-road${wet ? " is-wet" : ""}`} strokeWidth={width} />
          <path d={pathOf(circuit.pit.path, false)} className="mn-art__map-pit" strokeWidth={width * 0.45} />
          {circuit.drsZones.map((zone, index) => (
            <path key={`drs-${index}`} d={pathOf(offsetSpan(circuit, zone.from, zone.to, 0), false)} className="mn-art__map-drs" strokeWidth={width * 0.35} />
          ))}
          {circuit.sectors.slice(1).map((share, index) => {
            const pose = poseAt(circuit, share);
            return <circle key={`s-${index}`} cx={pose.x} cy={pose.y} r={width * 0.7} className={`mn-art__sector mn-art__sector--${index + 2}`} />;
          })}
          {corners.map((corner) => {
            const apex = circuit.points[corner.apexIndex];
            const heading = circuit.heading[corner.apexIndex];
            const out = -corner.sign * width * 2.6;
            return (
              <text key={corner.number} x={apex.x - Math.sin(heading) * out} y={apex.y + Math.cos(heading) * out} className="mn-art__map-corner" fontSize={width * 1.5}>
                {corner.number}
              </text>
            );
          })}
          {(() => {
            const pose = poseAt(circuit, 0);
            return <line x1={pose.x - Math.sin(pose.heading) * width} y1={pose.y + Math.cos(pose.heading) * width} x2={pose.x + Math.sin(pose.heading) * width} y2={pose.y - Math.cos(pose.heading) * width} className="mn-art__map-line" strokeWidth={width * 0.45} />;
          })()}
        </g>
      );
    }

    const half = 6.4;
    const ribbons = [];
    corners.forEach((corner) => {
      const inside = corner.sign || 1;
      // Gravel or tarmac run-off on the outside, wider for the fast ones.
      const runoff = corner.kind === "fast" ? 26 : corner.kind === "medium" ? 20 : 15;
      ribbons.push(
        <path key={`g-${corner.number}`} d={pathOf(offsetSpan(circuit, corner.from - 0.002, corner.to + 0.008, -inside * (half + runoff / 2)), false)} className={corner.kind === "slow" ? "mn-art__gravel" : "mn-art__runoff"} strokeWidth={runoff} />,
      );
    });
    const kerbs = [];
    corners.forEach((corner) => {
      const inside = corner.sign || 1;
      const apexFrom = corner.apex - (corner.apex - corner.from) * 0.6;
      const apexTo = corner.apex + (corner.to - corner.apex) * 0.6;
      [
        offsetSpan(circuit, apexFrom, apexTo, inside * (half + 0.7)),
        offsetSpan(circuit, corner.to - (corner.to - corner.apex) * 0.3, corner.to + 0.004, -inside * (half + 0.7)),
      ].forEach((points, index) => {
        const d = pathOf(points, false);
        kerbs.push(<path key={`kw-${corner.number}-${index}`} d={d} className="mn-art__kerb-base" />);
        kerbs.push(<path key={`kr-${corner.number}-${index}`} d={d} className="mn-art__kerb" />);
      });
    });
    const start = poseAt(circuit, 0);
    const gridSlots = [];
    for (let slot = 0; slot < 26; slot += 1) {
      const pose = poseAt(circuit, 1 - (6 + slot * 8) / circuit.length);
      const side = slot % 2 ? -1 : 1;
      const x = pose.x - Math.sin(pose.heading) * side * 2.6;
      const y = pose.y + Math.cos(pose.heading) * side * 2.6;
      gridSlots.push(<rect key={`grid-${slot}`} x={x + 2.4} y={y - 1.3} width={0.35} height={2.6} transform={`rotate(${deg(pose.heading)} ${x} ${y})`} className="mn-art__grid" />);
    }
    // Garages along the pit lane, in the colours of the teams.
    const garages = [];
    const pitPath = circuit.pit.path;
    const lineIndex = Math.round(circuit.pit.lineAt * (pitPath.length - 1));
    const first = Math.max(2, lineIndex - Math.round(lineIndex * 0.75));
    (teams || []).forEach((team, index) => {
      const i = Math.round(first + ((lineIndex - 2 - first) * index) / Math.max(1, (teams || []).length - 1));
      const a = pitPath[Math.max(0, i - 1)];
      const b = pitPath[Math.min(pitPath.length - 1, i + 1)];
      if (!a || !b) return;
      const heading = Math.atan2(b.y - a.y, b.x - a.x);
      const side = circuit.clockwise ? 1 : -1;
      const p = pitPath[i];
      const x = p.x - Math.sin(heading) * side * 9;
      const y = p.y + Math.cos(heading) * side * 9;
      garages.push(<rect key={`gar-${team.id}`} x={x - 3} y={y - 3} width={6} height={6} fill={team.color} opacity={0.85} transform={`rotate(${deg(heading)} ${x} ${y})`} />);
    });

    return (
      <g className={`mn-art mn-art--near${wet ? " is-wet" : ""}`}>
        <defs>
          <pattern id={`${uid}-checker`} width="1.6" height="1.6" patternUnits="userSpaceOnUse">
            <rect width="1.6" height="1.6" fill="#f3f1e9" />
            <rect width="0.8" height="0.8" fill="#0a0a0c" />
            <rect x="0.8" y="0.8" width="0.8" height="0.8" fill="#0a0a0c" />
          </pattern>
        </defs>
        <rect x={box.minX - 3000} y={box.minY - 3000} width={box.maxX - box.minX + 6000} height={box.maxY - box.minY + 6000} className="mn-art__grass" />
        {ribbons}
        <path d={pathOf(pitPath, false)} className="mn-art__pit" />
        <path d={pathOf(pitPath, false)} className="mn-art__pit-line" />
        {garages}
        <path d={loop} className="mn-art__road" />
        {circuit.drsZones.map((zone, index) => (
          <path key={`drs-${index}`} d={pathOf(offsetSpan(circuit, zone.from, zone.to, -(half - 1.2)), false)} className="mn-art__drs" />
        ))}
        <path d={pathOf(offsetSpan(circuit, 0, 0.9999, half))} className="mn-art__edge" />
        <path d={pathOf(offsetSpan(circuit, 0, 0.9999, -half))} className="mn-art__edge" />
        {kerbs}
        {gridSlots}
        <rect x={start.x - 0.8} y={start.y - half} width={1.6} height={half * 2} fill={`url(#${uid}-checker)`} transform={`rotate(${deg(start.heading)} ${start.x} ${start.y})`} />
        {circuit.sectors.slice(1).map((share, index) => {
          const pose = poseAt(circuit, share);
          return <rect key={`sec-${index}`} x={pose.x - 0.3} y={pose.y - half} width={0.6} height={half * 2} className={`mn-art__sector-line mn-art__sector-line--${index + 2}`} transform={`rotate(${deg(pose.heading)} ${pose.x} ${pose.y})`} />;
        })}
        {corners.map((corner) => {
          const apex = circuit.points[corner.apexIndex];
          const heading = circuit.heading[corner.apexIndex];
          const at = corner.sign * (half + 16);
          const x = apex.x - Math.sin(heading) * at;
          const y = apex.y + Math.cos(heading) * at;
          return (
            <g key={`board-${corner.number}`} transform={`translate(${x} ${y})`}>
              <circle r={4.2} className="mn-art__board" />
              <text className="mn-art__board-text" fontSize={4.4} y={1.5}>
                {corner.number}
              </text>
            </g>
          );
        })}
      </g>
    );
  }, [circuit, near, wet, teams, uid]);

/** The safety car: silver, light bar on the roof. */
const SafetyCar = () => (
  <g>
    <rect x={-2.4} y={-0.95} width={4.8} height={1.9} rx={0.6} fill="#c9ccd2" stroke="#1b1d22" strokeWidth={0.06} />
    <rect x={-0.6} y={-0.8} width={1.4} height={1.6} rx={0.3} fill="#30343c" />
    <rect x={-0.2} y={-0.7} width={0.35} height={1.4} fill="#ffb000" />
  </g>
);

/**
 * The stage. `cars` is a list of { car, pose, row } already timed by the
 * clock; `camera` is { mode, x, y, heading, zoom }.
 */
export default function RaceStage({ circuit, year, cars, camera, wet, teams, safetyCar, focusId, onPick, labels }) {
  const uid = useId().replace(/:/g, "");
  const near = camera.mode !== "map";
  const art = useTrackArt(circuit, near, wet, teams, uid);
  const { box } = circuit;
  const span = Math.max(box.maxX - box.minX, box.maxY - box.minY);

  // Draw order: the camera's car and the player's cars on top.
  const ordered = [...cars].sort((a, b) => (a.car.id === focusId) - (b.car.id === focusId) || (a.car.isUser ? 1 : 0) - (b.car.isUser ? 1 : 0));

  if (!near) {
    const pad = span * 0.07;
    const carScale = Math.max(2.6, span / 180);
    return (
      <svg className="mn-stage__svg" viewBox={`${box.minX - pad} ${box.minY - pad} ${box.maxX - box.minX + pad * 2} ${box.maxY - box.minY + pad * 2}`} preserveAspectRatio="xMidYMid meet" role="img" aria-label={labels.map}>
        {art}
        {safetyCar && (
          <g transform={`translate(${safetyCar.x} ${safetyCar.y}) rotate(${deg(safetyCar.heading)}) scale(${carScale})`}>
            <SafetyCar />
          </g>
        )}
        {ordered.map(({ car, pose }) =>
          pose.gone ? null : (
            <g key={car.id} transform={`translate(${pose.x.toFixed(1)} ${pose.y.toFixed(1)}) rotate(${deg(pose.heading).toFixed(1)}) scale(${carScale})`} onClick={() => onPick(car.id)} className="mn-stage__car">
              <CarTop year={year} color={car.color} compound={car.compound} ghost={pose.parked} highlight={car.isUser || car.id === focusId} />
            </g>
          ),
        )}
        {ordered.map(({ car, code, pose, row }) =>
          pose.gone || !(car.isUser || car.id === focusId || (row && row.position <= 3)) ? null : (
            <text key={`l-${car.id}`} x={pose.x} y={pose.y - carScale * 2.4} className={`mn-stage__map-label${car.isUser ? " is-user" : ""}`} fontSize={span / 62}>
              {row ? `${row.position} ` : ""}
              {code}
            </text>
          ),
        )}
      </svg>
    );
  }

  // Overhead cameras: world in metres, transformed around the camera point.
  const rotate = camera.rotate ? -(deg(camera.heading) + 90) : 0;
  const scale = VIEW_W / camera.view;
  const anchorY = camera.rotate ? VIEW_H * 0.6 : VIEW_H * 0.5;
  const transform = `translate(${VIEW_W / 2} ${anchorY}) scale(${scale}) rotate(${rotate}) translate(${-camera.x} ${-camera.y})`;
  const toScreen = (x, y) => {
    const a = (rotate * Math.PI) / 180;
    const dx = x - camera.x;
    const dy = y - camera.y;
    return [VIEW_W / 2 + (dx * Math.cos(a) - dy * Math.sin(a)) * scale, anchorY + (dx * Math.sin(a) + dy * Math.cos(a)) * scale];
  };

  return (
    <svg className="mn-stage__svg is-near" viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} preserveAspectRatio="xMidYMid slice" role="img" aria-label={labels.near}>
      <g transform={transform}>
        {art}
        {safetyCar && (
          <g transform={`translate(${safetyCar.x} ${safetyCar.y}) rotate(${deg(safetyCar.heading)})`}>
            <SafetyCar />
          </g>
        )}
        {ordered.map(({ car, pose }) =>
          pose.gone ? null : (
            <g key={car.id} transform={`translate(${pose.x.toFixed(2)} ${pose.y.toFixed(2)}) rotate(${deg(pose.heading).toFixed(1)})`} onClick={() => onPick(car.id)} className="mn-stage__car">
              <CarTop year={year} color={car.color} compound={car.compound} ghost={pose.parked} highlight={car.id === focusId} />
            </g>
          ),
        )}
      </g>
      {ordered.map(({ car, code, pose, row }) => {
        if (pose.gone) return null;
        const [sx, sy] = toScreen(pose.x, pose.y);
        if (sx < -40 || sx > VIEW_W + 40 || sy < -40 || sy > VIEW_H + 40) return null;
        return (
          <g key={`tag-${car.id}`} transform={`translate(${sx.toFixed(1)} ${(sy - 34).toFixed(1)})`} className={`mn-stage__tag${car.isUser ? " is-user" : ""}${car.id === focusId ? " is-focus" : ""}`} onClick={() => onPick(car.id)}>
            <rect x={-30} y={-11} width={60} height={18} rx={2} style={{ "--team": car.color }} />
            <text y={3}>
              {row ? `P${row.position} ` : ""}
              {code}
            </text>
            {pose.stopped && (
              <text y={-16} className="mn-stage__tag-pit">
                {labels.box} {pose.stopLeft.toFixed(1)}s
              </text>
            )}
          </g>
        );
      })}
      {safetyCar && (() => {
        const [sx, sy] = toScreen(safetyCar.x, safetyCar.y);
        return (
          <text x={sx} y={sy - 30} className="mn-stage__sc-tag">
            SAFETY CAR
          </text>
        );
      })()}
    </svg>
  );
}

/** The whole circuit in a corner, with every car as a dot, while a camera is close in. */
export const MiniMap = ({ circuit, cars, focusId, label }) => {
  const { box } = circuit;
  const span = Math.max(box.maxX - box.minX, box.maxY - box.minY);
  const pad = span * 0.06;
  const loop = useMemo(() => pathOf(circuit.points), [circuit]);
  return (
    <svg className="mn-minimap" viewBox={`${box.minX - pad} ${box.minY - pad} ${box.maxX - box.minX + pad * 2} ${box.maxY - box.minY + pad * 2}`} role="img" aria-label={label}>
      <path d={loop} className="mn-minimap__road" strokeWidth={span / 40} />
      {cars.map(({ car, pose }) =>
        pose.gone ? null : (
          <circle key={car.id} cx={pose.x} cy={pose.y} r={car.id === focusId ? span / 36 : car.isUser ? span / 48 : span / 70} fill={pose.parked ? "#5d6470" : car.color} stroke={car.id === focusId || car.isUser ? "#f2b705" : "#081832"} strokeWidth={span / 260} />
        ),
      )}
    </svg>
  );
};
