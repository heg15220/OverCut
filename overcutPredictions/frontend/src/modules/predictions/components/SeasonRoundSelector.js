import React, { useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import predictions from "../index";
import "./styles/SeasonRoundSelector.css";

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

  const loading = useSelector(predictions.selectors.getLoading);

  // estado actual bootstrapped (si existe)
  const bootSeason = useSelector(predictions.selectors.getSeason);
  const bootFromRound = useSelector(predictions.selectors.getFromRound);
  const totalRounds = useSelector(predictions.selectors.getTotalRounds);

  // lookups (para mostrar nombre de GP si ya los tienes)
  const raceNamesByRound = useSelector(predictions.selectors.getRaceNamesByRound);

  // inputs controlados
  const [season, setSeason] = useState(bootSeason ?? 2012);
  const [fromRound, setFromRound] = useState(bootFromRound ?? 6);

  // opciones
  const years = useMemo(() => buildYearOptions(1950, 2026), []);
  const roundMax = useMemo(() => clampInt(totalRounds ?? 30, 1, 30) ?? 30, [totalRounds]);
  const rounds = useMemo(() => buildRoundOptions(roundMax), [roundMax]);

  // validaciones
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

  // chips rápidos (puedes cambiarlos cuando quieras)
  const quick = [
    { label: "2021 (completo)", season: 2021, fromRound: 1 },
    { label: "2012 (R6)", season: 2012, fromRound: 6 },
    { label: "2007 (completo)", season: 2007, fromRound: 1 },
  ];

  return (
    <div className="sr-card">
      <div className="sr-head">
        <div className="sr-titlebox">
          <h3>Inicializar simulación</h3>
          <p>
            Elige temporada y la ronda desde la que quieres empezar a modificar resultados.
          </p>
        </div>

        <button
          type="button"
          className="oc-btn oc-btn--ghost sr-reset"
          disabled={loading}
          onClick={() => {
            setSeason(2012);
            setFromRound(6);
          }}
          title="Volver a valores por defecto"
        >
          Default
        </button>
      </div>

      <div className="sr-grid">
        <div className="sr-field">
          <label>Temporada</label>
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
          {!seasonOk && <div className="sr-error">Rango 1950–2026</div>}
        </div>

        <div className="sr-field">
          <label>Simular desde la ronda</label>
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
                Temporada con <b>{totalRounds}</b> rondas.{" "}
                {selectedRoundName ? (
                  <>
                    Seleccionada: <b>R{fromRound}</b> — <span className="sr-gp">{selectedRoundName}</span>
                  </>
                ) : (
                  <>
                    Seleccionada: <b>R{fromRound}</b>
                  </>
                )}
              </>
            ) : (
              <>
                Seleccionada: <b>R{fromRound}</b> (máx. 30).{" "}
                <span className="sr-muted">Al hacer Bootstrap mostraremos el GP.</span>
              </>
            )}
          </div>

          {!roundOk && <div className="sr-error">Rango 1–{roundMax}</div>}
        </div>

        <div className="sr-actions">
          <button className="oc-btn sr-primary" disabled={!canSubmit} onClick={submit}>
            {loading ? "Cargando..." : "Bootstrap"}
          </button>
        </div>
      </div>

      <div className="sr-quick">
        <span className="sr-quick__label">Atajos</span>
        <div className="sr-quick__chips">
          {quick.map((q) => (
            <button
              key={q.label}
              type="button"
              className="oc-chip sr-chip"
              disabled={loading}
              onClick={() => {
                setSeason(q.season);
                setFromRound(q.fromRound);
              }}
            >
              {q.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
