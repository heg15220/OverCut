import React, { useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import predictions from "../index";
import "./styles/PredictionsHeader.css";

export default function PredictionsHeader() {
  const dispatch = useDispatch();

  const season = useSelector(predictions.selectors.getSeason);
  const fromRound = useSelector(predictions.selectors.getFromRound);
  const totalRounds = useSelector(predictions.selectors.getTotalRounds);
  const completed = useSelector(predictions.selectors.getCompletedRaces);

  const raceNamesByRound = useSelector(predictions.selectors.getRaceNamesByRound);
  const loading = useSelector(predictions.selectors.getLoading);

  const hasBootstrapped = !!season && !!fromRound;

  const startRoundName = useMemo(() => {
    if (!hasBootstrapped) return null;
    return raceNamesByRound?.[fromRound] || null;
  }, [hasBootstrapped, raceNamesByRound, fromRound]);

  const loadedCount = completed?.length || 0;

  return (
    <div className="predictions-header">
      <div className="predictions-titlebox">
        <h1 className="predictions-title">
          OverCut <span>Predictions</span>
        </h1>

        <div className="predictions-sub">
          {hasBootstrapped ? (
            <>
              <span className="pill">
                Season <b>{season}</b>
              </span>

              <span className="pill pill--soft">
                Start <b>R{fromRound}</b>
                {startRoundName ? <span className="pill__muted">· {startRoundName}</span> : null}
              </span>

              <span className="pill pill--dark">
                <b>{loadedCount}</b> real races loaded
              </span>

              {totalRounds ? (
                <span className="pill pill--ghost">
                  Total <b>{totalRounds}</b> rounds
                </span>
              ) : null}

              {loading ? <span className="pill pill--loading">Loading…</span> : null}
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
            disabled={loading}
            onClick={() => dispatch(predictions.actions.resetSimulation())}
            title="Reiniciar simulación"
          >
            Reset
          </button>
        )}
      </div>
    </div>
  );
}
