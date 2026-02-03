import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import HomePage from "./HomePage";
import predictions from "../../predictions";
import { t } from "../../../i18n/translations";

const Body = () => {
  return (
    <main className="ocp-body">
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/simulate" element={<predictions.PredictionsView />} />
        <Route path="/overcutPredictions" element={<Navigate to="/simulate" replace />} />
        <Route path="*" element={<div style={{ padding: 24 }}>{t("routes.notFound")}</div>} />
      </Routes>
    </main>
  );
};

export default Body;
