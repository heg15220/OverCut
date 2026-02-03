import React from "react";
import { useDispatch, useSelector } from "react-redux";
import predictions from "../index";
import "./styles/PredictionsHeader.css";

export default function PredictionsHeader() {
  const dispatch = useDispatch();

  const season = useSelector(predictions.selectors.getSeason);
  const fromRound = useSelector(predictions.selectors.getFromRound);
  const completed = useSelector(predictions.selectors.getCompletedRaces);

  const hasBootstrapped = !!season && !!fromRound;

  return (
    <div className="predictions-header">
      <div className="predictions-titlebox">
        <h1 className="predictions-title">
          OverCut <span>Predictions</span>
        </h1>

        <div className="predictions-sub">
          {hasBootstrapped ? (
            <>
              <span className="pill">Season {season}</span>
              <span className="pill pill--soft">Simulate from round {fromRound}</span>
              <span className="pill pill--dark">{completed?.length || 0} real races loaded</span>
            </>
          ) : (
            <span className="predictions-hint">
              Selecciona temporada y ronda para inicializar el campeonato.
            </span>
          )}
        </div>
      </div>

      <div className="predictions-header-actions">
        {hasBootstrapped && (
          <button
            className="oc-btn oc-btn--ghost"
            onClick={() => dispatch(predictions.actions.resetSimulation())}
          >
            Reset
          </button>
        )}
      </div>
    </div>
  );
}
