import React from "react";
import {
  BarChart, LineChart, CartesianGrid, XAxis, YAxis,
  Tooltip, Legend, ResponsiveContainer, Bar, Line
} from "recharts";

const ChartCard = ({ chart }) => {
  console.log("📊 Chart recibido:", chart); // <-- LOG

  // Validación de datos
  if (!chart || !chart.labels || !chart.datasets || chart.labels.length === 0 || chart.datasets.length === 0) {
    return (
      <div className="chart-card shadow rounded-xl bg-white p-4 text-center text-gray-500 italic">
        Cargando gráfico...
      </div>
    );
  }

  const { title, chartType, labels, datasets } = chart;

  const chartData = labels.map((label, i) => {
    const row = { name: label };
    datasets.forEach(ds => {
      row[ds.label] = ds.data[i];
    });
    return row;
  });

  return (
    <div className="chart-card shadow rounded-xl bg-white p-4">
      <h2 className="font-semibold text-lg mb-2">{title}</h2>
      <ResponsiveContainer width="100%" height={300}>
        {chartType === "bar" ? (
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            {datasets.map(ds => (
              <Bar key={ds.label} dataKey={ds.label} fill={ds.color} />
            ))}
          </BarChart>
        ) : (
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            {datasets.map(ds => (
              <Line
                key={ds.label}
                type="monotone"
                dataKey={ds.label}
                stroke={ds.color}
              />
            ))}
          </LineChart>
        )}
      </ResponsiveContainer>
    </div>
  );
};

export default ChartCard;
