import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import charts from "../index";
import ChartCard from "./ChartCard";
import { buildChartKey } from "../utils/chartKey";

const ChartSelector = () => {
  const dispatch = useDispatch();
  const [category, setCategory] = useState(null);
  const [selected, setSelected] = useState(null);
  const [driverId, setDriverId] = useState("");
  const [constructorId, setConstructorId] = useState("");
  const [season, setSeason] = useState("");
  const [limit, setLimit] = useState(10);

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

    // Solo agrega `limit` si es relevante
    if (selected.param !== "season") params.limit = limit;

    const key = buildChartKey(selected.endpoint, params);
    console.log("🔑 Key de gráfico que se usará:", key);

    dispatch(charts.actions.fetchChartData(selected.endpoint, params));
  };







  const chartOptions = {
    Pilotos: [
      { endpoint: "podium-percentage-vs-teammate", label: "Podios vs Compañero", param: "driverId" },
      { endpoint: "avg-positions-gained-by-season", label: "Posiciones Ganadas por Temporada", param: "driverId" },
      { endpoint: "points-delta-vs-teammate", label: "Δ Puntos por Temporada", param: "season" }
    ],
    Constructores: [
      { endpoint: "avg-team-points-by-season", label: "Puntos por Equipo", param: "constructorId" }
    ],
    Carreras: [
      { endpoint: "pitstops-per-race", label: "Pitstops por Carrera", param: "season" },
      { endpoint: "overtakes-per-race", label: "Adelantamientos por Carrera", param: "season" }
    ]
  };

  return (
    <div className="p-4 bg-white shadow-xl rounded-xl">
      <h2 className="text-xl font-bold mb-4">🎛️ Gráficos con Filtros Avanzados</h2>

      <div className="flex gap-4 mb-4">
        {Object.keys(chartOptions).map(cat => (
          <button
            key={cat}
            onClick={() => {
              setCategory(cat);
              setSelected(chartOptions[cat][0]);
              setDriverId("");
              setConstructorId("");
              setSeason("");
              setLimit(10);
            }}
            className={`px-4 py-2 rounded font-medium shadow-sm ${
              category === cat ? "bg-blue-600 text-white" : "bg-gray-200 hover:bg-gray-300"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {category && selected && (
        <div className="flex flex-wrap items-center gap-4 mb-4">
          <select
            value={selected.endpoint}
            onChange={e =>
              setSelected(chartOptions[category].find(c => c.endpoint === e.target.value))
            }
            className="border rounded p-2"
          >
            {chartOptions[category].map(opt => (
              <option key={opt.endpoint} value={opt.endpoint}>{opt.label}</option>
            ))}
          </select>

          {selected.param === "driverId" && (
            <select
              value={driverId}
              onChange={e => setDriverId(e.target.value)}
              className="border rounded p-2"
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
              className="border rounded p-2"
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
              className="border rounded p-2"
            >
              <option value="">Seleccione temporada</option>
              {filters.seasons?.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          )}

          <input
            type="number"
            min="1"
            max="50"
            value={limit}
            onChange={e => setLimit(e.target.value)}
            className="border rounded p-2 w-24"
            placeholder="Top N"
          />

          <button
            onClick={handleFetch}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Mostrar
          </button>
        </div>
      )}

      {chart && <ChartCard chart={chart} />}
    </div>
  );
};

export default ChartSelector;
