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

export default function SimulationPanel() {
  const dispatch = useDispatch();

  const season = useSelector(predictions.selectors.getSeason);
  const fromRound = useSelector(predictions.selectors.getFromRound);

  const driverStandings = useSelector(predictions.selectors.getDriverStandings);
  const constructorStandings = useSelector(predictions.selectors.getConstructorStandings);

  // Si aún no tienes esto, lo dejamos opcional (no rompe)
  const driverToConstructor = useSelector(
    predictions.selectors.getDriverToConstructor || (() => ({}))
  );

  const [round, setRound] = useState(fromRound || 1);
  const [orderCsv, setOrderCsv] = useState("");
  const [mode, setMode] = useState("single"); // single | batch

  const canUse = !!season && !!fromRound;

  const order = useMemo(() => parseCsvIds(orderCsv), [orderCsv]);

  const apply = () => {
    if (!canUse) return;

    const payload = {
      season,
      race: {
        round: Number(round),
        // el backend puede ignorar campos extra si no existen;
        // lo importante es que tengas round + order para el cálculo
        finishingOrderDriverIds: order,
      },
      driverStandings,
      constructorStandings,
      driverToConstructor,
    };

    dispatch(predictions.actions.applySimulation(payload));
  };

  const applyBatch = () => {
    if (!canUse) return;

    const races = [
      {
        round: Number(round),
        finishingOrderDriverIds: order,
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

  if (!canUse) {
    return (
      <div className="sim-panel">
        <div className="sim-panel__head">
          <h2>Simulation</h2>
        </div>
        <div className="sim-panel__empty">
          Haz <b>Bootstrap</b> para cargar el estado real del campeonato y empezar a simular.
        </div>
      </div>
    );
  }

  return (
    <div className="sim-panel">
      <div className="sim-panel__head">
        <h2>Simulation</h2>

        <div className="sim-panel__mode">
          <button
            className={`chip ${mode === "single" ? "active" : ""}`}
            onClick={() => setMode("single")}
          >
            Single
          </button>
          <button
            className={`chip ${mode === "batch" ? "active" : ""}`}
            onClick={() => setMode("batch")}
          >
            Batch
          </button>
        </div>
      </div>

      <div className="sim-panel__grid">
        <div className="field">
          <label>Round</label>
          <input
            className="oc-input"
            type="number"
            min={fromRound}
            value={round}
            onChange={(e) => setRound(e.target.value)}
          />
          <div className="hint">Desde la ronda {fromRound} en adelante.</div>
        </div>

        <div className="field field--wide">
          <label>Finishing order (driverIds CSV)</label>
          <input
            className="oc-input"
            placeholder="Ej: 1, 20, 13, 8, 17 ..."
            value={orderCsv}
            onChange={(e) => setOrderCsv(e.target.value)}
          />
          <div className="hint">
            Introduce driverIds en orden de llegada. (Más adelante lo haremos drag & drop con nombres)
          </div>
        </div>
      </div>

      <div className="sim-panel__actions">
        {mode === "single" ? (
          <button className="oc-btn" disabled={order.length === 0} onClick={apply}>
            Apply simulation
          </button>
        ) : (
          <button className="oc-btn" disabled={order.length === 0} onClick={applyBatch}>
            Apply batch
          </button>
        )}

        <button
          className="oc-btn oc-btn--ghost"
          onClick={() => {
            setRound(fromRound);
            setOrderCsv("");
          }}
        >
          Clear
        </button>
      </div>
    </div>
  );
}
