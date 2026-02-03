import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { DndContext, closestCenter, useSensor, useSensors, PointerSensor } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import predictions from "../index";
import "./styles/SimulationPanel.css";
import { pointsForPosition } from "./pointsEras";

function SortableDriverRow({ driver, points, isSelected, onClick }) {
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
      className={`sim-row ${isDragging ? "dragging" : ""} ${isSelected ? "selected" : ""}`}
      {...attributes}
      {...listeners}
      role="button"
      tabIndex={0}
      onClick={(e) => {
        e.stopPropagation();
        onClick(driver.driverId);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick(driver.driverId);
        }
      }}
    >
      <div className="sim-row__name">
        <div className="sim-row__driver">{driver.driverName}</div>
      </div>

      <div className="sim-row__pts" aria-label={`Points: ${points}`}>
        {points}
        <span className="sim-row__ptsUnit">pts</span>
      </div>
    </div>
  );
}

// helper para proponer orden por standings
function buildOrderFromStandings(driverStandings, fallbackIds) {
  if (!Array.isArray(driverStandings) || driverStandings.length === 0) return fallbackIds;

  const getId = (x) => x?.driverId ?? x?.driver?.driverId ?? x?.id;
  const getPts = (x) => x?.points ?? x?.pts ?? 0;
  const getPos = (x) => x?.position ?? x?.pos ?? null;

  const rows = driverStandings
    .map((x) => ({ id: getId(x), pts: getPts(x), pos: getPos(x) }))
    .filter((r) => r.id != null);

  if (rows.length === 0) return fallbackIds;

  const hasPos = rows.some((r) => r.pos != null);

  rows.sort((a, b) => {
    if (hasPos) return (a.pos ?? 9999) - (b.pos ?? 9999);
    return (b.pts ?? 0) - (a.pts ?? 0);
  });

  const ordered = rows.map((r) => r.id);

  const set = new Set(ordered);
  const rest = fallbackIds.filter((id) => !set.has(id));
  return [...ordered, ...rest];
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
  const [orderedIds, setOrderedIds] = useState([]);
  const [selectedId, setSelectedId] = useState(null);

  // track si el usuario ha tocado el orden (para no pisarlo al cambiar GP)
  const [dirtyOrder, setDirtyOrder] = useState(false);

  // Sensor: click = click, drag requiere mover 6px
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  // bootstrap local state
  useEffect(() => {
    if (!canUse) return;
    if (!seasonDrivers || seasonDrivers.length === 0) return;

    setRound(fromRound);

    const fallback = seasonDrivers.map((d) => d.driverId);
    setOrderedIds(buildOrderFromStandings(driverStandings, fallback));

    setSelectedId(null);
    setDirtyOrder(false);
    // ojo: no meto driverStandings en deps para no “pisar” durante la simulación
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

  const orderedDrivers = useMemo(() => {
    const map = new Map((seasonDrivers || []).map((d) => [d.driverId, d]));
    return (orderedIds || []).map((id) => map.get(id)).filter(Boolean);
  }, [orderedIds, seasonDrivers]);

  const onDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = orderedIds.indexOf(active.id);
    const newIndex = orderedIds.indexOf(over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      setOrderedIds((items) => arrayMove(items, oldIndex, newIndex));
      setSelectedId(null);
      setDirtyOrder(true);
    }
  };

  const handleRowClick = useCallback((driverId) => {
    setSelectedId((prev) => {
      if (prev == null) return driverId;
      if (prev === driverId) return null;

      setOrderedIds((ids) => {
        const a = ids.indexOf(prev);
        const b = ids.indexOf(driverId);
        if (a === -1 || b === -1) return ids;

        const next = [...ids];
        [next[a], next[b]] = [next[b], next[a]];
        return next;
      });

      setDirtyOrder(true);
      return null;
    });
  }, []);

  const canApply = canUse && orderedIds.length > 0;

  const apply = () => {
    if (!canApply) return;

    const payload = {
      season,
      race: {
        round: Number(round),
        orderedDriverIds: orderedIds,
      },
      driverStandings,
      constructorStandings,
      driverToConstructor,
    };

    dispatch(predictions.actions.applySimulation(payload));
  };

  // NEXT = apply + avanzar
  const maxRound = totalRounds || 30;
  const canNext = canApply && Number(round) < Number(maxRound);

  const next = () => {
    if (!canNext) return;

    // 1) aplica
    const payload = {
      season,
      race: {
        round: Number(round),
        orderedDriverIds: orderedIds,
      },
      driverStandings,
      constructorStandings,
      driverToConstructor,
    };
    dispatch(predictions.actions.applySimulation(payload));

    // 2) avanzar round (UI)
    setRound((r) => Number(r) + 1);

    // dejamos el orden actual como base, y limpiamos selección
    setSelectedId(null);
    setDirtyOrder(false);
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
        {/* LEFT: selector + botones debajo */}
        <div className="sim-field">
          <label>Grand Prix (round)</label>

          <select
            className="oc-input sim-select"
            value={round}
            onChange={(e) => {
              const r = Number(e.target.value);
              setRound(r);
              setSelectedId(null);

              // al cambiar GP manualmente, si NO has tocado el orden,
              // proponemos orden según standings actuales
              if (!dirtyOrder) {
                const fallback = seasonDrivers.map((d) => d.driverId);
                setOrderedIds(buildOrderFromStandings(driverStandings, fallback));
              }
            }}
          >
            {roundOptions.map((opt) => (
              <option key={opt.r} value={opt.r}>
                {opt.r}. {opt.name}
              </option>
            ))}
          </select>

          {/* ✅ botones justo debajo del select */}
          <div className="sim-roundActions">
            <button className="oc-btn" disabled={!canApply} onClick={apply} type="button">
              Apply simulation
            </button>

            <button
              className="oc-btn oc-btn--primary"
              disabled={!canNext}
              onClick={next}
              type="button"
            >
              Apply and Next round →
            </button>

            <button
              className="oc-btn oc-btn--ghost"
              type="button"
              onClick={() => {
                const fallback = seasonDrivers.map((d) => d.driverId);
                setOrderedIds(buildOrderFromStandings(driverStandings, fallback));
                setSelectedId(null);
                setDirtyOrder(false);
              }}
            >
              Reset order
            </button>
          </div>

          <div className="sim-hint">
            Solo puedes simular desde <b>round {fromRound}</b> en adelante.
          </div>
        </div>

        {/* RIGHT: lista */}
        <div className="sim-field sim-field--wide">
          <label>Finishing order</label>

          <div className="sim-dnd">
            <div className="sim-dnd__header">
              <span>{orderedIds.length} pilotos</span>
              <span className="sim-dnd__hint">
                Arrastra para reordenar (P1 arriba) · Click 2 pilotos para intercambiar
              </span>
            </div>

            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
              <SortableContext items={orderedIds} strategy={verticalListSortingStrategy}>
                <div className="sim-list">
                  {orderedDrivers.map((d, idx) => {
                    const pos = idx + 1;
                    const pts = pointsForPosition(pos, season);

                    return (
                      <div key={d.driverId} className="sim-list__item">
                        <div className="sim-list__pos">{pos}</div>
                        <SortableDriverRow
                          driver={d}
                          points={pts}
                          isSelected={selectedId === d.driverId}
                          onClick={handleRowClick}
                        />
                      </div>
                    );
                  })}
                </div>
              </SortableContext>
            </DndContext>
          </div>

          <div className="sim-meta">
            <span className="meta-pill meta-pill--soft">GP: {currentGpName}</span>
            {selectedId != null ? (
              <span className="meta-pill">Seleccionado: #{selectedId}</span>
            ) : null}
          </div>
        </div>
      </div>

      <div className="sim-card__note">
        Ahora puedes hacer “Next” para aplicar + avanzar sin validar a mano.
      </div>
    </div>
  );
}
