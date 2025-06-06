import React from "react";
import ReactECharts from "echarts-for-react";
import "./ChartStyles.css";

const lang = navigator.language.startsWith("es") ? "es" : "en";

const ChartCard = ({ chart }) => {
  if (
    !chart ||
    !chart.labels ||
    !chart.datasets ||
    chart.labels.length === 0 ||
    chart.datasets.length === 0
  ) {
    return (
      <div className="chart-card shadow rounded-xl text-center chart-empty">Cargando gráfico...</div>
    );
  }

  const { title, chartType, labels, datasets } = chart;

  const series = datasets.map(ds => ({
    name: ds.label,
    type: chartType === "bar" ? "bar" : "line",
    data: ds.data,
    itemStyle: {
      color: ds.color || "#ffcc00"
    },
    smooth: chartType === "line",
    symbolSize: 8
  }));

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
      }
    },
    legend: {
      top: 30,
      textStyle: {
        color: "#ccc"
      }
    },
    grid: {
      left: "5%",
      right: "5%",
      bottom: "8%",
      containLabel: true
    },
    xAxis: {
      type: "category",
      data: labels,
      axisLine: {
        lineStyle: {
          color: "#777"
        }
      },
      axisLabel: {
        color: "#ccc",
        fontSize: 12
      }
    },
    yAxis: {
      type: "value",
      axisLine: {
        lineStyle: {
          color: "#777"
        }
      },
      axisLabel: {
        color: "#ccc",
        fontSize: 12
      },
      splitLine: {
        lineStyle: {
          color: "#444",
          type: "dashed"
        }
      }
    },
    series
  };

  return (
    <div className="chart-card">
      {title.includes("Trayectoria de rendimiento") && (
        <p className="chart-description">
          {title.includes("equipo") || title.includes("team")
            ? lang === "es"
              ? "Este índice combina la consistencia del equipo, su porcentaje de puntos logrados, y su posición final en el campeonato de constructores."
              : "This index combines team consistency, percentage of points earned, and final position in the Constructors’ Championship."
            : lang === "es"
              ? "Este índice combina la consistencia del piloto, su rendimiento frente al compañero, y su contribución al equipo en puntos y resultados."
              : "This index combines driver consistency, performance against teammate, and contribution to team results."}
        </p>
      )}

      <ReactECharts option={option} style={{ height: 400, width: "100%" }} />
    </div>
  );

};

export default ChartCard;