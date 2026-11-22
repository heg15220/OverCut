/**
 * The circuit, as the strategists' briefing shows it on Friday: the real
 * circuit in 3D when the asset pipeline calibrated one for this layout
 * (RF-3D-01, three/CircuitPreview) or the 2D plan with its corners numbered,
 * the DRS zones and the start line (RF-3D-02, RNF-09), and the numbers that
 * decide the weekend - how long, how much of it flat out, how slow the slow
 * corners are, how hard it is on tyres and how hard to pass.
 */

import React, { useMemo, useState } from "react";
import { pathOf, poseAt } from "../engine/trackGeometry";
import { circuitFor } from "../engine/venue";
import { wearFactorFor } from "../engine/race";
import { circuitAssetFor } from "../three/assets/manifest";
import { canRender3D } from "../three/support";
import { t } from "./texts";
import "./styles/weekend.css";

// three.js comes with the preview, so it is fetched only when a real circuit is shown.
const CircuitPreview = React.lazy(() => import("../three/CircuitPreview"));

/** The plan: the lap, its DRS zones, the start line and the corner numbers. */
export const CircuitMap = ({ circuit, drs = false, label }) => {
  const { box } = circuit;
  const span = Math.max(box.maxX - box.minX, box.maxY - box.minY);
  const pad = span * 0.09;
  const width = span / 70;
  const start = poseAt(circuit, 0);
  const loop = useMemo(() => pathOf(circuit.points), [circuit]);
  return (
    <svg viewBox={`${box.minX - pad} ${box.minY - pad} ${box.maxX - box.minX + pad * 2} ${box.maxY - box.minY + pad * 2}`} role="img" aria-label={label} preserveAspectRatio="xMidYMid meet">
      <path d={loop} className="wk-map__edge" strokeWidth={width * 2.6} />
      <path d={loop} className="wk-map__road" strokeWidth={width * 0.9} />
      {drs &&
        circuit.drsZones.map((zone, index) => {
          const n = circuit.points.length;
          const from = Math.floor(zone.from * n);
          const to = Math.ceil((zone.to < zone.from ? zone.to + 1 : zone.to) * n);
          const points = [];
          for (let k = from; k <= to; k += 1) points.push(circuit.points[((k % n) + n) % n]);
          return <path key={index} d={pathOf(points, false)} className="wk-map__drs" strokeWidth={width * 0.9} />;
        })}
      <line x1={start.x - Math.sin(start.heading) * width * 2} y1={start.y + Math.cos(start.heading) * width * 2} x2={start.x + Math.sin(start.heading) * width * 2} y2={start.y - Math.cos(start.heading) * width * 2} className="wk-map__line" strokeWidth={width * 0.8} />
      {circuit.corners.map((corner) => {
        const apex = circuit.points[corner.apexIndex];
        const heading = circuit.heading[corner.apexIndex];
        const out = -corner.sign * width * 3.4;
        return (
          <text key={corner.number} x={apex.x - Math.sin(heading) * out} y={apex.y + Math.cos(heading) * out} className="wk-map__corner" fontSize={width * 2.4}>
            {corner.number}
          </text>
        );
      })}
    </svg>
  );
};

export default function CircuitCard({ race, year, preview3D = false, drs = year >= 2011 && year <= 2025 }) {
  const circuit = useMemo(() => circuitFor(race, year), [race, year]);
  const asset = useMemo(() => (circuit.splineId ? circuitAssetFor({ splineId: circuit.splineId }) : null), [circuit]);
  const [failed, setFailed] = useState(false);
  const [ready, setReady] = useState(false);
  const show3D = Boolean(preview3D && asset && !failed && canRender3D());
  const kinds = circuit.corners.reduce((counts, corner) => ({ ...counts, [corner.kind]: (counts[corner.kind] || 0) + 1 }), {});
  const slowest = circuit.corners.reduce((best, corner) => (!best || corner.kmh < best.kmh ? corner : best), null);
  const wear = wearFactorFor(race.profile);
  const named = circuit.corners.filter((corner) => corner.name && !/^(curva|turn)\s*\d/i.test(corner.name)).slice(0, 6);

  return (
    <div className="wk-circuit">
      <figure className="wk-circuit__figure">
      <div className="wk-circuit__well">
        {!(show3D && ready) && <CircuitMap circuit={circuit} drs={drs} label={t("Plano del circuito", "Circuit layout")} />}
        {show3D && (
          <React.Suspense fallback={null}>
            <CircuitPreview asset={asset} label={asset.title || t("Circuito en 3D", "Circuit in 3D")} onReady={() => setReady(true)} onError={() => setFailed(true)} />
          </React.Suspense>
        )}
      </div>
        <figcaption className="wk-circuit__caption">
          <span>{show3D && ready ? t("Modelo 3D del circuito", "3D circuit model") : t("Plano · curvas numeradas", "Plan · corners numbered")}</span>
          {show3D && ready && asset.author && (
            <span>
              {asset.source ? (
                <a href={asset.source} target="_blank" rel="noopener noreferrer">
                  {asset.author}
                </a>
              ) : (
                asset.author
              )}
              {asset.license ? ` · ${asset.license}` : ""}
            </span>
          )}
        </figcaption>
      </figure>
      <dl className="wk-facts">
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
          <dd title={t(`${kinds.slow || 0} lentas, ${kinds.medium || 0} medias, ${kinds.fast || 0} rápidas`, `${kinds.slow || 0} slow, ${kinds.medium || 0} medium, ${kinds.fast || 0} fast`)}>
            {circuit.corners.length} <small>{kinds.slow || 0}/{kinds.medium || 0}/{kinds.fast || 0}</small>
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
          <dd>{slowest ? <>{slowest.kmh} km/h <small>{t("C", "T")}{slowest.number}</small></> : "—"}</dd>
        </div>
        <div>
          <dt>{t("Desgaste", "Tyre wear")}</dt>
          <dd>{wear > 1.1 ? t("Alto", "High") : wear > 0.95 ? t("Medio", "Medium") : t("Bajo", "Low")}</dd>
        </div>
        <div>
          <dt>DRS</dt>
          <dd>{drs ? `${circuit.drsZones.length} ${circuit.drsZones.length === 1 ? t("zona", "zone") : t("zonas", "zones")}` : "—"}</dd>
        </div>
      </dl>
      {named.length > 0 && <p className="wk-circuit__names">{named.map((corner) => `${corner.number} ${corner.name}`).join(" · ")}</p>}
    </div>
  );
}
