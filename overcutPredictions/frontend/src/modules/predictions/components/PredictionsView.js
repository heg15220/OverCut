import React from "react";
import { useSelector } from "react-redux";

import PredictionsHeader from "./PredictionsHeader";
import SeasonRoundSelector from "./SeasonRoundSelector";
import StandingsTable from "./StandingsTable";
import SimulationPanel from "./SimulationPanel";

import predictions from "../index";
import "./styles/Predictions.css";
import { t } from "../../../i18n/translations"; // <-- ajusta ruta

export default function PredictionsView() {
  const error = useSelector(predictions.selectors.getError);
  const loading = useSelector(predictions.selectors.getLoading);

  return (
    <div className="predictions-root">
      <PredictionsHeader />

      {(error?.message || error?.global) && (
        <div className="oc-alert" role="alert">
          <div className="oc-alert__title">{t("pred.errorTitle")}</div>
          <div className="oc-alert__msg">{error.message || error.global || t("pred.errorNetwork")}</div>

          {loading && <div className="oc-alert__hint">{t("pred.errorHint")}</div>}
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
