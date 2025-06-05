import React from "react";
import translations from "../../../i18n/translations";
import ChartsDashboard from "../../charts/components/ChartsDashboard";
import ChartSelector from "../../charts/components/ChartSelector";

const lang = navigator.language.startsWith("es") ? "es" : "en";
const t = translations[lang];

const GraphView = () => (
  <div>
    <h1 className="text-2xl font-bold mb-4">{t.advancedCharts}</h1>
    <ChartsDashboard />
    <hr className="my-8" />
    <ChartSelector />
  </div>
);

export default GraphView;
