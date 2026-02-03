import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  DndContext,
  closestCenter
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
  useSortable
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import predictions from "../index";
import "./styles/SimulationPanel.css";

function SortableDriverRow({ driver }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: driver.driverId });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.7 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`sim-row ${isDragging ? "dragging" : ""}`}
      {...attributes}
      {...listeners}
    >
      <div className="sim-row__pos" />
      <div className="sim-row__name">
        <div className="sim-row__driver">{driver.driverName}</div>
        {driver.constructorName ? (
          <div className="sim-row__team">{driver.constructorName}</div>
        ) : null}
      </div>

      <div className="sim-row__id">#{driver.driverId}</div>
      <div className="sim-row__handle">⠿</div>
    </div>
  );
}

export default function SimulationPanel() {
  const dispatch = useDispatch();

  const season = useSelector(predictions.selectors.getSeason);
  const fromRound = useSelector(predictions.selectors.getFromRound);
  const totalRounds = useSelector(predictions.selectors.getTotalRounds);
  const raceNamesByRound = useSelector(predictions.selectors.getRaceNamesByRound);

  const driverStandings = useSelector(predictions.selectors.getDriverStandings);
  const constructorStandings = useSelector(predictions.selectors.getConstructorStandings);
  const driverToConstructor = useSelector(predictions.selectors.getDriverToConstructor);

  const seasonDrivers = useSelector(predictions.selectors.getSeasonDrivers);

  const canUse = !!season && !!fromRound;

  const [round, setRound] = useState(fromRound || 1);

  // Estado: array de driverId en orden
  const [orderedIds, setOrderedIds] = useState([]);

  // Cuando cambia bootstrap o seasonDrivers, inicializa orden (alfabético o como venga)
  useEffect(() => {
    if (!canUse) return;
    if (!seasonDrivers || seasonDrivers.length === 0) return; // ✅ guard
    setRound(fromRound);
    setOrderedIds(seasonDrivers.map((d) => d.driverId));
  }, [canUse, fromRound, seasonDrivers]);


  const roundOptions = useMemo(() => {
    if (!canUse) return [];
    const max = totalRounds || 30;
    const list = [];
    for (let r = fromRound; r <= max; r++) {
      list.push({ r, name: raceNamesByRound?.[r] || `Round ${r}` });
    }
    return list;
  }, [canUse, fromRound, totalRounds, raceNamesByRound]);

  const currentGpName = raceNamesByRound?.[round] || `Round ${round}`;

  // Lista renderizada (en el orden actual)
  const orderedDrivers = useMemo(() => {
    const map = new Map(seasonDrivers.map((d) => [d.driverId, d]));
    return orderedIds.map((id) => map.get(id)).filter(Boolean);
  }, [orderedIds, seasonDrivers]);

  const onDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = orderedIds.indexOf(active.id);
    const newIndex = orderedIds.indexOf(over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      setOrderedIds((items) => arrayMove(items, oldIndex, newIndex));
    }
  };

  const canApply = canUse && orderedIds.length > 0;

  const apply = () => {
    if (!canApply) return;

    const payload = {
      season,
      race: {
        round: Number(round),
        orderedDriverIds: orderedIds, // ✅ importante: usa el nombre que espera tu DTO
      },
      driverStandings,
      constructorStandings,
      driverToConstructor,
    };

    dispatch(predictions.actions.applySimulation(payload));
  };

  if (!canUse) {
    return (
      <div className="sim-card">
        <div className="sim-card__head">
          <div className="sim-card__title">
            <h2>Simulation</h2>
            <span className="sim-card__sub">Haz Bootstrap para empezar</span>
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
            {season} · Desde ronda {fromRound} · <b>{currentGpName}</b>
          </span>
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
              <option key={opt.r} value={opt.r}>
                {opt.r}. {opt.name}
              </option>
            ))}
          </select>

          <div className="sim-hint">
            Solo puedes simular desde <b>round {fromRound}</b> en adelante.
          </div>
        </div>

        <div className="sim-field sim-field--wide">
          <label>Finishing order</label>

          <div className="sim-dnd">
            <div className="sim-dnd__header">
              <span>{orderedIds.length} pilotos</span>
              <span className="sim-dnd__hint">Arrastra para reordenar (P1 arriba).</span>
            </div>

            <DndContext collisionDetection={closestCenter} onDragEnd={onDragEnd}>
              <SortableContext items={orderedIds} strategy={verticalListSortingStrategy}>
                <div className="sim-list">
                  {orderedDrivers.map((d, idx) => (
                    <div key={d.driverId} className="sim-list__item">
                      <div className="sim-list__pos">{idx + 1}</div>
                      <SortableDriverRow driver={d} />
                    </div>
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </div>

          <div className="sim-meta">
            <span className="meta-pill meta-pill--soft">GP: {currentGpName}</span>
          </div>
        </div>
      </div>

      <div className="sim-card__actions">
        <button className="oc-btn" disabled={!canApply} onClick={apply} type="button">
          Apply simulation
        </button>

        <button
          className="oc-btn oc-btn--ghost"
          type="button"
          onClick={() => setOrderedIds(seasonDrivers.map((d) => d.driverId))}
        >
          Reset order
        </button>
      </div>

      <div className="sim-card__note">
        Próximo paso: modo “apply automático” al soltar (opcional) y soporte batch real.
      </div>
    </div>
  );
}
