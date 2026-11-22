/**
 * The circuit, as the strategists' briefing shows it on Friday: the shape of
 * the lap with its corners numbered, the DRS zones and the sectors, and the
 * numbers that decide the weekend - how long, how much of it flat out, how
 * slow the slow corners are, how hard it is on tyres and how hard to pass.
 */

import React, { useMemo } from "react";
import { pathOf, poseAt } from "../engine/trackGeometry";
import { circuitFor } from "../engine/venue";
import { wearFactorFor } from "../engine/race";
import { t } from "./texts";

export default function CircuitCard({ race, year }) {
  const circuit = useMemo(() => circuitFor(race, year), [race, year]);
  const { box } = circuit;
  const span = Math.max(box.maxX - box.minX, box.maxY - box.minY);
  const pad = span * 0.09;
  const width = span / 70;
  const kinds = circuit.corners.reduce((counts, corner) => ({ ...counts, [corner.kind]: (counts[corner.kind] || 0) + 1 }), {});
  const slowest = circuit.corners.reduce((best, corner) => (!best || corner.kmh < best.kmh ? corner : best), null);
  const wear = wearFactorFor(race.profile);
  const start = poseAt(circuit, 0);
  const named = circuit.corners.filter((corner) => corner.name && !/^(curva|turn)\s*\d/i.test(corner.name)).slice(0, 6);

  return (
    <div className="mn-circuit">
      <svg className="mn-circuit__map" viewBox={`${box.minX - pad} ${box.minY - pad} ${box.maxX - box.minX + pad * 2} ${box.maxY - box.minY + pad * 2}`} role="img" aria-label={t("Plano del circuito", "Circuit layout")}>
        <path d={pathOf(circuit.points)} className="mn-circuit__edge" strokeWidth={width * 2.2} />
        <path d={pathOf(circuit.points)} className="mn-circuit__road" strokeWidth={width} />
        {circuit.drsZones.map((zone, index) => {
          const n = circuit.points.length;
          const from = Math.floor(zone.from * n);
          const to = Math.ceil((zone.to < zone.from ? zone.to + 1 : zone.to) * n);
          const points = [];
          for (let k = from; k <= to; k += 1) points.push(circuit.points[((k % n) + n) % n]);
          return <path key={index} d={pathOf(points, false)} className="mn-circuit__drs" strokeWidth={width * 0.9} />;
        })}
        <line x1={start.x - Math.sin(start.heading) * width * 2} y1={start.y + Math.cos(start.heading) * width * 2} x2={start.x + Math.sin(start.heading) * width * 2} y2={start.y - Math.cos(start.heading) * width * 2} className="mn-circuit__line" strokeWidth={width * 0.8} />
        {circuit.corners.map((corner) => {
          const apex = circuit.points[corner.apexIndex];
          const heading = circuit.heading[corner.apexIndex];
          const out = -corner.sign * width * 3.4;
          return (
            <text key={corner.number} x={apex.x - Math.sin(heading) * out} y={apex.y + Math.cos(heading) * out} className={`mn-circuit__corner is-${corner.kind}`} fontSize={width * 2.4}>
              {corner.number}
            </text>
          );
        })}
      </svg>
      <dl className="mn-facts mn-facts--circuit">
        <div>
          <dt>{t("Longitud", "Length")}</dt>
          <dd>{(circuit.length / 1000).toFixed(3)} km</dd>
        </div>
        <div>
          <dt>{t("Distancia", "Distance")}</dt>
          <dd>{((circuit.length * race.laps) / 1000).toFixed(1)} km</dd>
        </div>
        <div>
          <dt>{t("Curvas", "Corners")}</dt>
          <dd>
            {circuit.corners.length} · <span className="is-slow">{kinds.slow || 0}</span>/<span className="is-medium">{kinds.medium || 0}</span>/<span className="is-fast">{kinds.fast || 0}</span>
          </dd>
        </div>
        <div>
          <dt>{t("A fondo", "Full throttle")}</dt>
          <dd>{Math.round(circuit.fullThrottle * 100)}%</dd>
        </div>
        <div>
          <dt>{t("Recta más larga", "Longest straight")}</dt>
          <dd>{circuit.straights[0]?.metres ?? "—"} m</dd>
        </div>
        <div>
          <dt>{t("Curva más lenta", "Slowest corner")}</dt>
          <dd>
            {slowest ? `${slowest.number} · ${slowest.kmh} km/h` : "—"}
          </dd>
        </div>
        <div>
          <dt>{t("Desgaste", "Tyre wear")}</dt>
          <dd>{wear > 1.1 ? t("Alto", "High") : wear > 0.95 ? t("Medio", "Medium") : t("Bajo", "Low")}</dd>
        </div>
        <div>
          <dt>DRS</dt>
          <dd>{year >= 2011 ? `${circuit.drsZones.length} ${t("zonas", "zones")}` : "—"}</dd>
        </div>
      </dl>
      {named.length > 0 && (
        <p className="mn-hint mn-circuit__names">
          {named.map((corner) => `${corner.number} ${corner.name}`).join(" · ")}
        </p>
      )}
    </div>
  );
}
