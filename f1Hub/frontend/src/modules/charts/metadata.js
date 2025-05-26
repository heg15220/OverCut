// charts/metadata.js

const metadata = {
  // Pilotos
  "average-points-per-season": { label: "Puntos Promedio por Temporada" },
  "victory-percentage-per-season": { label: "Porcentaje de Victorias por Temporada" },
  "podium-percentage-vs-teammate": { label: "Podios vs Compañero", param: "driverId" },
  "q3-percentage-vs-teammate": { label: "Q3 vs Compañero", param: "driverId" },
  "avg-positions-gained-by-season": { label: "Posiciones Ganadas por Temporada", param: "driverId" },
  "avg-positions-gained-first-laps": { label: "Posiciones Ganadas en Primeras Vueltas" },
  "race-vs-teammate-comparison": { label: "Rendimiento en Carrera vs Compañero", param: "driverId" },
  "quali-vs-teammate-comparison": { label: "Rendimiento en Clasificación vs Compañero", param: "driverId" },
  "most-common-finish-position": { label: "Posición Final Más Frecuente" },
  "most-common-quali-position": { label: "Posición de Clasificación Más Frecuente" },
  "points-delta-vs-teammate": { label: "Diferencia de Puntos vs Compañero", param: "season" },
  "driver-vs-team-championship-finish": { label: "Resultado Piloto vs Equipo en el Campeonato" },

  // Constructores
  "team-comebacks-by-season": { label: "Remontadas por Temporada (Equipos)" },
  "avg-team-points-by-season": { label: "Puntos Promedio por Temporada (Equipos)", param: "constructorId" },
  "most-team-points": { label: "Máximos Puntos de un Equipo" },
  "wins-no-front-row": { label: "Victorias sin Salir en 1ª Fila" },

  // Carreras
  "wins-from-3rd-or-worse": { label: "Victorias desde 3ª Posición o Peor" },
  "podiums-from-3rd-or-worse": { label: "Podios desde 3ª Posición o Peor" },
  "average-accidents-by-season": { label: "Accidentes Promedio por Temporada" },
  "pitstops-per-race": { label: "Pitstops por Gran Premio", param: "season" },
  "avg-pitstops-per-season": { label: "Pitstops Promedio por Temporada" },
  "overtakes-per-race": { label: "Adelantamientos por Gran Premio", param: "season" },
  "avg-overtakes-per-season": { label: "Cambios de Posición Promedio por Temporada" }
};

export default metadata;
