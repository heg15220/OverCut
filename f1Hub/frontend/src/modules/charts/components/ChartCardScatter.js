import React from "react";
import ReactECharts from "echarts-for-react";
import "./ChartStyles.css";

const defaultColorPalette = [
  "#E10600", "#1B9CFC", "#F97F51", "#B33771", "#3B3B98", "#55E6C1", "#F8EFBA", "#25CCF7",
  "#FD7272", "#9AECDB", "#D6A2E8", "#33d9b2", "#218c74", "#40407a", "#ffb142", "#706fd3",
  "#ff5252", "#2C3A47", "#34ace0", "#ffb8b8", "#3ae374", "#ffa801", "#cd84f1", "#7efff5",
  "#c56cf0", "#ff3838", "#70a1ff", "#2ed573", "#5352ed", "#ff6b81", "#1e90ff", "#ffeaa7"
];

const lang = navigator.language.startsWith("es") ? "es" : "en";


const ChartCardScatter = ({ chart, chartKey }) => {
  if (!chart || !chart.datasets || chart.datasets.length === 0) {
    return (
      <div className="chart-card shadow rounded-xl text-center chart-empty">
        Cargando gráfico...
      </div>
    );
  }

  const { title, datasets } = chart;

  const filteredDatasets = datasets.filter(
    ds => ds.data && ds.data.length === 2 && ds.data.every(v => v !== null && v !== undefined)
  );

  const selected = {};
  filteredDatasets.forEach((ds, idx) => {
    selected[ds.label] = idx === 0;
  });

  // 🎯 Textos dinámicos por tipo de gráfico
  const yAxisName = (() => {
    switch (chartKey) {
      case "distinct-grid-positions-winning":
        return lang === "es" ? "Posición de parrilla" : "Grid position";
      case "total-podium-percentage-vs-all-teammates":
        return lang === "es" ? "% Pódiums vs equipo" : "% Podiums vs team";
      case "avg-positions-gained-first-laps":
        return lang === "es" ? "Posiciones ganadas (1ª vuelta)" : "Positions gained (1st lap)";
      default:
        return lang === "es" ? "Valor" : "Value";
    }
  })();

  const tooltipLabel = (() => {
    switch (chartKey) {
      case "distinct-grid-positions-winning":
        return lang === "es" ? "posición de parrilla" : "grid position";
      case "total-podium-percentage-vs-all-teammates":
        return lang === "es" ? "% de pódiums vs equipo" : "% podiums vs team";
      case "avg-positions-gained-first-laps":
        return lang === "es" ? "posiciones ganadas" : "positions gained";
      default:
        return lang === "es" ? "valor" : "value";
    }
  })();

  const series = filteredDatasets.map((ds, index) => {
    const fallbackColor = defaultColorPalette[index % defaultColorPalette.length];
    const color = ds.color || fallbackColor;
    const abbreviation = ds.abbreviation || ds.label.substring(0, 3).toUpperCase();

    return {
      name: ds.label,
      type: "scatter",
      data: [ds.data],
      symbolSize: 18,
      itemStyle: { color },
      label: {
        show: true,
        position: "top",
        color: "#fff",
        fontWeight: "bold",
        formatter: () => abbreviation
      }
    };
  });

  const option = {
    backgroundColor: "#0f0f0f",
    title: {
      text: title,
      left: "center",
      textStyle: {
        color: "#ffcc00",
        fontSize: 18,
        fontFamily: "F1 Bold, sans-serif"
      }
    },
    tooltip: {
      trigger: "item",
      backgroundColor: "#1e1e1e",
      borderColor: "#444",
      borderWidth: 1,
      formatter: params => `${params.seriesName}: ${params.data[1]} ${tooltipLabel}`,
      textStyle: {
        color: "#fff"
      }
    },
    legend: {
      type: "scroll",
      top: 50,
      orient: "horizontal",
      textStyle: { color: "#ccc" },
      data: filteredDatasets.map(ds => ds.label),
      selected,
      selectedMode: "multiple",
      pageIconColor: "#ffcc00",
      pageTextStyle: { color: "#ccc" }
    },
    grid: {
      top: 120,
      left: "5%",
      right: "5%",
      bottom: "8%",
      containLabel: true
    },
    xAxis: {
      type: "value",
      name: lang === "es" ? "Distribución horizontal" : "Horizontal spread",
      axisLine: { lineStyle: { color: "#777" } },
      axisLabel: { color: "#ccc", fontSize: 12 },
      splitLine: { lineStyle: { color: "#444", type: "dashed" } }
    },
    yAxis: {
      type: "value",
      name: yAxisName,
      axisLine: { lineStyle: { color: "#777" } },
      axisLabel: { color: "#ccc", fontSize: 12 },
      splitLine: { lineStyle: { color: "#444", type: "dashed" } }
    },
    series
  };

  return (
    <div className="chart-card">
      <ReactECharts option={option} style={{ height: 500, width: "100%" }} />
    </div>
  );
};

export default ChartCardScatter;

