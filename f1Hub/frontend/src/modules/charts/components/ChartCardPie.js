import React from "react";
import ReactECharts from "echarts-for-react";
import "./ChartStyles.css";

const ChartCardPie = ({ chart }) => {
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

  const { title, labels, datasets } = chart;

  // Preparar los datos para el gráfico circular (pie chart)
  const series = datasets.map(ds => ({
    type: "pie", // Establecer tipo "pie" para gráfico circular
    radius: "55%", // Ajuste el tamaño del gráfico
    data: ds.data.map((value, index) => ({
      value,
      name: labels[index], // Asignar los nombres de los pilotos como etiquetas
    })),
    itemStyle: {
      color: ds.color || "#ffcc00", // Colores de cada segmento (puedes personalizar esto)
    },
    emphasis: {
      itemStyle: {
        color: "#ff6347", // Color al resaltar un segmento
      },
    },
  }));

  const option = {
    backgroundColor: "#0f0f0f",
    title: {
      text: title,
      left: "center",
      textStyle: {
        color: "#ffcc00",
        fontSize: 18,
        fontFamily: "F1 Bold, sans-serif",
      },
    },
    tooltip: {
      trigger: "item", // Usar "item" para el gráfico tipo pie
      backgroundColor: "#1e1e1e",
      borderColor: "#444",
      borderWidth: 1,
      textStyle: {
        color: "#fff",
      },
      formatter: "{b}: {c} ({d}%)", // Formato del tooltip con nombre y porcentaje
    },
    legend: {
      top: "5%",
      left: "center",
      textStyle: {
        color: "#ccc",
      },
    },
    series,
  };

  return (
    <div className="chart-card">
      <ReactECharts option={option} style={{ height: 400, width: "100%" }} />
    </div>
  );
};

export default ChartCardPie;
