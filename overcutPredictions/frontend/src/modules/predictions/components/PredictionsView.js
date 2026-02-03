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
  const loading = useSelector(predictions.selectors.getLoading);

  return (
    <div className="predictions-root">
      <PredictionsHeader />

      {(error?.message || error?.global) && (
        <div className="oc-alert" role="alert">
          <div className="oc-alert__title">Ha ocurrido un error</div>
          <div className="oc-alert__msg">
            {error.message || error.global || "Error de red"}
          </div>

          {loading && (
            <div className="oc-alert__hint">
              Nota: el sistema está cargando; si el error persiste, prueba “Reset” y vuelve a bootstrap.
            </div>
          )}
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
