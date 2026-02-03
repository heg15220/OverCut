import React, { useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import predictions from "../index";
import "./styles/PredictionsHeader.css";
import { t } from "../../../i18n/translations"; // <-- ajusta ruta

export default function PredictionsHeader() {
  const dispatch = useDispatch();

  const season = useSelector(predictions.selectors.getSeason);
  const fromRound = useSelector(predictions.selectors.getFromRound);
  const totalRounds = useSelector(predictions.selectors.getTotalRounds);
  const completed = useSelector(predictions.selectors.getCompletedRaces);
  const mode = useSelector(predictions.selectors.getMode);

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
                {t("predHeader.pillSeason")} <b>{season}</b>
              </span>

              <span className="pill pill--soft">
                {t("predHeader.pillStart")} <b>R{fromRound}</b>
                {startRoundName ? <span className="pill__muted">· {startRoundName}</span> : null}
              </span>

              <span className="pill pill--dark">{t("predHeader.pillRealLoaded", { n: loadedCount })}</span>

              {totalRounds ? (
                <span className="pill pill--ghost">
                  {t("predHeader.pillTotal")} <b>{totalRounds}</b> {t("predHeader.pillRounds")}
                </span>
              ) : null}

              <span className="pill pill--ghost">
                {t("predHeader.pillMode")} <b>{mode}</b>
              </span>

              {loading ? <span className="pill pill--loading">{t("predHeader.loading")}</span> : null}
            </>
          ) : (
            <span className="predictions-hint">{t("predHeader.hint")}</span>
          )}
        </div>
      </div>

      <div className="predictions-header-actions">
        {hasBootstrapped && (
          <button
            className="oc-btn oc-btn--ghost"
            disabled={loading}
            onClick={() => dispatch(predictions.actions.resetSimulation())}
            title={t("predHeader.resetTitle")}
            type="button"
          >
            {t("predHeader.resetBtn")}
          </button>
        )}
      </div>
    </div>
  );
}
