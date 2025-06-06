import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import charts from "../index";
import ChartCard from "./ChartCard";
import ChartCardColored from "./ChartCardColored";
import ChartCardScatter from "./ChartCardScatter";
import ChartCardPie from "./ChartCardPie";
import ChartCardBarColored from "./ChartCardBarColored";
import metadata from "../metadata";
import translations from "../../../i18n/translations";
import "./ChartStyles.css";

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
  const [decade, setDecade] = useState("");
  const [circuitRef, setCircuitRef] = useState("");
  const lang = navigator.language.startsWith("es") ? "es" : "en";
  const t = translations[lang];

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
      setDecade("");
      setCircuitRef("");

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
    setDecade("");
    setCircuitRef("");

    const param = metadata?.[endpoint]?.param;
    if (!param) {
      dispatch(charts.actions.fetchChartData(endpoint));
    }
  };

  const handleFetch = () => {
    if (!selectedChart) return;

    const param = metadata?.[selectedChart]?.param;
    const params = {};

    if (param === "driverId" && driverId) params.driverId = driverId;
    if (param === "constructorId" && constructorId) params.constructorId = constructorId;
    if (param === "season" && season) params.season = season;
    if (param === "decade" && decade) params.decade = decade;
    if (param === "circuitOptions" && circuitRef) params.circuitOptions = circuitRef;

    const key = `${selectedChart}-${driverId}-${constructorId}-${season}-${decade}-${circuitRef}`;
    dispatch(charts.actions.fetchChartData(selectedChart, params));
  };

  const currentParam = metadata?.[selectedChart]?.param;
  const chartKey = `${selectedChart}-${driverId}-${constructorId}-${season}-${decade}-${circuitRef}`;
  const chart = chartsData[chartKey] || chartsData[selectedChart];

  return (
    <div className="chart-selector-container">
      <h2 className="chart-selector-title">{t.chartsByCategory}</h2>

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
                {metadata?.[endpoint]?.label?.[lang] || endpoint}
              </option>
            ))}
          </select>

          {currentParam === "decade" && (
            <select
              className="chart-dropdown mt-2"
              value={decade}
              onChange={e => setDecade(e.target.value)}
            >
              <option value="">{t.selectDecade}</option>
              <option value="1980s">1980s</option>
              <option value="1990s">1990s</option>
              <option value="2000s">2000s</option>
              <option value="2010s">2010s</option>
              <option value="2020s">2020s</option>
            </select>
          )}

          {currentParam === "circuitOptions" && (
            <select
              className="chart-dropdown mt-2"
              value={circuitRef}
              onChange={e => setCircuitRef(e.target.value)}
            >
              <option value="">{t.selectCircuit}</option>
              {(filters?.circuitOptions || []).map(opt => (
                <option key={opt.circuitRef} value={opt.circuitRef}>
                  {opt.name}
                </option>
              ))}
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
                (currentParam === "decade" && !decade) ||
                (currentParam === "circuitOptions" && !circuitRef)
              }
            >
              {t.show}
            </button>
          )}
        </div>
      )}

      {chart ? (
        // 🥧 Pie
        ["wins-percentage-driver-circuit"].includes(selectedChart) ? (
          <ChartCardPie chart={chart} />

        // 🟡 Scatter
        ) : [
          "avg-positions-gained-first-laps",
          "total-podium-percentage-vs-all-teammates",
          "distinct-grid-positions-winning"
        ].includes(selectedChart) ? (
          <ChartCardScatter chart={chart} />

        // 🎨 Bar con colores por categoría
        ) : [
          "grid-vs-result-delta",
          "wins-from-3rd-or-worse",
          "podiums-from-3rd-or-worse",
          "finish-position-distribution",
          "finish-vs-dnf-ratio",
          "points-streaks",
          "qualifying-improvement",
          // nuevos
          "quali-race-delta-histogram",
          "technical-failures",
          "retirement-cause-by-season",
          "efficiency-rating",
          "poles-without-win",
          "pole-conversion-rate",
          "podiums-from-outside-top10",
          "teammate-wins-delta",
          "teammate-podium-delta"
        ].includes(selectedChart) ? (
          <ChartCardBarColored chart={chart} />

        // 🟩 Colored line/bar charts
        ) : [
          "team-comebacks-by-season",
          "avg-team-points-by-season",
          "most-team-points",
          "podium-percentage-vs-teammate",
          "reliability-by-season",
          "caotic-race-performance",
          // nuevos
          "quali-consistency",
          "championships-decided-early"
        ].includes(selectedChart) ? (
          <ChartCardColored chart={chart} />

        // 🔷 Default
        ) : (
          <ChartCard chart={chart} />
        )
      ) : selectedChart ? (
        <div className="chart-empty text-center">{t.loadFilters}</div>
      ) : (
        <div className="chart-empty text-center">{t.selectChart}</div>
      )}


    </div>
  );
};

export default ChartsDashboard;
