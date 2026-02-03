import React, { useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import predictions from "../index";
import "./styles/SimulationPanel.css";

const parseCsvIds = (txt) =>
  txt
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((v) => Number(v))
    .filter((n) => Number.isFinite(n));

const uniq = (arr) => Array.from(new Set(arr));

export default function SimulationPanel() {
  const dispatch = useDispatch();

  const season = useSelector(predictions.selectors.getSeason);
  const fromRound = useSelector(predictions.selectors.getFromRound);
  const totalRounds = useSelector(predictions.selectors.getTotalRounds);

  const driverStandings = useSelector(predictions.selectors.getDriverStandings);
  const constructorStandings = useSelector(predictions.selectors.getConstructorStandings);

  const driverToConstructor = useSelector(predictions.selectors.getDriverToConstructor);

  const raceNamesByRound = useSelector(predictions.selectors.getRaceNamesByRound);

  const canUse = !!season && !!fromRound;

  const [round, setRound] = useState(fromRound || 1);
  const [orderCsv, setOrderCsv] = useState("");
  const [mode, setMode] = useState("single"); // single | batch

  // ✅ options de ronda: desde fromRound hasta totalRounds (si viene) o fallback 30
  const roundOptions = useMemo(() => {
    if (!canUse) return [];
    const max = Number.isFinite(totalRounds) && totalRounds ? totalRounds : 30;
    const list = [];
    for (let r = fromRound; r <= max; r++) {
      const name = raceNamesByRound?.[r] || `Round ${r}`;
      list.push({ round: r, name });
    }
    return list;
  }, [canUse, fromRound, totalRounds, raceNamesByRound]);

  const order = useMemo(() => parseCsvIds(orderCsv), [orderCsv]);
  const orderUnique = useMemo(() => uniq(order), [order]);

  const hasDuplicates = orderUnique.length !== order.length;

  const canApply = canUse && order.length > 0 && !hasDuplicates;

  const apply = () => {
    if (!canApply) return;

    const payload = {
      season,
      race: {
        round: Number(round),
        finishingOrderDriverIds: orderUnique,
      },
      driverStandings,
      constructorStandings,
      driverToConstructor,
    };

    dispatch(predictions.actions.applySimulation(payload));
  };

  const applyBatch = () => {
    if (!canApply) return;

    const races = [
      {
        round: Number(round),
        finishingOrderDriverIds: orderUnique,
      },
    ];

    const payload = {
      season,
      races,
      driverStandings,
      constructorStandings,
      driverToConstructor,
    };

    dispatch(predictions.actions.applySimulationBatch(payload));
  };

  const currentRaceName =
    raceNamesByRound?.[Number(round)] ||
    (roundOptions.find((x) => x.round === Number(round))?.name ?? `Round ${round}`);

  if (!canUse) {
    return (
      <div className="sim-card">
        <div className="sim-card__head">
          <div className="sim-card__title">
            <h2>Simulation</h2>
            <span className="sim-card__sub">Configura temporada y ronda para empezar</span>
          </div>
        </div>

        <div className="sim-card__empty">
          Haz <b>Bootstrap</b> para cargar el estado real del campeonato y empezar a simular.
        </div>
      </div>
    );
  }

  return (
    <div className="sim-card">
      <div className="sim-card__head">
        <div className="sim-card__title">
          <h2>Simulation</h2>
          <span className="sim-card__sub">
            {season} · Desde ronda {fromRound} · <b>{currentRaceName}</b>
          </span>
        </div>

        <div className="sim-card__mode">
          <button
            type="button"
            className={`seg ${mode === "single" ? "active" : ""}`}
            onClick={() => setMode("single")}
          >
            Single
          </button>
          <button
            type="button"
            className={`seg ${mode === "batch" ? "active" : ""}`}
            onClick={() => setMode("batch")}
          >
            Batch
          </button>
        </div>
      </div>

      <div className="sim-card__grid">
        <div className="sim-field">
          <label>Grand Prix (round)</label>

          <select
            className="oc-input sim-select"
            value={round}
            onChange={(e) => setRound(Number(e.target.value))}
          >
            {roundOptions.map((opt) => (
              <option key={opt.round} value={opt.round}>
                {opt.round}. {opt.name}
              </option>
            ))}
          </select>

          <div className="sim-hint">
            Solo puedes simular desde <b>round {fromRound}</b> en adelante.
          </div>
        </div>

        <div className="sim-field sim-field--wide">
          <label>Finishing order (driverIds)</label>

          <textarea
            className="oc-input sim-textarea"
            placeholder="Ej: 20, 4, 8, 1, 17, 18 ..."
            value={orderCsv}
            onChange={(e) => setOrderCsv(e.target.value)}
            rows={3}
          />

          <div className="sim-hint">
            Introduce los <b>driverId</b> en orden de llegada (separados por comas).
            {hasDuplicates && (
              <>
                {" "}
                <span className="sim-warn">
                  Ojo: hay IDs repetidos. Deben ser únicos.
                </span>
              </>
            )}
          </div>

          <div className="sim-meta">
            <span className="meta-pill">
              {orderUnique.length} IDs
            </span>
            {hasDuplicates && <span className="meta-pill meta-pill--warn">Duplicados</span>}
            <span className="meta-pill meta-pill--soft">
              GP: {currentRaceName}
            </span>
          </div>
        </div>
      </div>

      <div className="sim-card__actions">
        {mode === "single" ? (
          <button className="oc-btn" disabled={!canApply} onClick={apply} type="button">
            Apply simulation
          </button>
        ) : (
          <button className="oc-btn" disabled={!canApply} onClick={applyBatch} type="button">
            Apply batch
          </button>
        )}

        <button
          className="oc-btn oc-btn--ghost"
          type="button"
          onClick={() => {
            setRound(fromRound);
            setOrderCsv("");
          }}
        >
          Clear
        </button>
      </div>

      <div className="sim-card__note">
        Próximo paso: sustituir el textarea por <b>drag & drop</b> con nombres y equipos.
      </div>
    </div>
  );
}
