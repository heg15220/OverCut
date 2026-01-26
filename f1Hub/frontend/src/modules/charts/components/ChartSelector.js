import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import charts from "../index";
import ChartCardPie from "./ChartCardPie";
import ChartCard from "./ChartCard";
import ChartCardColored from "./ChartCardColored";
import ChartCardScatter from "./ChartCardScatter";
import ChartCardBarColored from "./ChartCardBarColored";
import "./ChartStyles.css";
import { buildChartKey } from "../utils/chartKey";

const ChartSelector = () => {
  const dispatch = useDispatch();
  const [category, setCategory] = useState(null);
  const [selected, setSelected] = useState(null);
  const [driverId, setDriverId] = useState("");
  const [constructorId, setConstructorId] = useState("");
  const [season, setSeason] = useState("");
  const [limit, setLimit] = useState(10);
  const [decade, setDecade] = useState("");
  const [circuitRef, setCircuitRef] = useState("");


  const filters = useSelector(charts.selectors.getChartFilters);
  const chartKey = selected
    ? buildChartKey(selected.endpoint, { driverId, constructorId, season, limit, circuitRef, decade })
    : null;
  const chart = useSelector(state =>
    chartKey ? charts.selectors.getChartByEndpoint(state, chartKey) : null
  );

  const lang = navigator.language.startsWith("es") ? "es" : "en";

  const i18n = {
    title: {
      es: "🎛️ Gráficos con Filtros Avanzados",
      en: "🎛️ Advanced Filtered Charts"
    },
    categories: {
      Pilotos: lang === "es" ? "Pilotos" : "Drivers",
      Constructores: lang === "es" ? "Constructores" : "Constructors",
      Carreras: lang === "es" ? "Carreras" : "Races",
      Circuitos: lang === "es" ? "Circuitos": "Circuits"
    },
    selectDriver: {
      es: "Seleccione piloto",
      en: "Select driver"
    },
    selectConstructor: {
      es: "Seleccione equipo",
      en: "Select constructor"
    },
    selectSeason: {
      es: "Seleccione temporada",
      en: "Select season"
    },
    selectDecade: {
      es: "Seleccione década",
      en: "Select decade"
    },
    decades: {
      "1980s": lang === "es" ? "Década de 1980" : "1980s",
      "1990s": lang === "es" ? "Década de 1990" : "1990s",
      "2000s": lang === "es" ? "Década de 2000" : "2000s",
      "2010s": lang === "es" ? "Década de 2010" : "2010s",
      "2020s": lang === "es" ? "Década de 2020" : "2020s"
    },
    topNPlaceholder: {
      es: "Top N",
      en: "Top N"
    },
    showButton: {
      es: "Mostrar",
      en: "Show"
    },
    loadChartMsg: {
      es: "Cargue los filtros para ver el gráfico.",
      en: "Load filters to view chart."
    },
    selectMsg: {
      es: "Seleccione una categoría y gráfica.",
      en: "Select a category and chart."
    }
  };

  useEffect(() => {
    dispatch(charts.actions.fetchChartFilters());
  }, [dispatch]);

  const handleFetch = () => {
    if (!selected) return;

    const params = {};
    if (selected.param === "driverId" && driverId) params.driverId = driverId;
    if (selected.param === "constructorId" && constructorId) params.constructorId = constructorId;
    if (selected.param === "season" && season) params.season = season;
    if (selected.param === "circuitRef" && circuitRef) params.circuitRef = circuitRef;
    if (decade) params.decade = decade;

    const key = buildChartKey(selected.endpoint, params);
    dispatch(charts.actions.fetchChartData(selected.endpoint, params));
  };

  const chartOptions = {
    Pilotos: [
      { endpoint: "avg-positions-gained-by-season", label: { es: "Posiciones Ganadas por Temporada", en: "Positions Gained per Season" }, param: "driverId", chartType: "line" },
      { endpoint: "points-delta-vs-teammate", label: { es: "Δ Puntos por Temporada", en: "Points Δ per Season" }, param: "season", chartType: "bar" },
      { endpoint: "victory-percentage-by-decade", label: { es: "Porcentaje de Victorias por Década", en: "Win % by Decade" }, param: "decade", chartType: "pie" },
      { endpoint: "average-points-per-season", label: { es: "Promedio de Puntos por Década", en: "Avg Points by Decade" }, param: "decade", chartType: "line" },
      { endpoint: "most-common-quali-position", label: { es: "Posición de Clasificación Más Frecuente", en: "Most Common Quali Position" }},
      { endpoint: "quali-vs-teammate-comparison", label: { es: "Rendimiento en Clasificación vs Compañero", en: "Quali Performance vs Teammate" }, param: "driverId"},
      { endpoint: "race-vs-teammate-comparison", label: { es: "Rendimiento en Carrera vs Compañero", en: "Race Performance vs Teammate" }, param: "driverId"},
      { endpoint: "championship-progress-top2", label: { es: "Seguimiento Top 2 Campeonato", en: "Championship progress top 2"}, param: "season"},
      { endpoint: "average-start-position", label: { es: "Posición Media de Salida", en: "Average Start Position" }, param: "decade", chartType: "bar" },
      { endpoint: "average-finish-position", label: { es: "Posición Media de Llegada", en: "Average Finish Position" }, param: "decade", chartType: "bar" },
      { endpoint: "performance-trajectory", label: { es: "Trayectoria de Rendimiento", en: "Performance Trajectory" }, param: "driverId", chartType: "line" },
      { endpoint: "most-improved-drivers", label: { es: "Pilotos Más Mejorados en Década", en: "Most Improved Drivers by Decade" }, param: "decade", chartType: "bar" },
    ],
    Constructores: [
      {
        endpoint: "constructor-performance-trajectory",
        label: {
          es: "Trayectoria de Rendimiento por Equipo",
          en: "Team Performance Trajectory"
        },
        param: "constructorId",
        chartType: "line"
      },
      {
        endpoint: "reliability-by-season",
        label: {
            es: "Fiabilidad por Temporada",
            en: "Reliability by Season"
        },
        param: "decade",
        chartType: "line"
      },

    {
      endpoint: "team-performance-gap",
      label: { es: "Gap medio de rendimiento (equipos)", en: "Team performance gap" },
      param: "season",
      chartType: "bar"
    },

    ],
    Carreras: [
      { endpoint: "pitstops-per-race", label: { es: "Pitstops por Carrera", en: "Pitstops per Race" }, param: "season", chartType: "line" },
      { endpoint: "overtakes-per-race", label: { es: "Cambios de Posición por Carrera", en: "Overtakes per Race" }, param: "season", chartType: "bar" },
      { endpoint: "fastest-pitstop-per-race", label: { es: "Pitstop Más Rápido por Carrera", en: "Fastest Pitstop per Race" }, param: "season", chartType: "bar" },
      { endpoint: "race-leaders-per-gp", label: { es: "Líderes por Gran Premio", en: "Leaders per Grand Prix" }, param: "season", chartType: "bar" },
      { endpoint: "average-retirements-by-season", label: { es: "Abandonos Promedio por Temporada", en: "Average Retirements per Season"}, param: "decade", chartType: "line"},
      { endpoint: "average-accidents-by-season", label: { es: "Accidentes Promedio por Temporada", en: "Average Accidents per Season"}, param: "decade", chartType: "line"}
    ],
    Circuitos: [
      { endpoint: "best-drivers-per-circuit", label: { es: "Mejores Pilotos por Circuito", en: "Best Drivers per Circuit" }, param: "circuitRef", chartType: "bar" },
      { endpoint: "constructor-dominance-circuit", label: { es: "Dominio de Constructores", en: "Constructor Dominance" }, param: "circuitRef", chartType: "bar" }
    ]
  };

  const chartRenderMap = {
    "podium-percentage-vs-teammate": ChartCard,
    "avg-positions-gained-by-season": ChartCard,
    "points-delta-vs-teammate": ChartCard,
    "victory-percentage-by-decade": ChartCardPie,
    "average-points-per-season": ChartCardColored,
    "avg-team-points-by-season": ChartCard,
    "pitstops-per-race": ChartCard,
    "overtakes-per-race": ChartCard,
    "most-common-quali-position": ChartCardBarColored,
    "average-finish-position": ChartCardBarColored,
    "average-start-position": ChartCardBarColored,
    "race-leaders-per-gp": ChartCardColored,
    "reliability-by-season": ChartCardColored,
    "team-performance-gap": ChartCardBarColored , // o ChartCard


  };

  const getChartComponent = (endpoint, chartType) => {
    return chartRenderMap[endpoint] || (chartType === "pie" ? ChartCardPie : ChartCard);
  };

  return (
    <div className="chart-selector-container">
      <h2 className="chart-selector-title">{i18n.title[lang]}</h2>

      <div className="flex gap-3 flex-wrap justify-center mb-4">
        {Object.keys(chartOptions).map(cat => (
          <button
            key={cat}
            onClick={() => {
              setCategory(cat);
              setSelected(chartOptions[cat][0]);
              setDriverId("");
              setConstructorId("");
              setSeason("");
              setDecade("");
              setLimit(10);
            }}
            className={`selector-button ${category === cat ? "active" : ""}`}
          >
            {i18n.categories[cat]}
          </button>
        ))}
      </div>

      {category && selected && (
        <div className="race-selector">
          <select
            value={selected.endpoint}
            onChange={e =>
              setSelected(chartOptions[category].find(c => c.endpoint === e.target.value))
            }
          >
            {chartOptions[category].map(opt => (
              <option key={opt.endpoint} value={opt.endpoint}>
                {opt.label?.[lang] || opt.endpoint}
              </option>
            ))}
          </select>

          {selected.param === "driverId" && (
            <select value={driverId} onChange={e => setDriverId(e.target.value)}>
              <option value="">{i18n.selectDriver[lang]}</option>
              {filters.drivers?.map(d => (
                <option key={d.driverId} value={d.driverId}>{d.name}</option>
              ))}
            </select>
          )}

          {selected.param === "constructorId" && (
            <select value={constructorId} onChange={e => setConstructorId(e.target.value)}>
              <option value="">{i18n.selectConstructor[lang]}</option>
              {filters.constructors?.map(c => (
                <option key={c.constructorId} value={c.constructorId}>{c.name}</option>
              ))}
            </select>
          )}

          {selected.param === "season" && (
            <select value={season} onChange={e => setSeason(e.target.value)}>
              <option value="">{i18n.selectSeason[lang]}</option>
              {filters.seasons?.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          )}

          {selected.param === "decade" && (
            <select value={decade} onChange={e => setDecade(e.target.value)}>
              <option value="">{i18n.selectDecade[lang]}</option>
              {Object.keys(i18n.decades).map(dec => (
                <option key={dec} value={dec}>{i18n.decades[dec]}</option>
              ))}
            </select>
          )}

          {selected.param === "circuitRef" && (
            <select value={circuitRef} onChange={e => setCircuitRef(e.target.value)}>
              <option value="">{lang === "es" ? "Seleccione circuito" : "Select circuit"}</option>
              {filters.circuitOptions?.map(c => (
                <option key={c.circuitRef} value={c.circuitRef}>{c.name}</option>
              ))}
            </select>
          )}



          <button onClick={handleFetch} disabled={!selected}>
            {i18n.showButton[lang]}
          </button>
        </div>
      )}

      {chart ? (
        React.createElement(getChartComponent(selected.endpoint, selected.chartType), { chart })
      ) : selected ? (
        <div className="chart-empty text-center">{i18n.loadChartMsg[lang]}</div>
      ) : (
        <div className="chart-empty text-center">{i18n.selectMsg[lang]}</div>
      )}
    </div>
  );
};

export default ChartSelector;
