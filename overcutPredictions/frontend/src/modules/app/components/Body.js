import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import HomePage from "./HomePage";
import predictions from "../../predictions";

const Body = () => {
  return (
    <main className="ocp-body">
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/simulate" element={<predictions.PredictionsView />} />

        {/* Opcional: redirección cómoda */}
        <Route path="/overcutPredictions" element={<Navigate to="/simulate" replace />} />

        {/* 404 simple */}
        <Route path="*" element={<div style={{ padding: 24 }}>404</div>} />
      </Routes>
    </main>
  );
};

export default Body;
