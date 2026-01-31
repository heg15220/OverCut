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
          "Calcula una expectativa principal (expectedPosScore) según la fuerza del equipo y, además, una expectativa alternativa basada en el nivel del compañero. " +
          "La diferencia con la expectativa del coche (residual) y su versión reescalada (residualScore01) miden si el piloto rinde por encima o por debajo de lo esperado. " +
          "Si el piloto pierde claramente el duelo vs su compañero, se aplica una penalización al rendimiento real (posScorePenalized) y, en ese caso, el residual mostrado pasa a ser el penalizado. " +
          "La medida tmResidualScore01 hace lo mismo pero usando una expectativa basada en el compañero. " +
          "El índice final mezcla ese valor añadido con otros factores (duelos vs compañero, consistencia, fiabilidad y podios; y desde 2003 también ritmo vs compañero por qualy).",

        fieldsTitle: "Campos / KPIs (arriba)",
        fields: [
          {
            k: "Index (0-100) = index100 / index01",
            v:
              "Score final del rendimiento global. index01 está normalizado 0..1 y index100 = index01*100. " +
              "Se calcula ponderando principalmente: valor añadido (residualScore01), duelos vs compañero (tmScore), consistencia, podios y finalizaciones. " +
              "Desde 2003 también puede incluir el componente de ritmo vs compañero basado en qualy."
          },
          {
            k: "Residual (valor añadido) — con posible penalización",
            v:
              "Residual = posScore - expectedPosScore. Positivo = rinde mejor que lo esperado para ese coche; negativo = peor. " +
              "Si existe penalización por perder claramente el duelo vs compañero, entonces el residual 'principal' pasa a ser residualPenalized = posScorePenalized - expectedPosScore, " +
              "y el panel muestra ese residual penalizado como referencia principal."
          },
          {
            k: "Valor añadido (residualScore01)",
            v:
              "Residual reescalado a 0..1 centrado en 0.5. ~0.5 = cumple lo esperado; >0.5 = sobre-rinde; <0.5 = infra-rinde. " +
              "Si hay penalización, se usa residualScore01Penalized como valor principal."
          },
          {
            k: "Valor añadido vs compañero (tmResidualScore01)",
            v:
              "Medida alternativa de valor añadido comparando el rendimiento real (posScore) contra lo esperado según el nivel del compañero (expectedPosScoreFromTm). " +
              "Se reescala a 0..1 centrado en 0.5. Útil cuando la 'fuerza del coche' por constructores no refleja bien el nivel real."
          },
          {
            k: "Pos. media (avgPos) + Grid (gridSize) → posScore (0..1)",
            v:
              "avgPos es la posición media (o métrica equivalente). Se normaliza con el tamaño de parrilla: " +
              "posScore = ((gridSize+1) - avgPos) / gridSize. Más alto = mejores posiciones medias."
          },
          {
            k: "Real (penal.) (posScorePenalized)",
            v:
              "Versión ajustada de posScore que solo baja si el piloto pierde claramente el duelo vs su compañero (tmScore < 0.5). " +
              "Sirve para evitar que un posScore alto por circunstancias (fiabilidad del comp., roles, etc.) oculte una derrota clara dentro del mismo coche. " +
              "En temporadas anteriores a 2003, la penalización se basa solo en tmScore (no usa qualy)."
          },
          {
            k: "Consistencia (consScore) + σ (stddevPos)",
            v:
              "stddevPos es la variabilidad de la posición. Menor σ => más estable. " +
              "consScore combina estabilidad (σ) y 'cumplir expectativas' según el puesto final del equipo en constructores."
          },
          {
            k: "Vs compañero (tmScore)",
            v:
              "Porcentaje de duelos ganados vs su compañero: teammateWins/teammateBattles. 1.0 = gana siempre, 0.0 = pierde siempre. " +
              "También es el disparador principal de la penalización si cae claramente por debajo de 0.5."
          },
          {
            k: "Finaliza (finishRate)",
            v:
              "Ratio de carreras terminadas: finishes / raceCount. 1.0 = termina todas. Aporta fiabilidad."
          },
          {
            k: "Podios (podiumRate)",
            v:
              "Share de podios del piloto respecto a los podios totales del equipo esa temporada (podiums/teamPodiums). 0..1."
          },
          {
            k: "Gap qualy vs comp. (avgQualiGapToTeammateSec) [desde 2003]",
            v:
              "Diferencia media en clasificación en segundos respecto al compañero. Negativo = el piloto es más rápido. " +
              "Solo se calcula desde 2003 (antes no se usa ni afecta a residual ni índice)."
          },
          {
            k: "Ritmo vs comp. (paceVsTeammate01) [desde 2003]",
            v:
              "Conversión del gap de qualy a score 0..1. 0.5 ≈ igualdad; >0.5 = más rápido; <0.5 = más lento. " +
              "Desde 2003 puede entrar como componente del índice; antes de 2003 se considera neutral/no disponible."
          }
        ],

        radarTitle: "Radar (Componentes 0..1)",
        radar:
          "El radar resume componentes normalizados 0..1: Fuerza del equipo, Consistencia, Ritmo vs compañero (desde 2003), Podios, Finaliza y Valor añadido. " +
          "Sirve para ver el perfil del piloto en esa temporada (fortalezas/debilidades).",

        barsTitle: "Barras (Real vs Esperado)",
        bars:
          "Compara el rendimiento real del piloto con lo esperado para su coche. " +
          "Esperado (expectedPosScore) representa el potencial del coche. " +
          "Real se basa en posScore. Si hay una derrota clara vs compañero, se muestra Real (penal.) (posScorePenalized) y ese pasa a ser el 'Real' principal. " +
          "Cuando Real o Real (penal.) supera a Esperado, el residual es positivo (valor añadido)."
      };


      const en = {
        title: "What does this breakdown measure?",
        intro:
          "This panel estimates a driver’s season performance by separating: (1) what the car enables (team strength) and (2) what the driver adds (value-added). " +
          "It computes a primary expectation (expectedPosScore) from team strength and an alternative expectation derived from teammate level. " +
          "The gap vs the team-based expectation (residual) and its rescaled form (residualScore01) indicate over/under-performance. " +
          "If the driver clearly loses the teammate battle, a penalty is applied to the actual score (posScorePenalized) and the displayed residual becomes the penalized one. " +
          "tmResidualScore01 provides a teammate-based value-added view. " +
          "The final index blends value-added with other factors (teammate battles, consistency, reliability and podium share; and from 2003 onward, qualifying-based pace vs teammate).",

        fieldsTitle: "Fields / KPIs (top)",
        fields: [
          {
            k: "Index (0-100) = index100 / index01",
            v:
              "Overall score. index01 is normalized 0..1 and index100 = index01*100. " +
              "Main drivers: value-added (residualScore01), teammate battles (tmScore), consistency, podium share and finish rate. " +
              "From 2003 onward it may also include qualifying-based pace vs teammate."
          },
          {
            k: "Residual (value added) — with optional penalty",
            v:
              "Residual = posScore - expectedPosScore. Positive = better than expected for the car; negative = worse. " +
              "If a clear teammate loss is detected, the main residual becomes residualPenalized = posScorePenalized - expectedPosScore, " +
              "and the panel treats the penalized residual as the primary reference."
          },
          {
            k: "Value added (residualScore01)",
            v:
              "Residual rescaled to 0..1 centered at 0.5. ~0.5 = meets expectation; >0.5 = overperforms; <0.5 = underperforms. " +
              "If a penalty exists, residualScore01Penalized is used as the main value."
          },
          {
            k: "Value added vs teammate (tmResidualScore01)",
            v:
              "Alternative value-added metric comparing actual performance (posScore) against an expectation derived from teammate level (expectedPosScoreFromTm). " +
              "Rescaled to 0..1 centered at 0.5. Useful when constructor-based car strength is misleading."
          },
          {
            k: "Avg position (avgPos) + Grid (gridSize) → posScore (0..1)",
            v:
              "avgPos is the average race position (or equivalent metric). It is normalized using grid size: " +
              "posScore = ((gridSize+1) - avgPos) / gridSize. Higher = better average results."
          },
          {
            k: "Actual (pen.) (posScorePenalized)",
            v:
              "Adjusted version of posScore that only decreases when the driver clearly loses to the teammate (tmScore < 0.5). " +
              "Helps prevent unusually strong results from masking a clear within-car deficit. " +
              "Before 2003, the penalty relies only on tmScore (no qualifying pace is used)."
          },
          {
            k: "Consistency (consScore) + σ (stddevPos)",
            v:
              "stddevPos is the position variability. Lower σ = more stable. " +
              "consScore blends stability (σ) and meeting expectations based on final constructors rank."
          },
          {
            k: "Vs teammate (tmScore)",
            v:
              "Share of teammate battles won: teammateWins/teammateBattles. 1.0 = always wins, 0.0 = always loses. " +
              "It also acts as the main trigger for the penalty when it drops clearly below 0.5."
          },
          {
            k: "Finish rate (finishRate)",
            v:
              "Race completion rate: finishes / raceCount. Reliability component."
          },
          {
            k: "Podium share (podiumRate)",
            v:
              "Driver’s share of team podiums in the season (podiums/teamPodiums). 0..1."
          },
          {
            k: "Quali gap vs teammate (avgQualiGapToTeammateSec) [from 2003]",
            v:
              "Average qualifying time difference in seconds vs teammate. Negative = driver is faster. " +
              "Computed only from 2003 onward (before 2003 it is not used and does not affect residual or index)."
          },
          {
            k: "Pace vs teammate (paceVsTeammate01) [from 2003]",
            v:
              "Transforms quali gap into a 0..1 score. 0.5 ≈ equal pace; >0.5 faster; <0.5 slower. " +
              "From 2003 onward it may contribute to the index; before 2003 it is treated as neutral/not available."
          }
        ],

        radarTitle: "Radar (Components 0..1)",
        radar:
          "Radar summarizes normalized components: Team strength, Consistency, Pace vs teammate (from 2003), Podiums, Finishes and Value added. " +
          "It’s a profile view (strengths/weaknesses), not an absolute ranking.",

        barsTitle: "Bars (Actual vs Expected)",
        bars:
          "Compares the driver’s actual performance with what the car is expected to deliver. " +
          "Expected (expectedPosScore) represents car potential. " +
          "Actual is based on posScore. If a clear teammate loss is detected, an additional Actual (pen.) (posScorePenalized) is shown and becomes the primary 'Actual'. " +
          "When Actual or Actual (pen.) exceeds Expected, the residual is positive (value added)."
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
          value: (() => {
            const hasPen =
              breakdown.posScorePenalized !== null &&
              breakdown.posScorePenalized !== undefined &&
              Number.isFinite(Number(breakdown.posScorePenalized));

            // si hay penalización, el residual “principal” debe ser el penalizado
            const v = hasPen ? breakdown.residualPenalized : breakdown.residual;
            return fmt3(v);
          })(),
          sub: (() => {
            const hasPen =
              breakdown.posScorePenalized !== null &&
              breakdown.posScorePenalized !== undefined &&
              Number.isFinite(Number(breakdown.posScorePenalized));

            const base = `${t.valueAdded[lang]}: ${fmt3(
              hasPen ? breakdown.residualScore01Penalized : breakdown.residualScore01
            )}`;

            if (!hasPen) return base;

            // opcional: enseñar el raw como referencia
            const raw = `${lang === "es" ? "Raw" : "Raw"}: ${fmt3(breakdown.residualScore01)}`;

            return base + ` · ${raw}`;
          })()
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
  // ✅ 3) Mini-bar “Expected vs Actual posScore”
  const barsOption = useMemo(() => {
    const expected = clamp01(breakdown.expectedPosScore);
    const actualRaw = clamp01(breakdown.posScore);

    // penalización: puede no venir
    const hasPen =
      breakdown.posScorePenalized !== null &&
      breakdown.posScorePenalized !== undefined &&
      Number.isFinite(Number(breakdown.posScorePenalized));

    const actualPen = hasPen ? clamp01(breakdown.posScorePenalized) : null;

    // ✅ series dinámicas
    const series = [
      { name: t.expected[lang], type: "bar", data: [expected], barWidth: 26 },

      ...(hasPen
        ? [
            { name: lang === "es" ? "Real" : "Actual (pen.)", type: "bar", data: [actualPen], barWidth: 26 }
          ]
        : [
            { name: lang === "es" ? "Real" : "Actual", type: "bar", data: [actualRaw], barWidth: 26 }
          ])
    ];


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
          // params puede traer 2 o 3 series
          return (params || [])
            .map((p) => `${p.marker} ${p.seriesName}: ${(p.value * 100).toFixed(1)}%`)
            .join("<br/>");
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
      series,
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
