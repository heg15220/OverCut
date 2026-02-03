import React, { useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import predictions from "../index";
import "./styles/SeasonRoundSelector.css";

const clampInt = (v, min, max) => {
  const n = parseInt(v, 10);
  if (Number.isNaN(n)) return null;
  return Math.max(min, Math.min(max, n));
};

export default function SeasonRoundSelector() {
  const dispatch = useDispatch();
  const loading = useSelector(predictions.selectors.getLoading);
  const bootSeason = useSelector(predictions.selectors.getSeason);
  const bootFromRound = useSelector(predictions.selectors.getFromRound);

  const [season, setSeason] = useState(bootSeason ?? 2012);
  const [fromRound, setFromRound] = useState(bootFromRound ?? 6);

  const seasonOk = useMemo(() => {
    const s = clampInt(season, 1950, 2026);
    return s !== null;
  }, [season]);

  const roundOk = useMemo(() => {
    const r = clampInt(fromRound, 1, 30);
    return r !== null && r >= 1;
  }, [fromRound]);

  const canSubmit = seasonOk && roundOk && !loading;

  const submit = () => {
    const s = clampInt(season, 1950, 2026);
    const r = clampInt(fromRound, 1, 30);
    if (!s || !r) return;
    dispatch(predictions.actions.bootstrap(s, r));
  };

  return (
    <div className="selector-box">
      <div className="selector-row">
        <div className="field">
          <label>Season</label>
          <input
            className="oc-input"
            type="number"
            min={1950}
            max={2026}
            value={season}
            onChange={(e) => setSeason(e.target.value)}
          />
          {!seasonOk && <div className="field-error">1950–2026</div>}
        </div>

        <div className="field">
          <label>Simulate from round</label>
          <input
            className="oc-input"
            type="number"
            min={1}
            max={30}
            value={fromRound}
            onChange={(e) => setFromRound(e.target.value)}
          />
          {!roundOk && <div className="field-error">1–30</div>}
        </div>

        <button className="oc-btn" disabled={!canSubmit} onClick={submit}>
          {loading ? "Loading..." : "Bootstrap"}
        </button>
      </div>

      <div className="selector-shortcuts">
        <button className="oc-chip" onClick={() => { setSeason(2021); setFromRound(1); }}>
          2021 (full)
        </button>
        <button className="oc-chip" onClick={() => { setSeason(2012); setFromRound(6); }}>
          2012 (R6)
        </button>
        <button className="oc-chip" onClick={() => { setSeason(2007); setFromRound(1); }}>
          2007 (full)
        </button>
      </div>
    </div>
  );
}
