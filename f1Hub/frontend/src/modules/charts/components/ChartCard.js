import React from "react";
import {
  BarChart,
  LineChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Bar,
  Line
} from "recharts";

const ChartCard = ({ chart }) => {
  if (
    !chart ||
    !chart.labels ||
    !chart.datasets ||
    chart.labels.length === 0 ||
    chart.datasets.length === 0
  ) {
    return (
      <div className="chart-card shadow rounded-xl bg-white p-6 text-center text-gray-500 italic">
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

  const commonStyles = {
    margin: { top: 20, right: 30, left: 0, bottom: 5 }
  };

  return (
    <div className="chart-card shadow-lg rounded-2xl bg-white p-6 transition duration-300 hover:shadow-2xl">
      <h2 className="font-bold text-lg text-gray-800 mb-4">{title}</h2>
      <ResponsiveContainer width="100%" height={320}>
        {chartType === "bar" ? (
          <BarChart data={chartData} {...commonStyles}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip
              contentStyle={{ fontSize: "14px", backgroundColor: "#ffffff", borderRadius: "8px" }}
              labelStyle={{ fontWeight: "bold" }}
            />
            <Legend wrapperStyle={{ fontSize: 13 }} />
            {datasets.map(ds => (
              <Bar
                key={ds.label}
                dataKey={ds.label}
                fill={ds.color || "#8884d8"}
                radius={[4, 4, 0, 0]}
              />
            ))}
          </BarChart>
        ) : (
          <LineChart data={chartData} {...commonStyles}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip
              contentStyle={{ fontSize: "14px", backgroundColor: "#ffffff", borderRadius: "8px" }}
              labelStyle={{ fontWeight: "bold" }}
            />
            <Legend wrapperStyle={{ fontSize: 13 }} />
            {datasets.map(ds => (
              <Line
                key={ds.label}
                type="monotone"
                dataKey={ds.label}
                stroke={ds.color || "#8884d8"}
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
            ))}
          </LineChart>
        )}
      </ResponsiveContainer>
    </div>
  );
};

export default ChartCard;
