// SeasonRoundSelector.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import predictions from "../index";
import "./styles/SeasonRoundSelector.css";
import CustomSeasonModal from "./CustomSeasonModal";
import { t } from "../../../i18n/translations"; // <-- ajusta ruta

const clampInt = (v, min, max) => {
  const n = parseInt(v, 10);
  if (Number.isNaN(n)) return null;
  return Math.max(min, Math.min(max, n));
};

const buildYearOptions = (minYear = 1950, maxYear = 2026) => {
  const arr = [];
  for (let y = maxYear; y >= minYear; y--) arr.push(y);
  return arr;
};

const buildRoundOptions = (maxRounds = 30) => {
  const arr = [];
  for (let r = 1; r <= maxRounds; r++) arr.push(r);
  return arr;
};

export default function SeasonRoundSelector() {
  const dispatch = useDispatch();

  const [customOpen, setCustomOpen] = useState(false);

  const loading = useSelector(predictions.selectors.getLoading);

  const bootSeason = useSelector(predictions.selectors.getSeason);
  const bootFromRound = useSelector(predictions.selectors.getFromRound);
  const totalRounds = useSelector(predictions.selectors.getTotalRounds);

  const raceNamesByRound = useSelector(predictions.selectors.getRaceNamesByRound);
  const customConfig = useSelector(predictions.selectors.getCustomConfig);

  const dbLookups = useSelector(predictions.selectors.getLookups);

  const [season, setSeason] = useState(bootSeason ?? 2012);
  const [fromRound, setFromRound] = useState(bootFromRound ?? 6);

  useEffect(() => {
    if (bootSeason != null) setSeason(bootSeason);
    if (bootFromRound != null) setFromRound(bootFromRound);
  }, [bootSeason, bootFromRound]);

  const years = useMemo(() => buildYearOptions(1950, 2026), []);
  const roundMax = useMemo(() => clampInt(totalRounds ?? 30, 1, 30) ?? 30, [totalRounds]);
  const rounds = useMemo(() => buildRoundOptions(roundMax), [roundMax]);

  const seasonOk = useMemo(() => clampInt(season, 1950, 2026) !== null, [season]);
  const roundOk = useMemo(() => {
    const r = clampInt(fromRound, 1, roundMax);
    return r !== null && r >= 1 && r <= roundMax;
  }, [fromRound, roundMax]);

  const canSubmit = seasonOk && roundOk && !loading;

  const selectedRoundName = useMemo(() => {
    const r = clampInt(fromRound, 1, roundMax);
    if (!r) return null;
    return raceNamesByRound?.[r] || null;
  }, [fromRound, raceNamesByRound, roundMax]);

  const submit = () => {
    const s = clampInt(season, 1950, 2026);
    const r = clampInt(fromRound, 1, roundMax);
    if (!s || !r) return;
    dispatch(predictions.actions.bootstrap(s, r));
  };

  return (
    <div className="sr-card">
      <div className="sr-head">
        <div className="sr-titlebox">
          <h3>{t("sr.title")}</h3>
          <p>{t("sr.desc")}</p>
        </div>

        <div className="sr-headActions">

          <button
            type="button"
            className="oc-btn oc-btn--ghost sr-headBtn sr-headBtn--custom"
            disabled={loading}
            onClick={() => {
              const hasAnyLookups =
                (dbLookups?.seasonDrivers?.length || 0) > 0 ||
                Object.keys(dbLookups?.raceNamesByRound || {}).length > 0;

              const lookupsAreForThisSeason = Number(bootSeason) === Number(season);

              if (!hasAnyLookups || !lookupsAreForThisSeason) {
                dispatch(predictions.actions.bootstrap(Number(season), Number(fromRound)));
              }

              setCustomOpen(true);
            }}
            title={t("sr.customTitle")}
          >
            <span className="sr-headBtn__icon" aria-hidden="true">⚙️</span>
            <span className="sr-headBtn__label">{t("sr.custom")}</span>
          </button>

          <button
            type="button"
            className="oc-btn oc-btn--ghost sr-headBtn sr-headBtn--default sr-reset"
            disabled={loading}
            onClick={() => {
              setSeason(2012);
              setFromRound(6);
            }}
            title={t("sr.defaultTitle")}
          >
            <span className="sr-headBtn__icon" aria-hidden="true">↺</span>
            <span className="sr-headBtn__label">{t("sr.default")}</span>
          </button>

        </div>
      </div>

      <div className="sr-grid">
        <div className="sr-field">
          <label>{t("sr.season")}</label>
          <select
            className="sr-select"
            value={season}
            onChange={(e) => setSeason(Number(e.target.value))}
            disabled={loading}
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
          {!seasonOk && <div className="sr-error">{t("sr.rangeYears")}</div>}
        </div>

        <div className="sr-field">
          <label>{t("sr.fromRound")}</label>
          <select
            className="sr-select"
            value={fromRound}
            onChange={(e) => setFromRound(Number(e.target.value))}
            disabled={loading}
          >
            {rounds.map((r) => (
              <option key={r} value={r}>
                R{r}
              </option>
            ))}
          </select>

          <div className="sr-hint">
            {totalRounds ? (
              <>
                {t("sr.hintWithTotal", { total: totalRounds })}{" "}
                {selectedRoundName ? (
                  <>
                    {t("sr.selected")} <b>R{fromRound}</b> —{" "}
                    <span className="sr-gp">{selectedRoundName}</span>
                  </>
                ) : (
                  <>
                    {t("sr.selected")} <b>R{fromRound}</b>
                  </>
                )}
              </>
            ) : (
              <>
                {t("sr.selected")} <b>R{fromRound}</b> ({t("sr.max30")}).{" "}
                <span className="sr-muted">{t("sr.hintAfterBootstrap")}</span>
              </>
            )}
          </div>

          {!roundOk && <div className="sr-error">{t("sr.rangeRounds", { max: roundMax })}</div>}
        </div>

        <div className="sr-actions">
          <button className="oc-btn sr-primary" disabled={!canSubmit} onClick={submit} type="button">
            {loading ? t("sr.loading") : t("sr.bootstrap")}
          </button>
        </div>
      </div>

      <CustomSeasonModal
        open={customOpen}
        onClose={() => setCustomOpen(false)}
        season={season}
        fromRound={fromRound}
        initialConfig={customConfig}
        dbLookups={Number(bootSeason) === Number(season) ? dbLookups : null}
        onSubmit={(payload) => {
          setCustomOpen(false);
          dispatch(predictions.actions.bootstrapCustom({ ...payload }));
        }}
      />
    </div>
  );
}
