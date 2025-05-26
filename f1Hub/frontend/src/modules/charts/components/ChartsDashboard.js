import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import charts from "../index";
import ChartCard from "./ChartCard";
import "./ChartStyles.css";
import metadata from "../metadata"; // Ajusta la ruta según tu estructura de carpetas

const ChartsDashboard = () => {
  const dispatch = useDispatch();
  const chartsData = useSelector(state => state.charts.charts);
  const categories = useSelector(state => state.charts.categories);
  const filters = useSelector(charts.selectors.getChartFilters);

  const [activeCategory, setActiveCategory] = useState(null);
  const [selectedChart, setSelectedChart] = useState("");
  const [driverId, setDriverId] = useState("");
  const [constructorId, setConstructorId] = useState("");
  const [season, setSeason] = useState("");
  const [decade, setDecade] = useState("");  // Nueva variable de estado para la década

  useEffect(() => {
    dispatch(charts.actions.fetchChartCategories());
    dispatch(charts.actions.fetchChartFilters());
  }, [dispatch]);

  useEffect(() => {
    if (activeCategory && categories?.[activeCategory]) {
      const first = categories[activeCategory][0];
      setSelectedChart(first);
      setDriverId("");
      setConstructorId("");
      setSeason("");
      setDecade("");  // Resetear la década al cambiar de categoría

      const param = metadata?.[first]?.param;
      if (!param) {
        dispatch(charts.actions.fetchChartData(first));
      }
    }
  }, [activeCategory, categories, dispatch]);

  const handleChartChange = (e) => {
    const endpoint = e.target.value;
    setSelectedChart(endpoint);
    setDriverId("");
    setConstructorId("");
    setSeason("");
    setDecade("");  // Resetear la década al cambiar el gráfico

    const param = metadata?.[endpoint]?.param;
    if (!param) {
      dispatch(charts.actions.fetchChartData(endpoint));
    }
  };

  const handleFetch = () => {
    if (!selectedChart) return;

    const param = metadata?.[selectedChart]?.param;
    const params = {};

    // Agregar condiciones para manejar los nuevos filtros
    if (param === "driverId" && driverId) params.driverId = driverId;
    if (param === "constructorId" && constructorId) params.constructorId = constructorId;
    if (param === "season" && season) params.season = season;
    if (decade) params.decade = decade;  // Agregar filtro de década

    const key = `${selectedChart}-${driverId}-${constructorId}-${season}-${decade}`; // Incluir década en la clave
    dispatch(charts.actions.fetchChartData(selectedChart, params));
  };

  const currentParam = metadata?.[selectedChart]?.param;

  // Comprobamos si tenemos datos para la gráfica
  const chartKey = `${selectedChart}-${driverId}-${constructorId}-${season}-${decade}`; // Incluir década en la clave
  const chart = chartsData[chartKey] || chartsData[selectedChart];

  return (
    <div className="chart-selector-container">
      <h2 className="chart-selector-title">📊 Gráficas por Categoría</h2>

      <div className="flex gap-3 flex-wrap justify-center mb-4">
        {Object.keys(categories || {}).map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`selector-button ${cat === activeCategory ? "active" : ""}`}
          >
            {cat}
          </button>
        ))}
      </div>

      {activeCategory && categories?.[activeCategory] && (
        <div className="race-selector mb-6">
          <select
            className="chart-dropdown"
            value={selectedChart}
            onChange={handleChartChange}
          >
            {categories[activeCategory].map(endpoint => (
              <option key={endpoint} value={endpoint}>
                {metadata?.[endpoint]?.label || endpoint}
              </option>
            ))}
          </select>

          {/* Desplegables según el parámetro de la gráfica */}
          {currentParam === "driverId" && (
            <select
              className="chart-dropdown mt-2"
              value={driverId}
              onChange={e => setDriverId(e.target.value)}
            >
              <option value="">Seleccione piloto</option>
              {filters.drivers?.map(d => (
                <option key={d.driverId} value={d.driverId}>{d.name}</option>
              ))}
            </select>
          )}

          {currentParam === "constructorId" && (
            <select
              className="chart-dropdown mt-2"
              value={constructorId}
              onChange={e => setConstructorId(e.target.value)}
            >
              <option value="">Seleccione equipo</option>
              {filters.constructors?.map(c => (
                <option key={c.constructorId} value={c.constructorId}>{c.name}</option>
              ))}
            </select>
          )}

          {currentParam === "season" && (
            <select
              className="chart-dropdown mt-2"
              value={season}
              onChange={e => setSeason(e.target.value)}
            >
              <option value="">Seleccione temporada</option>
              {filters.seasons?.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          )}

          {/* Selecciona la década si el gráfico es "victory-percentage-by-decade" */}
          {selectedChart === "victory-percentage-by-decade" && (
            <select
              className="chart-dropdown mt-2"
              value={decade}
              onChange={e => setDecade(e.target.value)}
            >
              <option value="">Seleccione década</option>
              <option value="1980s">Década de 1980</option>
              <option value="1990s">Década de 1990</option>
              <option value="2000s">Década de 2000</option>
              <option value="2010s">Década de 2010</option>
              <option value="2020s">Década de 2020</option>
            </select>
          )}

          {currentParam && (
            <button
              className="fetch-button mt-3"
              onClick={handleFetch}
              disabled={
                (currentParam === "driverId" && !driverId) ||
                (currentParam === "constructorId" && !constructorId) ||
                (currentParam === "season" && !season) ||
                (currentParam === "decade" && !decade)
              }
            >
              Mostrar
            </button>
          )}
        </div>
      )}

      {chart ? (
        <ChartCard chart={chart} />
      ) : selectedChart ? (
        <div className="chart-empty text-center">Cargue los filtros para ver el gráfico.</div>
      ) : (
        <div className="chart-empty text-center">Seleccione una categoría y gráfica.</div>
      )}
    </div>
  );
};

export default ChartsDashboard;
