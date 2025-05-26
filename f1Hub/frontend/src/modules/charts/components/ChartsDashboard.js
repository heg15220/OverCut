import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import charts from "../index";
import ChartCard from "./ChartCard";

const ChartsDashboard = () => {
  const dispatch = useDispatch();
  const chartsData = useSelector(state => state.charts.charts);
  const categories = useSelector(state => state.charts.categories);
  const [activeCategory, setActiveCategory] = useState(null);

  useEffect(() => {
    dispatch(charts.actions.fetchChartCategories());
  }, [dispatch]);

  useEffect(() => {
    if (activeCategory && categories?.[activeCategory]) {
      categories[activeCategory].forEach(endpoint => {
        if (!chartsData[endpoint]) {
          dispatch(charts.actions.fetchChartData(endpoint));
        }
      });
    }
  }, [activeCategory, categories, chartsData, dispatch]);

  if (!categories || Object.keys(categories).length === 0) {
    return <div className="text-gray-500 p-4">Cargando categorías de gráficas...</div>;
  }

  return (
    <div className="p-4">
      <div className="flex gap-4 mb-6">
        {Object.keys(categories).map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`selector-button ${cat === activeCategory ? "active" : ""}`}
          >
            {cat}
          </button>
        ))}
      </div>

      {!activeCategory && (
        <div className="text-gray-500 italic">Selecciona una categoría para ver gráficas.</div>
      )}

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