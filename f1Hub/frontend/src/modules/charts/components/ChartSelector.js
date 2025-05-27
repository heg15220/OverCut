import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import charts from "../index";
import ChartCardPie from "./ChartCardPie"; // Importar el nuevo componente
import ChartCard from "./ChartCard";
import ChartCardColored from "./ChartCardColored";
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
  const [decade, setDecade] = useState(""); // Estado para la década

  const filters = useSelector(charts.selectors.getChartFilters);
  const chartKey = selected
    ? buildChartKey(selected.endpoint, {
        driverId,
        constructorId,
        season,
        limit
      })
    : null;

  const chart = useSelector(state =>
    chartKey ? charts.selectors.getChartByEndpoint(state, chartKey) : null
  );

  useEffect(() => {
    dispatch(charts.actions.fetchChartFilters());
  }, [dispatch]);

  const handleFetch = () => {
    if (!selected) return;

    const params = {};
    if (selected.param === "driverId" && driverId) params.driverId = driverId;
    if (selected.param === "constructorId" && constructorId) params.constructorId = constructorId;
    if (selected.param === "season" && season) params.season = season;
    if (decade) params.decade = decade; // Agregar el parámetro de década

    const key = buildChartKey(selected.endpoint, params);
    console.log("🔑 Key de gráfico que se usará:", key);

    dispatch(charts.actions.fetchChartData(selected.endpoint, params));
  };

  const chartOptions = {
    Pilotos: [
      { endpoint: "podium-percentage-vs-teammate", label: "Podios vs Compañero", param: "driverId", chartType: "bar" },
      { endpoint: "avg-positions-gained-by-season", label: "Posiciones Ganadas por Temporada", param: "driverId", chartType: "line" },
      { endpoint: "points-delta-vs-teammate", label: "Δ Puntos por Temporada", param: "season", chartType: "bar" },
      { endpoint: "victory-percentage-by-decade", label: "Porcentaje de Victorias por Década", param: "decade", chartType: "pie" },
       { endpoint: "average-points-per-season", label: "Promedio de puntos por temporada filtrado en décadas ", param: "decade", chartType: "line" }
    ],
    Constructores: [
      { endpoint: "avg-team-points-by-season", label: "Puntos por Equipo", param: "constructorId", chartType: "bar" }
    ],
    Carreras: [
      { endpoint: "pitstops-per-race", label: "Pitstops por Carrera", param: "season", chartType: "line" },
      { endpoint: "overtakes-per-race", label: "Cambios de Posición por Carrera", param: "season", chartType: "bar" }
    ]
  };

// Después del chartOptions:
const chartRenderMap = {
  "podium-percentage-vs-teammate": ChartCard,
  "avg-positions-gained-by-season": ChartCard,
  "points-delta-vs-teammate": ChartCard,
  "victory-percentage-by-decade": ChartCardPie,
  "average-points-per-season": ChartCardColored,
  "avg-team-points-by-season": ChartCard,
  "pitstops-per-race": ChartCard,
  "overtakes-per-race": ChartCard
};

const getChartComponent = (endpoint, chartType) => {
  return chartRenderMap[endpoint] || (chartType === "pie" ? ChartCardPie : ChartCard);
};



  return (
    <div className="chart-selector-container">
      <h2 className="chart-selector-title">🎛️ Gráficos con Filtros Avanzados</h2>

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
              setDecade(""); // Resetear la década al cambiar de categoría
              setLimit(10);
            }}
            className={`selector-button ${category === cat ? "active" : ""}`}
          >
            {cat}
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
              <option key={opt.endpoint} value={opt.endpoint}>{opt.label}</option>
            ))}
          </select>

          {selected.param === "driverId" && (
            <select
              value={driverId}
              onChange={e => setDriverId(e.target.value)}
            >
              <option value="">Seleccione piloto</option>
              {filters.drivers?.map(d => (
                <option key={d.driverId} value={d.driverId}>{d.name}</option>
              ))}
            </select>
          )}

          {selected.param === "constructorId" && (
            <select
              value={constructorId}
              onChange={e => setConstructorId(e.target.value)}
            >
              <option value="">Seleccione equipo</option>
              {filters.constructors?.map(c => (
                <option key={c.constructorId} value={c.constructorId}>{c.name}</option>
              ))}
            </select>
          )}

          {selected.param === "season" && (
            <select
              value={season}
              onChange={e => setSeason(e.target.value)}
            >
              <option value="">Seleccione temporada</option>
              {filters.seasons?.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          )}


          {selected.param === "decade" && (
            <select
              value={decade}
              onChange={e => setDecade(e.target.value)}
              className="chart-dropdown mt-2"
            >
              <option value="">Seleccione década</option>
              <option value="1980s">Década de 1980</option>
              <option value="1990s">Década de 1990</option>
              <option value="2000s">Década de 2000</option>
              <option value="2010s">Década de 2010</option>
              <option value="2020s">Década de 2020</option>
            </select>
          )}


          <input
            type="number"
            min="1"
            max="50"
            value={limit}
            onChange={e => setLimit(e.target.value)}
            className="chart-input w-24"
            placeholder="Top N"
          />

          <button
            onClick={handleFetch}
            disabled={!selected}
          >
            Mostrar
          </button>
        </div>
      )}


      {chart ? (
        React.createElement(getChartComponent(selected.endpoint, selected.chartType), { chart })
      ) : selected ? (
        <div className="chart-empty text-center">Cargue los filtros para ver el gráfico.</div>
      ) : (
        <div className="chart-empty text-center">Seleccione una categoría y gráfica.</div>
      )}

    </div>
  );
};

export default ChartSelector;
