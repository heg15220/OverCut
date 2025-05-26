import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import charts from "../index";
import ChartCard from "./ChartCard";

const parameterizedCharts = {
  Pilotos: [
    { endpoint: "podium-percentage-vs-teammate", label: "Podios vs Compañero", param: "driverId" },
    { endpoint: "q3-percentage-vs-teammate", label: "Q3 vs Compañero", param: "driverId" },
    { endpoint: "avg-positions-gained-by-season", label: "Posiciones Ganadas por Temporada", param: "driverId" },
    { endpoint: "race-vs-teammate-comparison", label: "Carreras vs Compañero", param: "driverId" },
    { endpoint: "quali-vs-teammate-comparison", label: "Quali vs Compañero", param: "driverId" },
    { endpoint: "points-delta-vs-teammate", label: "Δ Puntos por Temporada", param: "season" }
  ],
  Carreras: [
    { endpoint: "pitstops-per-race", label: "Pitstops por Carrera", param: "year" },
    { endpoint: "overtakes-per-race", label: "Adelantamientos por Carrera", param: "year" }
  ]
};

const ChartSelector = () => {
  const dispatch = useDispatch();
  const [category, setCategory] = useState(null); // ← inicia en null
  const [selected, setSelected] = useState(null);
  const [input, setInput] = useState("");

  const chart = useSelector(state =>
    selected && input
      ? charts.selectors.getChartByEndpoint(state, `${selected.endpoint}:${input}`)
      : null
  );

  const handleFetch = () => {
    if (input.trim() !== "" && selected) {
      dispatch(charts.actions.fetchChartData(selected.endpoint, { [selected.param]: input }));
    }
  };

  return (
    <div className="p-4 bg-white shadow rounded-xl">
      <h2 className="text-xl font-semibold mb-4">📌 Gráficos por Parámetro</h2>

      {/* 🔹 Selección de categoría */}
      <div className="flex gap-4 mb-4">
        {Object.keys(parameterizedCharts).map(cat => (
          <button
            key={cat}
            onClick={() => {
              setCategory(cat);
              setSelected(parameterizedCharts[cat][0]);
              setInput("");
            }}
            className={`px-4 py-2 rounded ${
              category === cat
                ? "bg-blue-600 text-white"
                : "bg-gray-100 hover:bg-gray-200 text-gray-800"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* 🔹 Solo si hay categoría activa, muestra filtros */}
      {category && selected && (
        <div className="flex flex-wrap gap-4 mb-4">
          <select
            value={selected.endpoint}
            onChange={e =>
              setSelected(parameterizedCharts[category].find(c => c.endpoint === e.target.value))
            }
            className="border p-2 rounded"
          >
            {parameterizedCharts[category].map(c => (
              <option key={c.endpoint} value={c.endpoint}>
                {c.label}
              </option>
            ))}
          </select>

          <input
            type="text"
            placeholder={selected.param}
            value={input}
            onChange={e => setInput(e.target.value)}
            className="border p-2 rounded"
          />

          <button
            onClick={handleFetch}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Mostrar
          </button>
        </div>
      )}

      {/* 🔹 Mostrar el gráfico si está cargado */}
      {chart && <ChartCard chart={chart} />}
    </div>
  );
};

export default ChartSelector;
