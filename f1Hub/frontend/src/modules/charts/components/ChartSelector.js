import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import charts from "../index";
import ChartCardPie from "./ChartCardPie";
import ChartCard from "./ChartCard";
import ChartCardColored from "./ChartCardColored";
import ChartCardScatter from "./ChartCardScatter";
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

  const filters = useSelector(charts.selectors.getChartFilters);
  const chartKey = selected
    ? buildChartKey(selected.endpoint, { driverId, constructorId, season, limit })
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
      Carreras: lang === "es" ? "Carreras" : "Races"
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
      { endpoint: "q3-percentage-vs-teammate", label: { es: "Q3 vs Compañero", en: "Q3 vs Teammate" }, param: "driverId" },
      { endpoint: "most-common-quali-position", label: { es: "Posición de Clasificación Más Frecuente", en: "Most Common Quali Position" }},
      { endpoint: "quali-vs-teammate-comparison", label: { es: "Rendimiento en Clasificación vs Compañero", en: "Quali Performance vs Teammate" }, param: "driverId"},
      { endpoint: "race-vs-teammate-comparison", label: { es: "Rendimiento en Carrera vs Compañero", en: "Race Performance vs Teammate" }, param: "driverId"},
      { endpoint: "championship-progress-top2", label: { es: "Seguimiento Top 2 Campeonato", en: "Championship progress top 2"}, param: "season"}
    ],
    Constructores: [
      { endpoint: "avg-team-points-by-season", label: { es: "Puntos por Equipo", en: "Team Points per Season" }, param: "constructorId", chartType: "bar" }
    ],
    Carreras: [
      { endpoint: "pitstops-per-race", label: { es: "Pitstops por Carrera", en: "Pitstops per Race" }, param: "season", chartType: "line" },
      { endpoint: "overtakes-per-race", label: { es: "Cambios de Posición por Carrera", en: "Overtakes per Race" }, param: "season", chartType: "bar" }
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
    "most-common-quali-position": ChartCardColored
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

          <input
            type="number"
            min="1"
            max="50"
            value={limit}
            onChange={e => setLimit(e.target.value)}
            className="chart-input w-24"
            placeholder={i18n.topNPlaceholder[lang]}
          />

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
