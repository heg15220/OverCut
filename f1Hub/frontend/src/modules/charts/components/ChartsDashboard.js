import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import charts from "../index";
import ChartCard from "./ChartCard";

const ChartsDashboard = () => {
  const dispatch = useDispatch();
  const chartsData = useSelector(state => state.charts.charts);
  const categories = useSelector(state => state.charts.categories);
  const [activeCategory, setActiveCategory] = useState(null); // ← empieza sin categoría

  // Cargar categorías al iniciar
  useEffect(() => {
    dispatch(charts.actions.fetchChartCategories());
  }, [dispatch]);

  // Cargar datos de la categoría activa
  useEffect(() => {
    if (activeCategory && categories?.[activeCategory]) {
      categories[activeCategory].forEach(endpoint => {
        if (!chartsData[endpoint]) {
          dispatch(charts.actions.fetchChartData(endpoint));
        }
      });
    }
  }, [activeCategory, categories, chartsData, dispatch]);

  // Si aún no hay categorías, muestra loading
  if (!categories || Object.keys(categories).length === 0) {
    return <div className="text-gray-500 p-4">Cargando categorías de gráficas...</div>;
  }

  return (
    <div className="p-4">
      {/* 🔹 Selector de categorías */}
      <div className="flex gap-4 mb-6">
        {Object.keys(categories).map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-2 rounded font-semibold ${
              cat === activeCategory ? "bg-blue-600 text-white" : "bg-gray-200"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* 🔹 Si no hay categoría activa aún, no mostrar nada más */}
      {!activeCategory && (
        <div className="text-gray-500 italic">Selecciona una categoría para ver gráficas.</div>
      )}

      {/* 🔹 Renderizar solo si hay categoría activa */}
      {activeCategory && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {categories[activeCategory].map(endpoint => {
            const chart = chartsData[endpoint];
            return chart ? <ChartCard key={endpoint} chart={chart} /> : null;
          })}
        </div>
      )}
    </div>
  );
};

export default ChartsDashboard;
