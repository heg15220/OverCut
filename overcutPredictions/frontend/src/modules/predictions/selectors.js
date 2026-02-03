const getModuleState = (state) => state.predictions;

export const getSeason = (state) => getModuleState(state).season;
export const getFromRound = (state) => getModuleState(state).fromRound;
export const getTotalRounds = (state) => getModuleState(state).totalRounds;

export const getCompletedRaces = (state) => getModuleState(state).completedRaces;

export const getDriverStandings = (state) => getModuleState(state).driverStandings;
export const getConstructorStandings = (state) => getModuleState(state).constructorStandings;

export const getDriverToConstructor = (state) => getModuleState(state).driverToConstructor;

export const getSeasonDrivers = (state) => getLookups(state)?.seasonDrivers || [];


export const getLookups = (state) => getModuleState(state).lookups;

// ✅ mapas listos para UI
export const getDriverNamesMap = (state) => getLookups(state)?.driverNames || {};
export const getConstructorNamesMap = (state) => getLookups(state)?.constructorNames || {};
export const getRaceNamesByRound = (state) => getLookups(state)?.raceNamesByRound || {};

export const getLoading = (state) => getModuleState(state).loading;
export const getError = (state) => getModuleState(state).error;

/* ------------------------------------------------------------------ */
/* ✅ Helpers “pro” (para no mostrar IDs en UI)                         */
/* ------------------------------------------------------------------ */

export const getDriverNameById = (state, driverId) => {
  const map = getDriverNamesMap(state);
  const key = String(driverId);
  return map[key] || map[driverId] || `Driver #${driverId}`;
};

export const getConstructorNameById = (state, constructorId) => {
  const map = getConstructorNamesMap(state);
  const key = String(constructorId);
  return map[key] || map[constructorId] || `Constructor #${constructorId}`;
};

export const getRaceNameByRound = (state, round) => {
  const map = getRaceNamesByRound(state);
  const key = String(round);
  return map[key] || map[round] || `Round ${round}`;
};

/* ------------------------------------------------------------------ */
/* ✅ Opciones para desplegables                                        */
/* ------------------------------------------------------------------ */

/**
 * Opciones de rondas disponibles para simular:
 * - Si backend manda totalRounds => usamos [fromRound..totalRounds]
 * - Si no => usamos rounds inferidos de completedRaces + fromRound como fallback
 */
export const getRoundOptions = (state) => {
  const fromRound = getFromRound(state);
  const totalRounds = getTotalRounds(state);
  const completed = getCompletedRaces(state) || [];

  if (!fromRound) return [];

  // Caso ideal: backend manda totalRounds
  if (totalRounds) {
    const opts = [];
    for (let r = fromRound; r <= totalRounds; r++) {
      opts.push({ value: r, label: getRaceNameByRound(state, r) });
    }
    return opts;
  }

  // Fallback: inferimos el máximo round conocido
  const maxCompleted = completed.reduce((acc, race) => {
    const rr = Number(race?.round);
    return Number.isFinite(rr) ? Math.max(acc, rr) : acc;
  }, 0);

  const inferredMax = Math.max(maxCompleted + 1, fromRound); // +1 porque simulas “a partir de”
  const max = Math.max(inferredMax, fromRound);

  const opts = [];
  for (let r = fromRound; r <= max; r++) {
    opts.push({ value: r, label: getRaceNameByRound(state, r) });
  }
  return opts;
};

/**
 * Driver standings con nombre ya resuelto (para tablas limpias)
 */
export const getDriverStandingsWithNames = (state) => {
  const rows = getDriverStandings(state) || [];
  return rows.map((e) => ({
    ...e,
    name: getDriverNameById(state, e.entityId),
  }));
};

/**
 * Constructor standings con nombre ya resuelto (para tablas limpias)
 */
export const getConstructorStandingsWithNames = (state) => {
  const rows = getConstructorStandings(state) || [];
  return rows.map((e) => ({
    ...e,
    name: getConstructorNameById(state, e.entityId),
  }));
};
