import React from "react";
import { useSelector } from "react-redux";

import PredictionsHeader from "./PredictionsHeader";
import SeasonRoundSelector from "./SeasonRoundSelector";
import StandingsTable from "./StandingsTable";
import SimulationPanel from "./SimulationPanel";


import predictions from "../index";
import "./styles/Predictions.css";

export default function PredictionsView() {
  const error = useSelector(predictions.selectors.getError);

  return (
    <div className="predictions-root">
      <PredictionsHeader />

      {error?.message && (
        <div className="oc-alert">
          {error.message || "Error"}
        </div>
      )}

      <SeasonRoundSelector />

      <div className="predictions-grid">
        <SimulationPanel />
        <StandingsTable />
      </div>
    </div>
  );
}
