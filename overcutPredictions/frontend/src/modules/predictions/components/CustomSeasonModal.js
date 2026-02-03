// CustomSeasonModal.jsx
import React, { useEffect, useMemo, useState } from "react";
import "./styles/CustomSeasonModal.css";

const mkNegId = (base) => -Math.abs(base);

const makeFallbackState = (fromRound) => ({
  constructors: [{ constructorId: -101, name: "Team A" }],
  drivers: [{ driverId: -1, name: "Driver 1" }],
  mapping: {},
  races: [{ round: fromRound || 1, name: `Round ${fromRound || 1}` }],
  touchedCalendar: false,
});

/**
 * Construye estado "custom" basado en lookups reales de BD
 * - seasonDrivers: [{ driverId, constructorId, driverName, constructorName }]
 * - raceNamesByRound: { [round]: "GP Name" }
 * - constructorNames: { [constructorId]: "Team" }
 */
const buildStateFromDbLookups = (dbLookups, fromRound) => {
  const seasonDrivers = dbLookups?.seasonDrivers || [];
  const raceNamesByRound = dbLookups?.raceNamesByRound || {};
  const constructorNames = dbLookups?.constructorNames || {};

  const hasDrivers = Array.isArray(seasonDrivers) && seasonDrivers.length > 0;
  const hasRaces = raceNamesByRound && Object.keys(raceNamesByRound).length > 0;

  if (!hasDrivers && !hasRaces) return null; // BD vacía => fallback

  // 1) Drivers
  const drivers = hasDrivers
    ? seasonDrivers.map((d) => ({
        driverId: Number(d.driverId),
        name: String(d.driverName || "").trim() || `Driver ${d.driverId}`,
      }))
    : [];

  // 2) Mapping driver->constructor (si viene)
  const mapping = {};
  if (hasDrivers) {
    for (const d of seasonDrivers) {
      if (d.driverId != null && d.constructorId != null) {
        mapping[String(d.driverId)] = Number(d.constructorId);
      }
    }
  }

  // 3) Constructors: unique de los constructorId presentes
  const uniqueConstructorIds = new Set();
  if (hasDrivers) {
    for (const d of seasonDrivers) {
      if (d.constructorId != null) uniqueConstructorIds.add(Number(d.constructorId));
    }
  }

  const constructors = Array.from(uniqueConstructorIds).map((cid) => ({
    constructorId: Number(cid),
    name:
      (constructorNames?.[String(cid)] || constructorNames?.[cid] || seasonDrivers.find((x) => Number(x.constructorId) === Number(cid))?.constructorName || `Constructor ${cid}`),
  }));

  // 4) Races: desde raceNamesByRound
  // OJO: esto devuelve todo el calendario. Si prefieres solo desde fromRound, puedes filtrar.
  const raceRounds = Object.keys(raceNamesByRound)
    .map((k) => Number(k))
    .filter((n) => Number.isFinite(n))
    .sort((a, b) => a - b);

  const races = raceRounds.length
    ? raceRounds.map((round) => ({
        round,
        name: String(raceNamesByRound[String(round)] || raceNamesByRound[round] || `Round ${round}`),
      }))
    : [{ round: fromRound || 1, name: `Round ${fromRound || 1}` }];

  // 5) Si el usuario abre esto, lo consideramos "no tocado" todavía (autofill)
  return {
    constructors: constructors.length ? constructors : makeFallbackState(fromRound).constructors,
    drivers: drivers.length ? drivers : makeFallbackState(fromRound).drivers,
    mapping,
    races,
    touchedCalendar: false,
  };
};

// ✅ Por si guardas customConfig en Redux con shape tipo payload
const mapConfigToState = (cfg, fromRound) => {
  if (!cfg) return null;

  const constructors = cfg.customConstructors || cfg.constructors || [];
  const drivers = cfg.customDrivers || cfg.drivers || [];
  const races = cfg.customRaces || cfg.races || [];
  const mapping = cfg.customDriverToConstructor || cfg.mapping || {};

  return {
    constructors: constructors.length ? constructors : makeFallbackState(fromRound).constructors,
    drivers: drivers.length ? drivers : makeFallbackState(fromRound).drivers,
    races: races.length ? races : makeFallbackState(fromRound).races,
    mapping: mapping || {},
    touchedCalendar: true,
  };
};

export default function CustomSeasonModal({
  open,
  onClose,
  season,
  fromRound,
  initialConfig,
  dbLookups, // ✅ NUEVO
  onSubmit,
}) {
  // prioridad:
  // 1) initialConfig (si existe) -> reabrir lo que el usuario guardó
  // 2) dbLookups -> autogenerar desde BD
  // 3) fallback placeholders
  const computeInitial = () => {
    const cfgSeason = Number(initialConfig?.season);
    const cfgFrom = Number(initialConfig?.fromRound);

    const sameSelection =
      Number.isFinite(cfgSeason) &&
      Number.isFinite(cfgFrom) &&
      cfgSeason === Number(season) &&
      cfgFrom === Number(fromRound);

    // ✅ SOLO si el config guardado es de ESTA season/fromRound
    if (initialConfig && sameSelection) {
      const fromCfg = mapConfigToState(initialConfig, fromRound);
      if (fromCfg) return fromCfg;
    }

    const fromDb = buildStateFromDbLookups(dbLookups, fromRound);
    if (fromDb) return fromDb;

    return makeFallbackState(fromRound);
  };


  const [state, setState] = useState(() => computeInitial());
  const { constructors, drivers, mapping, races, touchedCalendar } = state;

  // ✅ al abrir: rehidrata de nuevo
  useEffect(() => {
    if (!open) return;
    setState(computeInitial());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialConfig, fromRound, season, dbLookups]);

  // ✅ ESC
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  // ✅ si cambia fromRound y NO tocaste calendario, puedes alinear "primera ronda"
  // (solo en fallback; si vienes de BD ya tienes calendario completo)
  useEffect(() => {
    if (!open) return;
    setState((prev) => {
      if (prev.touchedCalendar) return prev;

      // Si en BD no hay races y estamos en modo fallback (1 solo elemento "Round X"), lo actualizamos
      if (prev.races?.length === 1 && String(prev.races[0]?.name || "").startsWith("Round ")) {
        return { ...prev, races: [{ round: fromRound || 1, name: `Round ${fromRound || 1}` }] };
      }
      return prev;
    });
  }, [open, fromRound]);

  const canSubmit = useMemo(() => {
    if (!season || !fromRound) return false;
    if (!Array.isArray(drivers) || drivers.length === 0) return false;
    if (!Array.isArray(constructors) || constructors.length === 0) return false;
    if (!Array.isArray(races) || races.length === 0) return false;

    for (const d of drivers) {
      const cid = mapping?.[String(d.driverId)] ?? mapping?.[d.driverId];
      if (cid == null) return false;
    }

    const roundsOnly = races.map((r) => Number(r.round)).filter(Boolean);
    if (new Set(roundsOnly).size !== roundsOnly.length) return false;

    const anyEmptyDriver = drivers.some((d) => !String(d.name || "").trim());
    const anyEmptyTeam = constructors.some((c) => !String(c.name || "").trim());
    const anyEmptyRace = races.some((r) => !Number(r.round) || !String(r.name || "").trim());
    if (anyEmptyDriver || anyEmptyTeam || anyEmptyRace) return false;

    return true;
  }, [season, fromRound, drivers, constructors, mapping, races]);

  if (!open) return null;

  const submit = () => {
    const payload = {
      season: Number(season),
      fromRound: Number(fromRound),

      customRaces: races.map((r) => ({ round: Number(r.round), name: String(r.name || "").trim() })),

      customDrivers: drivers.map((d) => ({
        driverId: Number(d.driverId),
        name: String(d.name || "").trim(),
      })),

      customConstructors: constructors.map((c) => ({
        constructorId: Number(c.constructorId),
        name: String(c.name || "").trim(),
      })),

      customDriverToConstructor: Object.fromEntries(
        Object.entries(mapping).map(([k, v]) => [String(k), Number(v)])
      ),
    };

    onSubmit(payload);
  };

  return (
    <div className="oc-modalOverlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="oc-customModal" onClick={(e) => e.stopPropagation()}>
        <div className="oc-customModal__head">
          <div>
            <h3>Config de temporada (basada en BD)</h3>
            <p>
              Se precarga con pilotos/equipos/calendario reales si existen en tu base de datos.
              Puedes ajustar lo que necesites.
            </p>
          </div>

          <button className="oc-btn oc-btn--ghost" onClick={onClose} type="button">
            Cerrar
          </button>
        </div>

        {/* CONSTRUCTORS */}
        <section className="oc-customModal__section">
          <h4>Equipos</h4>

          {constructors.map((c, idx) => (
            <div className="oc-customModal__row" key={c.constructorId}>
              <input
                className="oc-input"
                value={c.name}
                onChange={(e) => {
                  const next = [...constructors];
                  next[idx] = { ...c, name: e.target.value };
                  setState((s) => ({ ...s, constructors: next }));
                }}
                placeholder="Nombre del equipo"
              />

              <button
                className="oc-btn oc-btn--ghost oc-customModal__del"
                type="button"
                onClick={() => {
                  setState((s) => ({
                    ...s,
                    constructors: s.constructors.filter((_, i) => i !== idx),
                  }));
                }}
                title="Eliminar"
              >
                ✕
              </button>
            </div>
          ))}

          <div className="oc-customModal__add">
            <button
              className="oc-btn"
              type="button"
              onClick={() => {
                const nextId = mkNegId(100 + constructors.length + 1);
                setState((s) => ({
                  ...s,
                  constructors: [
                    ...s.constructors,
                    { constructorId: nextId, name: `Team ${constructors.length + 1}` },
                  ],
                }));
              }}
            >
              + Añadir equipo
            </button>
          </div>
        </section>

        {/* DRIVERS + MAPPING */}
        <section className="oc-customModal__section">
          <h4>Pilotos + Equipo</h4>

          {drivers.map((d, idx) => (
            <div className="oc-customModal__row oc-customModal__row--3" key={d.driverId}>
              <input
                className="oc-input"
                value={d.name}
                onChange={(e) => {
                  const next = [...drivers];
                  next[idx] = { ...d, name: e.target.value };
                  setState((s) => ({ ...s, drivers: next }));
                }}
                placeholder="Nombre del piloto"
              />

              <select
                className="oc-input"
                value={mapping?.[String(d.driverId)] ?? ""}
                onChange={(e) => {
                  const cid = Number(e.target.value);
                  setState((s) => ({
                    ...s,
                    mapping: { ...s.mapping, [String(d.driverId)]: cid },
                  }));
                }}
              >
                <option value="" disabled>
                  Selecciona equipo…
                </option>
                {constructors.map((c) => (
                  <option key={c.constructorId} value={c.constructorId}>
                    {c.name}
                  </option>
                ))}
              </select>

              <button
                className="oc-btn oc-btn--ghost oc-customModal__del"
                type="button"
                onClick={() => {
                  setState((s) => {
                    const nextDrivers = s.drivers.filter((_, i) => i !== idx);
                    const nextMapping = { ...s.mapping };
                    delete nextMapping[String(d.driverId)];
                    return { ...s, drivers: nextDrivers, mapping: nextMapping };
                  });
                }}
                title="Eliminar"
              >
                ✕
              </button>
            </div>
          ))}

          <div className="oc-customModal__add">
            <button
              className="oc-btn"
              type="button"
              onClick={() => {
                const nextId = mkNegId(drivers.length + 1);
                setState((s) => ({
                  ...s,
                  drivers: [...s.drivers, { driverId: nextId, name: `Driver ${drivers.length + 1}` }],
                }));
              }}
            >
              + Añadir piloto
            </button>
          </div>
        </section>

        {/* RACES */}
        <section className="oc-customModal__section">
          <h4>Calendario</h4>

          {races.map((r, idx) => (
            <div className="oc-customModal__row oc-customModal__row--3" key={`${r.round}-${idx}`}>
              <input
                className="oc-input"
                type="number"
                value={r.round}
                onChange={(e) => {
                  const next = [...races];
                  next[idx] = { ...r, round: Number(e.target.value) };
                  setState((s) => ({ ...s, races: next, touchedCalendar: true }));
                }}
                placeholder="Ronda"
                min={1}
                max={40}
              />

              <input
                className="oc-input"
                value={r.name}
                onChange={(e) => {
                  const next = [...races];
                  next[idx] = { ...r, name: e.target.value };
                  setState((s) => ({ ...s, races: next, touchedCalendar: true }));
                }}
                placeholder="Nombre del GP"
              />

              <button
                className="oc-btn oc-btn--ghost oc-customModal__del"
                type="button"
                onClick={() => {
                  setState((s) => ({
                    ...s,
                    races: s.races.filter((_, i) => i !== idx),
                    touchedCalendar: true,
                  }));
                }}
                title="Eliminar"
              >
                ✕
              </button>
            </div>
          ))}

          <div className="oc-customModal__add">
            <button
              className="oc-btn"
              type="button"
              onClick={() => {
                const nextRound = Math.max(0, ...races.map((x) => Number(x.round) || 0)) + 1;
                setState((s) => ({
                  ...s,
                  races: [...s.races, { round: nextRound, name: `Round ${nextRound}` }],
                  touchedCalendar: true,
                }));
              }}
            >
              + Añadir GP
            </button>
          </div>
        </section>

        <div className="oc-customModal__foot">
          <button className="oc-btn oc-btn--ghost" onClick={onClose} type="button">
            Cancelar
          </button>

          <button
            className="oc-btn oc-btn--primary"
            disabled={!canSubmit}
            onClick={submit}
            type="button"
          >
            Bootstrap custom
          </button>
        </div>
      </div>
    </div>
  );
}
