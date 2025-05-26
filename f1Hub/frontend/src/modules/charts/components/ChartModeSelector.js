import React from "react";
import { useNavigate, Outlet } from "react-router-dom";

const ChartModeSelector = () => {
  const navigate = useNavigate();

  return (
    <div className="p-8 bg-white shadow-xl rounded-xl max-w-xl mx-auto text-center">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">📈 ¿Qué tipo de gráficas quieres explorar?</h1>

      <div className="flex flex-col sm:flex-row justify-center gap-4 mb-6">
        <button
          onClick={() => navigate("standard")}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          📊 Ver Gráficas por Categoría
        </button>
        <button
          onClick={() => navigate("advanced")}
          className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition"
        >
          🎛️ Gráficas con Filtros Avanzados
        </button>
      </div>

      {/* Esto renderiza ChartsDashboard o ChartSelector */}
      <Outlet />
    </div>
  );
};

export default ChartModeSelector;
