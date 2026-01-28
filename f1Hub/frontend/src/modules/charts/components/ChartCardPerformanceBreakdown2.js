// src/modules/charts/components/ChartCardPerformanceBreakdown2.jsx
import React, { useMemo } from "react";
import ReactECharts from "echarts-for-react";
import "./ChartStyles.css";

const clamp01 = (v) => {
  const n = Number(v);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
};

const fmt3 = (v) => (Number.isFinite(v) ? v.toFixed(3) : "-");
const fmt1 = (v) => (Number.isFinite(v) ? v.toFixed(1) : "-");

export default function ChartCardPerformanceBreakdown2({ breakdown, lang = "es" }) {
  if (!breakdown) return null;

  const t = {
    title: { es: "Breakdown de rendimiento", en: "Performance breakdown" },
    subtitle: {
      es: "Radar de componentes + valor añadido (residual) y rendimiento real vs esperado",
      en: "Component radar + value added (residual) and actual vs expected performance"
    },
    kpiIndex: { es: "Index (0-100)", en: "Index (0-100)" },
    kpiResidual: { es: "Residual", en: "Residual" },
    kpiValueAdded: { es: "Valor añadido", en: "Value added" }, // ✅ (si quieres separar residual vs score)
    kpiValueAddedTm: { es: "Valor añadido vs comp.", en: "Value added vs tm" }, // ✅ NUEVO
    kpiAvgPos: { es: "Pos. media", en: "Avg pos" },
    kpiConsistency: { es: "Consistencia", en: "Consistency" },
    kpiTM: { es: "Vs compañero", en: "Vs teammate" },
    kpiFinish: { es: "Finaliza", en: "Finishes" },
    kpiPodiums: { es: "Podios", en: "Podiums" },
    radarTitle: { es: "Componentes (0..1)", en: "Components (0..1)" },
    barsTitle: { es: "Real vs Esperado (posición)", en: "Actual vs Expected (position)" },
    expected: { es: "Esperado", en: "Expected" },
    actual: { es: "Real", en: "Actual" },
    valueAdded: { es: "Valor añadido", en: "Value added" },
    kpiQualiGap: { es: "Gap qualy vs comp.", en: "Quali gap vs tm" },
    kpiPace: { es: "Ritmo vs comp.", en: "Pace vs tm" },

  };

    // ✅ Explicación detallada (qué mide y qué significa cada campo)
    const explain = useMemo(() => {
      const es = {
        title: "¿Qué mide este breakdown?",
        intro:
          "Este panel estima el rendimiento de un piloto en una temporada separando: (1) lo que 'permite' el coche (fuerza del equipo) y (2) lo que aporta el piloto (valor añadido). " +
          "Para ello calcula una expectativa principal (expectedPosScore) según la fuerza del equipo y, además, una expectativa alternativa basada en el nivel del compañero. " +
          "La diferencia con la expectativa del equipo (residual) y su versión reescalada (residualScore01) miden si el piloto rinde por encima o por debajo de lo esperado. " +
          "La nueva medida tmResidualScore01 hace lo mismo pero usando la expectativa basada en el compañero. " +
          "El índice final mezcla ese valor añadido con otros factores (ritmo vs compañero, consistencia, fiabilidad y podios).",


        fieldsTitle: "Campos / KPIs (arriba)",
        fields: [
          {
            k: "Index (0-100) = index100 / index01",
            v:
              "Score final del rendimiento global. index01 está normalizado 0..1 y index100 = index01*100. " +
              "Se calcula ponderando: valor añadido (residualScore01), vs compañero, consistencia, podios y finalizaciones."
          },
          {
            k: "Valor añadido vs compañero (tmResidualScore01)",
            v:
              "Nueva medida de valor añadido comparando el rendimiento real (posScore) contra lo esperado según el nivel del compañero (expectedPosScoreFromTm). " +
              "Se reescala a 0..1 centrado en 0.5: ~0.5 = cumple; >0.5 = rinde por encima; <0.5 = por debajo. " +
              "Es útil cuando la 'fuerza del coche' estimada por clasificación de constructores no refleja bien el rendimiento real del coche."
          },

          {
            k: "Residual = posScore - expectedPosScore",
            v:
              "Valor añadido puro. Positivo = rinde mejor que lo esperado para ese coche. Negativo = peor. " +
              "Ojo: está en escala 0..1 (porque posScore y expectedPosScore están en 0..1), no en posiciones."
          },
          {
            k: "Valor añadido (residualScore01)",
            v:
              "Residual reescalado a 0..1 centrado en 0.5. ~0.5 = cumple lo esperado; >0.5 = sobre-rinde; <0.5 = infra-rinde. " +
              "Se usa como componente principal del índice."
          },
          {
            k: "Pos. media (avgPos) + Grid (gridSize)",
            v:
              "avgPos es la posición media en carrera (o métrica equivalente según tu view). gridSize es el tamaño de parrilla usado para normalizar. " +
              "De aquí sale posScore (0..1)."
          },
          {
            k: "posScore (0..1)",
            v:
              "Normalización de avgPos: posScore = ((gridSize+1) - avgPos) / gridSize. " +
              "Más alto = mejores posiciones medias (cerca de P1)."
          },
          {
            k: "Consistencia (consScore) + σ (stddevPos)",
            v:
              "stddevPos es la desviación típica de la posición (variabilidad). Menor σ => más estable. " +
              "consScore combina estabilidad (σ) y 'cumplir expectativas' según el puesto final del equipo en constructores."
          },
          {
            k: "Vs compañero (tmScore)",
            v:
              "Porcentaje de duelos ganados vs su compañero: teammateWins/teammateBattles. 1.0 = gana siempre, 0.0 = pierde siempre. " +
              "Es un proxy del rendimiento relativo dentro del mismo coche."
          },
          {
            k: "Finaliza (finishRate)",
            v:
              "Ratio de carreras terminadas: finishes / raceCount. 1.0 = termina todas. " +
              "Aporta fiabilidad/consistencia de resultados."
          },
          {
            k: "Podios (podiumRate)",
            v:
              "Share de podios del piloto respecto a los podios totales del equipo esa temporada (podiums/teamPodiums). " +
              "0..1. Valora quién capitaliza las oportunidades del coche."
          },
          {
            k: "Gap qualy vs comp. (avgQualiGapToTeammateSec)",
            v:
              "Diferencia media en clasificación en segundos respecto a su compañero. Negativo = el piloto es más rápido. " +
              "Es la base numérica para derivar el score de ritmo vs compañero."
          },
          {
            k: "Ritmo vs comp. (paceVsTeammate01)",
            v:
              "Conversión del gap de qualy a un score 0..1. 0.5 ≈ igualdad; >0.5 = mejor que el compañero; <0.5 = peor. " +
              "Se usa en el radar y puede reemplazar/acompañar a tmScore."
          }
        ],

        radarTitle: "Radar (Componentes 0..1)",
        radar:
          "El radar resume 6 componentes normalizados 0..1: Fuerza del equipo, Consistencia, Ritmo vs compañero, Podios, Finaliza y Valor añadido. " +
          "No es un 'ranking absoluto': sirve para ver el perfil del piloto (fortalezas/debilidades) en esa temporada.",

        barsTitle: "Barras (Real vs Esperado)",
        bars:
          "Compara posScore (lo real, derivado de avgPos) contra expectedPosScore (lo esperable por coche). " +
          "Si la barra Real supera a Esperado => residual positivo (valor añadido)."
      };

      const en = {
        title: "What does this breakdown measure?",
        intro:
          "This panel estimates a driver’s season performance by separating: (1) what the car enables (team strength) and (2) what the driver adds (value-added). " +
          "It computes a primary expectation (expectedPosScore) from team strength and also an alternative expectation derived from the teammate level. " +
          "The gap vs the team-based expectation (residual) and its rescaled form (residualScore01) indicate over/under-performance. " +
          "The new tmResidualScore01 does the same but using the teammate-based expectation. " +
          "The final index blends that value-added with other factors (teammate pace, consistency, reliability and podium contribution).",


        fieldsTitle: "Fields / KPIs (top)",
        fields: [
          {
            k: "Index (0-100) = index100 / index01",
            v:
              "Overall score. index01 is normalized 0..1 and index100 = index01*100. " +
              "Built from: value-added (residualScore01), vs teammate, consistency, podium share and finish rate."
          },
          {
            k: "Residual = posScore - expectedPosScore",
            v:
              "Pure value-added. Positive = better than expected for the car. Negative = worse. " +
              "Note: it’s on a 0..1 scale (since both scores are 0..1), not in grid positions."
          },
          {
            k: "Value added (residualScore01)",
            v:
              "Residual rescaled to 0..1 centered at 0.5. ~0.5 = meets expectation; >0.5 = overperforms; <0.5 = underperforms."
          },
          {
            k: "Value added vs teammate (tmResidualScore01)",
            v:
              "New value-added metric comparing actual performance (posScore) against an expectation derived from the teammate level (expectedPosScoreFromTm). " +
              "Rescaled to 0..1 centered at 0.5: ~0.5 = meets; >0.5 = overperforms; <0.5 = underperforms. " +
              "Useful when constructor-based car strength does not capture the true car level."
          },

          {
            k: "Avg position (avgPos) + Grid (gridSize)",
            v:
              "avgPos is the average race position (or equivalent metric from your view). gridSize is used for normalization into posScore."
          },
          {
            k: "posScore (0..1)",
            v:
              "Normalized average position: posScore = ((gridSize+1) - avgPos) / gridSize. Higher = better average results."
          },
          {
            k: "Consistency (consScore) + σ (stddevPos)",
            v:
              "stddevPos is the position standard deviation (variability). Lower σ = more stable. " +
              "consScore blends stability (σ) and meeting expectations based on final constructors rank."
          },
          {
            k: "Vs teammate (tmScore)",
            v:
              "Share of teammate battles won: teammateWins/teammateBattles. Proxy for within-team performance."
          },
          {
            k: "Finish rate (finishRate)",
            v:
              "Race completion rate: finishes / raceCount. Reliability component."
          },
          {
            k: "Podium share (podiumRate)",
            v:
              "Driver’s share of team podiums in the season (podiums/teamPodiums). 0..1. Measures opportunity conversion."
          },
          {
            k: "Quali gap vs teammate (avgQualiGapToTeammateSec)",
            v:
              "Average qualifying time difference in seconds vs teammate. Negative = driver is faster."
          },
          {
            k: "Pace vs teammate (paceVsTeammate01)",
            v:
              "Transforms quali gap into a 0..1 score. 0.5 ≈ equal pace; >0.5 faster; <0.5 slower."
          }
        ],

        radarTitle: "Radar (Components 0..1)",
        radar:
          "Radar summarizes 6 normalized components: Team strength, Consistency, Pace vs teammate, Podiums, Finishes and Value added. " +
          "It’s a profile view (strengths/weaknesses), not an absolute ranking.",

        barsTitle: "Bars (Actual vs Expected)",
        bars:
          "Compares actual posScore vs expectedPosScore (from car strength). " +
          "If Actual > Expected => positive residual (value added)."
      };

      return lang === "es" ? es : en;
    }, [lang]);


  // ✅ 1) KPIs (arriba)
  const kpis = useMemo(() => {
    const consStd = Number(breakdown.stddevPos);
    const consBadge =
      consStd <= 3.0 ? (lang === "es" ? "Muy alta" : "Very high") :
      consStd <= 5.0 ? (lang === "es" ? "Alta" : "High") :
      consStd <= 7.0 ? (lang === "es" ? "Media" : "Medium") :
      (lang === "es" ? "Baja" : "Low");

    const tmRate =
      breakdown.teammateBattles > 0
        ? breakdown.teammateWins / breakdown.teammateBattles
        : null;

    return [
      {
        label: t.kpiIndex[lang],
        value: fmt1(breakdown.index100),
        sub: `${fmt3(breakdown.index01)} / 1.000`
      },
      {
        label: t.kpiResidual[lang],
        value: fmt3(breakdown.residual),
        sub: `${t.valueAdded[lang]}: ${fmt3(breakdown.residualScore01)}`
      },
      {
        label: t.kpiAvgPos[lang],
        value: `${fmt1(breakdown.avgPos)}`,
        sub: `${lang === "es" ? "Grid" : "Grid"}: ${breakdown.gridSize}`
      },
      {
        label: t.kpiConsistency[lang],
        value: consBadge,
        sub: `σ = ${fmt3(breakdown.stddevPos)}`
      },
      {
        label: t.kpiTM[lang],
        value:
          tmRate == null
            ? "-"
            : `${Math.round(tmRate * 100)}%`,
        sub: `${breakdown.teammateWins}/${breakdown.teammateBattles}`
      },
      {
        label: t.kpiFinish[lang],
        value: `${Math.round(clamp01(breakdown.finishRate) * 100)}%`,
        sub: `${breakdown.finishes}/${breakdown.raceCount}`
      },
      {
        label: t.kpiPodiums[lang],
        value: `${Math.round(clamp01(breakdown.podiumRate) * 100)}%`,
        sub: `${breakdown.podiums}/${breakdown.raceCount}`
      },
      {
        label: t.kpiQualiGap[lang],
        // en segundos; negativo => mejor
        value: Number.isFinite(Number(breakdown.avgQualiGapToTeammateSec))
          ? `${Number(breakdown.avgQualiGapToTeammateSec).toFixed(3)}s`
          : "-",
        sub: lang === "es" ? "Negativo = más rápido" : "Negative = faster"
      },
      {
        label: t.kpiPace[lang],
        value: `${Math.round(clamp01(breakdown.paceVsTeammate01) * 100)}%`,
        sub: `${(clamp01(breakdown.paceVsTeammate01)).toFixed(3)} / 1.000`
      },

      {
        label: lang === "es" ? "VA vs comp." : "VA vs teammate",
        value: `${Math.round(clamp01(breakdown.tmResidualScore01) * 100)}%`,
        sub: `${clamp01(breakdown.tmResidualScore01).toFixed(3)} / 1.000`
      }

    ];
  }, [breakdown, lang]);

  // ✅ 2) Radar (lo bonito)
  const radarOption = useMemo(() => {
    const indicators = [
      { name: lang === "es" ? "Fuerza equipo" : "Team strength", max: 1 },
      { name: lang === "es" ? "Consistencia" : "Consistency", max: 1 },
      { name: lang === "es" ? "Ritmo vs comp." : "Pace vs tm", max: 1 },
      { name: lang === "es" ? "Podios" : "Podiums", max: 1 },
      { name: lang === "es" ? "Finaliza" : "Finishes", max: 1 },
      { name: lang === "es" ? "Valor añadido" : "Value added", max: 1 }
    ];

    const values = [
      clamp01(breakdown.teamStrength01),
      clamp01(breakdown.consScore),
      clamp01(breakdown.paceVsTeammate01),
      clamp01(breakdown.podiumRate),
      clamp01(breakdown.finishRate),
      clamp01(breakdown.residualScore01)
    ];

    return {
      backgroundColor: "transparent",
      title: {
        text: t.radarTitle[lang],
        left: "center",
        top: 0,
        textStyle: {
          color: "#ffcc00",
          fontSize: 14,
          fontFamily: "F1 Bold, sans-serif"
        }
      },
      tooltip: {
        trigger: "item",
        backgroundColor: "#1e1e1e",
        borderColor: "#444",
        borderWidth: 1,
        textStyle: { color: "#fff" },
        formatter: (p) => {
          const v = p?.value || [];
          const rows = indicators.map((ind, i) => {
            const pct = Math.round((v[i] ?? 0) * 100);
            return `${ind.name}: ${pct}%`;
          });
          return `<b>${lang === "es" ? "Componentes" : "Components"}</b><br/>${rows.join("<br/>")}`;
        }
      },
      radar: {
        radius: "64%",
        splitNumber: 4,
        axisName: {
          color: "#ddd",
          fontSize: 12,
          fontFamily: "F1 Regular, sans-serif"
        },
        splitLine: { lineStyle: { color: "rgba(255,255,255,0.12)" } },
        splitArea: {
          areaStyle: {
            color: ["rgba(255,255,255,0.02)", "rgba(255,255,255,0.00)"]
          }
        },
        axisLine: { lineStyle: { color: "rgba(255,255,255,0.15)" } },
        indicator: indicators
      },
      series: [
        {
          type: "radar",
          data: [
            {
              value: values,
              name: t.title[lang],
              areaStyle: { opacity: 0.22 },
              lineStyle: { width: 2 },
              symbol: "circle",
              symbolSize: 6
            }
          ]
        }
      ]
    };
  }, [breakdown, lang]);

  // ✅ 3) Mini-bar “Expected vs Actual posScore”
  const barsOption = useMemo(() => {
    const expected = clamp01(breakdown.expectedPosScore);
    const actual = clamp01(breakdown.posScore);

    return {
      backgroundColor: "transparent",
      title: {
        text: t.barsTitle[lang],
        left: "center",
        top: 0,
        textStyle: {
          color: "#ffcc00",
          fontSize: 14,
          fontFamily: "F1 Bold, sans-serif"
        }
      },
      grid: { top: 50, left: "8%", right: "8%", bottom: 18, containLabel: true },
      tooltip: {
        trigger: "axis",
        backgroundColor: "#1e1e1e",
        borderColor: "#444",
        borderWidth: 1,
        textStyle: { color: "#fff" },
        axisPointer: { type: "shadow" },
        formatter: (params) => {
          const p0 = params?.[0];
          const p1 = params?.[1];
          const a = p0 ? `${p0.marker} ${p0.seriesName}: ${(p0.value * 100).toFixed(1)}%` : "";
          const b = p1 ? `<br/>${p1.marker} ${p1.seriesName}: ${(p1.value * 100).toFixed(1)}%` : "";
          return a + b;
        }
      },
      xAxis: {
        type: "category",
        data: [lang === "es" ? "PosScore" : "PosScore"],
        axisLabel: { color: "#ccc" },
        axisLine: { lineStyle: { color: "#777" } }
      },
      yAxis: {
        type: "value",
        min: 0,
        max: 1,
        axisLabel: { color: "#ccc", formatter: (v) => `${Math.round(v * 100)}%` },
        axisLine: { lineStyle: { color: "#777" } },
        splitLine: { lineStyle: { color: "#444", type: "dashed" } }
      },
      series: [
        {
          name: t.expected[lang],
          type: "bar",
          data: [expected],
          barWidth: 32,
          itemStyle: { borderRadius: [10, 10, 0, 0] }
        },
        {
          name: t.actual[lang],
          type: "bar",
          data: [actual],
          barWidth: 32,
          itemStyle: { borderRadius: [10, 10, 0, 0] }
        }
      ],
      legend: {
        top: 26,
        textStyle: { color: "#ccc" }
      }
    };
  }, [breakdown, lang]);

  return (
    <div className="chart-card">
      <div style={{ textAlign: "center", marginBottom: 12 }}>
        <div className="chart-title" style={{ marginBottom: 4 }}>
          {t.title[lang]} — {breakdown.year}
        </div>
        <div style={{ color: "#ccc", fontStyle: "italic", fontSize: 13 }}>
          {t.subtitle[lang]}
        </div>

              {/* ✅ Explicación detallada */}
              <details
                style={{
                  marginTop: 10,
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 14,
                  padding: "10px 12px",
                  color: "#ddd",
                  textAlign: "left"
                }}
              >
                <summary style={{ cursor: "pointer", color: "#ffcc00", fontFamily: "F1 Bold, sans-serif" }}>
                  {explain.title}
                </summary>

                <div style={{ marginTop: 10, color: "#cfcfcf", fontSize: 13, lineHeight: 1.45 }}>
                  <p style={{ margin: "0 0 10px 0" }}>{explain.intro}</p>

                  <div style={{ margin: "10px 0 6px 0", color: "#ffcc00", fontFamily: "F1 Bold, sans-serif" }}>
                    {explain.fieldsTitle}
                  </div>

                  <ul style={{ margin: 0, paddingLeft: 18 }}>
                    {explain.fields.map((f, i) => (
                      <li key={i} style={{ marginBottom: 8 }}>
                        <span style={{ color: "#fff", fontFamily: "F1 Bold, sans-serif" }}>{f.k}:</span>{" "}
                        <span style={{ color: "#cfcfcf" }}>{f.v}</span>
                      </li>
                    ))}
                  </ul>

                  <div style={{ margin: "12px 0 6px 0", color: "#ffcc00", fontFamily: "F1 Bold, sans-serif" }}>
                    {explain.radarTitle}
                  </div>
                  <p style={{ margin: 0 }}>{explain.radar}</p>

                  <div style={{ margin: "12px 0 6px 0", color: "#ffcc00", fontFamily: "F1 Bold, sans-serif" }}>
                    {explain.barsTitle}
                  </div>
                  <p style={{ margin: 0 }}>{explain.bars}</p>
                </div>
              </details>

      </div>

      {/* ✅ KPI row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
          gap: 10,
          marginBottom: 14
        }}
      >
        {kpis.map((k, idx) => (
          <div
            key={idx}
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 14,
              padding: "10px 12px"
            }}
          >
            <div style={{ color: "#bbb", fontSize: 12, marginBottom: 4 }}>{k.label}</div>
            <div style={{ fontFamily: "F1 Bold, sans-serif", fontSize: 18, color: "#fff" }}>
              {k.value}
            </div>
            <div style={{ color: "#9aa0a6", fontSize: 12, marginTop: 2 }}>{k.sub}</div>
          </div>
        ))}
      </div>

      {/* ✅ Two-panels: Radar + Bars */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.25fr 0.9fr",
          gap: 12,
          alignItems: "stretch"
        }}
      >
        <div
          style={{
            background: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 16,
            padding: 10
          }}
        >
          <ReactECharts option={radarOption} style={{ height: 360, width: "100%" }} />
        </div>

        <div
          style={{
            background: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 16,
            padding: 10
          }}
        >
          <ReactECharts option={barsOption} style={{ height: 360, width: "100%" }} />
        </div>
      </div>

      {/* ✅ Notes */}
      {breakdown.notes ? (
        <div style={{ marginTop: 12, color: "#9aa0a6", fontSize: 12, opacity: 0.95 }}>
          <b style={{ color: "#ccc" }}>notes:</b> {breakdown.notes}
        </div>
      ) : null}
    </div>
  );
}
