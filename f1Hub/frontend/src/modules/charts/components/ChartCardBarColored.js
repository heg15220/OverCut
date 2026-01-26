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

const ChartCardBarColored = ({ chart }) => {
  if (!chart || !chart.labels || !chart.datasets || chart.labels.length === 0 || chart.datasets.length === 0) {
    return (
      <div className="chart-card shadow rounded-xl text-center chart-empty">Cargando gráfico...</div>
    );
  }

  const { title, labels, datasets } = chart;

  const filteredDatasets = datasets.filter(ds =>
    ds.data.some(v => v !== 0 && v !== null && v !== undefined)
  );

  const selected = {};
  filteredDatasets.forEach((ds, idx) => {
    selected[ds.label] = idx === 0;
  });

  const isTeamPerformanceGap =
    title.toLowerCase().includes("performance gap between teams") ||
    title.toLowerCase().includes("diferencia de rendimiento entre equipos");

  const series = filteredDatasets.map((ds, datasetIndex) => {
    const fallbackColor = defaultColorPalette[datasetIndex % defaultColorPalette.length];
    const baseColor = Array.isArray(ds.color) ? ds.color[0] || fallbackColor : ds.color || fallbackColor;

    return {
      name: ds.label,
      type: "bar",
      data: ds.data,
      itemStyle: {
        // ✅ SOLO en Team Performance Gap: cada barra un color distinto
        color: isTeamPerformanceGap
          ? (params) => defaultColorPalette[params.dataIndex % defaultColorPalette.length]
          : baseColor
      }
    };
  });

  const legendData = filteredDatasets.map((ds, index) => {
    const fallbackColor = defaultColorPalette[index % defaultColorPalette.length];
    const color = Array.isArray(ds.color) ? ds.color[0] || fallbackColor : ds.color || fallbackColor;
    return {
      name: ds.label,
      icon: "roundRect",
      itemStyle: {
        color
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
      trigger: "axis",
      backgroundColor: "#1e1e1e",
      borderColor: "#444",
      borderWidth: 1,
      textStyle: {
        color: "#fff"
      },
      // ✅ para barras horizontales queda mejor
      axisPointer: isTeamPerformanceGap ? { type: "shadow" } : undefined
    },
    legend: {
      type: "scroll",
      top: 50,
      orient: "horizontal",
      textStyle: {
        color: "#ccc"
      },
      data: legendData,
      selected,
      pageIconColor: "#ffcc00",
      pageTextStyle: {
        color: "#ccc"
      }
    },
    grid: {
      top: 120,
      left: isTeamPerformanceGap ? "12%" : "5%",
      right: "5%",
      bottom: "8%",
      containLabel: true
    },

    // ✅ HORIZONTAL solo para Team Performance Gap:
    // xAxis = value, yAxis = category (labels)
    xAxis: isTeamPerformanceGap
      ? {
          type: "value",
          axisLine: { lineStyle: { color: "#777" } },
          axisLabel: { color: "#ccc", fontSize: 12 },
          splitLine: { lineStyle: { color: "#444", type: "dashed" } }
        }
      : {
          type: "category",
          data: labels,
          axisLine: { lineStyle: { color: "#777" } },
          axisLabel: { color: "#ccc", fontSize: 12 }
        },

    yAxis: isTeamPerformanceGap
      ? {
          type: "category",
          data: labels,
          axisLine: { lineStyle: { color: "#777" } },
          axisLabel: { color: "#ccc", fontSize: 12 }
        }
      : {
          type: "value",
          axisLine: { lineStyle: { color: "#777" } },
          axisLabel: { color: "#ccc", fontSize: 12 },
          splitLine: { lineStyle: { color: "#444", type: "dashed" } }
        },

    series
  };

  return (
    <div className="chart-card">
      {(title.includes("Driver efficiency") || title.includes("Índice de eficiencia")) && (
        <p className="chart-description">
          {lang === "es"
            ? "Este índice compara el rendimiento de los pilotos en función de los puntos obtenidos por carrera y su posición media de salida. Una puntuación más alta indica mayor capacidad para maximizar resultados saliendo desde las primeras posiciones de la parrilla"
            : "This index compares drivers based on the points they score per race relative to their average starting position. A higher score indicates better ability to maximize results from the front of the grid."}
        </p>
      )}

      {(title.toLowerCase().includes("performance gap between teams") ||
        title.toLowerCase().includes("diferencia de rendimiento entre equipos")) && (
        <p className="chart-description">
          {lang === "es"
            ? "Este gráfico compara el rendimiento relativo de los equipos en una temporada. El mejor equipo aparece con 0 (referencia) y el resto muestra cuántos segundos de media está por detrás. Desde 2003 se combina ritmo de carrera (tiempo medio por vuelta) y rendimiento en clasificación (gap medio a la pole); a partir de 2025 solo se usa la clasificación."
            : "This chart compares teams' relative performance in a season. The best team is shown as 0 (baseline) and the others display how many seconds per lap, on average, they are behind. From 2003 onward it blends race pace (average lap time gap) and qualifying pace (average gap to pole); from 2025 onward it uses qualifying only."}
        </p>
      )}

      <ReactECharts option={option} style={{ height: 400, width: "100%" }} />
    </div>
  );
};

export default ChartCardBarColored;
