import React from "react";
import ReactECharts from "echarts-for-react";
import "./ChartStyles.css";

// Función para generar colores dinámicamente
const generateColor = () => {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
};

// Función para redondear los porcentajes a 2 decimales
const roundToTwoDecimals = (num) => {
  return Math.round(num * 100) / 100;
};

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

  // Verificación de la estructura de los datos para asegurarnos que estamos recibiendo los datos correctos
  console.log("📊 Datos de la gráfica", chart);

  // Preparar los datos para el gráfico circular (tipo anillo)
  const series = datasets.map((ds) => ({
    type: "pie",
    radius: ["30%", "50%"], // Crear un gráfico en forma de anillo (donut)
    avoidLabelOverlap: false,
    label: {
      show: true,
      position: "outside", // Mostrar las etiquetas afuera de la gráfica
      formatter: "{b}: {c} ({d}%)", // Formato de la etiqueta
      color: "#fff",
      fontSize: 14,
    },
    labelLine: {
      show: true,
      length: 20, // Ajustar la longitud de las líneas del label
      lineStyle: {
        width: 1,
        type: "solid",
      },
    },
    // Usamos los nombres de los pilotos que están en `colors` para los nombres y generamos colores para las secciones
    data: ds.data.map((value, index) => ({
      value: roundToTwoDecimals(value),  // Redondeamos el valor a dos decimales
      name: ds.colors[index], // Usamos `ds.colors` para los nombres de los pilotos
      itemStyle: {
        color: generateColor(), // Asignamos un color aleatorio desde la función
      },
    })),
    emphasis: {
      itemStyle: {
        color: "#ff6347", // Color al resaltar un segmento
      },
    },
  }));

  // Opciones del gráfico
  const option = {
    backgroundColor: "#1c1c1c", // Fondo oscuro
    title: {
      text: title,
      left: "center",
      textStyle: {
        color: "#fff", // Color del título
        fontSize: 18,
        fontFamily: "F1 Bold, sans-serif",
      },
    },
    tooltip: {
      trigger: "item",
      backgroundColor: "#333", // Fondo más oscuro en los tooltips
      borderColor: "#444",
      borderWidth: 1,
      textStyle: {
        color: "#fff", // Color del texto del tooltip
      },
      // Redondeamos los valores en el tooltip a dos decimales
      formatter: (params) => {
        return `${params.name}: ${params.value.toFixed(2)} (${params.percent.toFixed(2)}%)`;
      },
    },
    legend: {
      top: "5%",
      left: "center",
      textStyle: {
        color: "#ccc", // Color de las leyendas
      },
      data: datasets[0].colors, // Usamos los `colors` para la leyenda, ya que contienen los nombres de los pilotos
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
