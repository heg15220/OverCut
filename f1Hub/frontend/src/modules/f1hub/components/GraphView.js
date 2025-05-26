// src/features/charts/GraphView.jsx
import React from "react";
import ChartsDashboard from "../../charts/components/ChartsDashboard";
import ChartSelector from "../../charts/components/ChartSelector";


const GraphView = () => (
  <div>
    <h1 className="text-2xl font-bold mb-4">📈 Gráficas Avanzadas</h1>
    <ChartsDashboard />
    <hr className="my-8" />
    <ChartSelector />
  </div>
);

export default GraphView;
