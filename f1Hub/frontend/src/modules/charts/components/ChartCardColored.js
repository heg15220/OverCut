import React from "react";
import ReactECharts from "echarts-for-react";
import "./ChartStyles.css";

const defaultColorPalette = [
  "#E10600", "#1B9CFC", "#F97F51", "#B33771", "#3B3B98", "#55E6C1", "#F8EFBA", "#25CCF7",
  "#FD7272", "#9AECDB", "#D6A2E8", "#33d9b2", "#218c74", "#40407a", "#ffb142", "#706fd3",
  "#ff5252", "#2C3A47", "#34ace0", "#ffb8b8", "#3ae374", "#ffa801", "#cd84f1", "#7efff5",
  "#c56cf0", "#ff3838", "#70a1ff", "#2ed573", "#5352ed", "#ff6b81", "#1e90ff", "#ffeaa7"
];


const ChartCardColored = ({ chart }) => {
  if (
    !chart ||
    !chart.labels ||
    !chart.datasets ||
    chart.labels.length === 0 ||
    chart.datasets.length === 0
  ) {
    return (
      <div className="chart-card shadow rounded-xl text-center chart-empty">
        Cargando gráfico...
      </div>
    );
  }

  const { title, chartType, labels, datasets } = chart;

  // ✅ Esta línea es clave para evitar el error
  const filteredDatasets = datasets.filter(ds =>
    ds.data.some(v => v !== 0 && v !== null && v !== undefined)
  );

const selected = {};
filteredDatasets.forEach((ds, idx) => {
  selected[ds.label] = idx === 0; // solo el primero visible al principio
});



  const series = datasets.map((ds, datasetIndex) => {
    const isBar = chartType === "bar";
    const fallbackColor = defaultColorPalette[datasetIndex % defaultColorPalette.length];

    return {
      name: ds.label,
      type: isBar ? "bar" : "line",
      data: ds.data.map((value, i) => ({
        value,
        itemStyle: {
          color:
            ds.colors?.[i] ||  // color individual por punto (preferencia)
            ds.color ||         // color único por dataset
            fallbackColor       // color por defecto según índice
        }
      })),
      smooth: !isBar,
      symbolSize: 8,
      showSymbol: !isBar
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
      }
    },
    legend: {
      type: "scroll",
      top: 50,
      orient: "horizontal",
      textStyle: {
        color: "#ccc"
      },
      data: filteredDatasets.map(ds => ds.label),
      selected, // 👈 lo pasamos aquí
      selectedMode: selected, // 👈 importante: desactiva el comportamiento por defecto
      pageIconColor: "#ffcc00",
      pageTextStyle: {
        color: "#ccc"
      }
    },


    grid: {
      top: 120, // se incrementa para dejar más espacio tras la leyenda
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
      <ReactECharts option={option} style={{ height: 400, width: "100%" }} />
    </div>
  );
};

export default ChartCardColored;
