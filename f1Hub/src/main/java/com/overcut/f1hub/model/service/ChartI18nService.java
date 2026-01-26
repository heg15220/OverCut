package com.overcut.f1hub.model.service;


import org.springframework.stereotype.Service;

import java.util.Map;

@Service
public class ChartI18nService {

    private static final Map<String, Map<String, String>> translations = Map.ofEntries(
            Map.entry("averagePointsPerSeason", Map.of(
                    "es", "Promedio de puntos por temporada ",
                    "en", "Average points per season "
            )),
            Map.entry("victoryPercentageByDecade", Map.of(
                    "es", "Porcentaje de victorias por década ",
                    "en", "Victory percentage per decade "
            )),
            Map.entry("podiumPercentageVsTeammate", Map.of(
                    "es", "Porcentaje de podios vs compañero ",
                    "en", "Podium percentage vs teammate "
            )),
            Map.entry("totalPodiumsVsTeammates", Map.of(
                    "es", "Porcentaje total de podios del piloto frente a su equipo ",
                    "en", "Driver's total podium % vs team "
            )),
            Map.entry("q3PercentageVsTeammate", Map.of(
                    "es", "Porcentaje de clasificación vs compañero ",
                    "en", "Q3 percentage vs teammate "
            )),
            Map.entry("avgAccidentsPerSeason", Map.of(
                    "es", "Promedio de accidentes por temporada ",
                    "en", "Average accidents per season "
            )),
            Map.entry("avgRetirementsPerSeason", Map.of(
                    "es", "Promedio de abandonos por temporada ",
                    "en", "Average retirements per season "
            )),
            Map.entry("avgPositionsGainedAfter2Laps", Map.of(
                    "es", "Promedio de posiciones ganadas tras 2 vueltas ",
                    "en", "Average positions gained after 2 laps "
            )),
            Map.entry("avgPositionsGainedBySeason", Map.of(
                    "es", "Posiciones ganadas por temporada ",
                    "en", "Positions gained per season "
            )),
            Map.entry("qualiComparisonVsTeammate", Map.of(
                    "es", "Comparativa clasificación vs compañero ",
                    "en", "Qualifying comparison vs teammate "
            )),
            Map.entry("raceComparisonVsTeammate", Map.of(
                    "es", "Comparativa carrera vs compañero ",
                    "en", "Race comparison vs teammate "
            )),
            Map.entry("winsFromP3OrWorse", Map.of(
                    "es", "Victorias desde P3 o peor ",
                    "en", "Wins from P3 or worse "
            )),
            Map.entry("podiumsFromP3OrWorse", Map.of(
                    "es", "Podios desde P3 o peor ",
                    "en", "Podiums from P3 or worse "
            )),
            Map.entry("mostCommonFinishPosition", Map.of(
                    "es", "Posición más frecuente en carrera por piloto ",
                    "en", "Most common race finish position "
            )),
            Map.entry("mostCommonQualiPosition", Map.of(
                    "es", "Posición más frecuente en clasificación por piloto ",
                    "en", "Most common qualifying position "
            )),
            Map.entry("avgQualiGapToPole", Map.of(
                    "es", "Gap promedio con la pole (Q3) ",
                    "en", "Average gap to pole (Q3) "
            )),
            Map.entry("driverVsTeamChampionshipFinish", Map.of(
                    "es", "Pilotos que superaron o igualaron a su equipo en el campeonato ",
                    "en", "Drivers who beat or matched their team in the championship "
            )),
            Map.entry("winsWithoutTop2", Map.of(
                    "es", "Victorias sin salir desde 1ª o 2ª posición ",
                    "en", "Wins without starting in P1 or P2 "
            )),
            Map.entry("teamComebacksBySeason", Map.of(
                    "es", "Promedio de posiciones ganadas por equipo y temporada ",
                    "en", "Average team position gains per season "
            )),
            Map.entry("totalPointsByTeam", Map.of(
                    "es", "Puntos totales por equipo (histórico) ",
                    "en", "Total points by team (historical) "
            )),
            Map.entry("avgPointsByTeamPerSeason", Map.of(
                    "es", "Puntos por equipo y temporada ",
                    "en", "Points by team per season "
            )),
            Map.entry("pitStopsPerRace", Map.of(
                    "es", "Pasos pit lane por carrera ",
                    "en", "Pit stops per race "
            )),
            Map.entry("avgPitStopsPerSeason", Map.of(
                    "es", "Promedio de paradas por temporada ",
                    "en", "Average pit stops per season "
            )),
            Map.entry("overtakesPerRace", Map.of(
                    "es", "Cambios de Posición por carrera ",
                    "en", "Position changes per race "
            )),
            Map.entry("avgOvertakesPerSeason", Map.of(
                    "es", "Promedio de cambios de posición por temporada ",
                    "en", "Average position changes per season "
            )),
            Map.entry("pointsDeltaVsTeammate", Map.of(
                    "es", "Diferencia media de puntos vs compañero ",
                    "en", "Average points delta vs teammate "
            )),
            Map.entry("avgQualiGapP1P2", Map.of(
                    "es", "Promedio de diferencia entre P1 y P2 en clasificación por temporada ",
                    "en", "Avg quali gap between P1 and P2 per season "
            )),
            Map.entry("avgQualiGapP10Pole", Map.of(
                    "es", "Promedio de diferencia entre P10 y la pole por temporada ",
                    "en", "Avg quali gap between P10 and pole per season "
            )),
            Map.entry("avgRaceGapP1P2", Map.of(
                    "es", "Promedio de diferencia entre P1 y P2 en carrera por temporada ",
                    "en", "Avg race gap between P1 and P2 per season "
            )),
            Map.entry("gridPositionsFromWhichDriversWon", Map.of(
                    "es", "Parrillas desde las que ganó cada piloto ",
                    "en", "Grid positions from which drivers won "
            )),
            Map.entry("frontRowVictoryRate", Map.of(
                    "es", "Porcentaje de victorias desde la primera fila por temporada ",
                    "en", "Front row win rate per season "
            )),
            Map.entry("winPercentageByDriverAtCircuit", Map.of(
                    "es", "Porcentaje de victorias por piloto en ",
                    "en", "Win percentage by driver at "
            )),
            Map.entry("poleWinRateAtCircuit", Map.of(
                    "es", "Victorias desde la Pole vs. otras posiciones en ",
                    "en", "Wins from Pole vs other positions at "
            )),
            Map.entry("championshipProgressTop2", Map.of(
                    "es", "Progreso del campeonato (top 2) ",
                    "en", "Championship progress (top 2) "
            )),
            Map.entry("finishPositionDistribution", Map.of(
                    "es", "Distribución de posiciones finales por piloto",
                    "en", "Finish position distribution by driver"
            )),
            Map.entry("finishVsDNFRatio", Map.of(
                    "es", "Ratio de finalizaciones vs abandonos por piloto",
                    "en", "Finish vs DNF ratio by driver"
            )),
            Map.entry("sprintVsRacePointsEvolution", Map.of(
                    "es", "Evolución de puntos en Sprint y Carrera para ",
                    "en", "Sprint vs Race points evolution for "
            )),
            Map.entry("pointsStreaksPerDriver", Map.of(
                    "es", "Racha más larga de puntos consecutivos por piloto",
                    "en", "Longest points streak per driver"
            )),
            Map.entry("gridToResultDeltaByConstructor", Map.of(
                    "es", "Diferencia promedio entre parrilla y resultado final por constructor",
                    "en", "Average grid vs finish delta by constructor"
            )),
            Map.entry("reliabilityBySeason", Map.of(
                    "es", "Fiabilidad por temporada (% de carreras terminadas)",
                    "en", "Reliability by season (% races finished)"
            )),

            Map.entry("avgRaceDurationPerSeason", Map.of(
                    "es", "Duración promedio de carrera por temporada",
                    "en", "Average race duration per season"
            )),
            Map.entry("avgFastestPitStopPerRace", Map.of(
                    "es", "Pit stop más rápido por carrera",
                    "en", "Fastest pit stop per race"
            )),
            Map.entry("raceLeadersCountPerGP", Map.of(
                    "es", "Cantidad de líderes por Gran Premio",
                    "en", "Number of race leaders per Grand Prix"
            )),

            Map.entry("avgQ1Q3DeltaPerSeason", Map.of(
                    "es", "Diferencia promedio entre Q1 y Q3 por temporada",
                    "en", "Average Q1–Q3 delta per season"
            )),
            Map.entry("avgQualiImprovement", Map.of(
                    "es", "Promedio de mejora entre Q1, Q2 y Q3 por piloto",
                    "en", "Average improvement across Q1–Q3 per driver"
            )),

            Map.entry("crazyRacePerformance", Map.of(
                    "es", "Rendimiento en carreras caóticas (lluvia o muchos abandonos)",
                    "en", "Performance in chaotic races (wet or high attrition)"
            )),
            Map.entry("avgFastestLapSpeedPerSeason", Map.of(
                    "es", "Velocidad promedio en vuelta rápida por temporada",
                    "en", "Average fastest lap speed per season"
            )),
            Map.entry("topOvertakingRaces", Map.of(
                    "es", "Temporadas con más adelantamientos",
                    "en", "Top overtaking Seasons"
            )),
            Map.entry("avgStartPosition", Map.of(
                    "es", "Posición media de salida por piloto en la década ",
                    "en", "Average start position by driver in decade "
            )),
            Map.entry("avgFinishPosition", Map.of(
                    "es", "Posición media de llegada por piloto en la década ",
                    "en", "Average finish position by driver in decade "
            )),
            Map.entry("performanceTrajectory", Map.of(
                    "es", "Trayectoria de rendimiento de ",
                    "en", "Performance trajectory of "
            )),
            Map.entry("qualiToRaceDeltaHistogram", Map.of(
                    "es", "Histograma de diferencias entre clasificación y resultado final. Eje Y número pilotos, eje X delta grid - posición final",
                    "en", "Histogram of quali-to-race position deltas. Y Axis number of drivers, X Axis delta grid - final position"
            )),
            Map.entry("qualiConsistency", Map.of(
                    "es", "Varianza en clasificación por piloto",
                    "en", "Qualifying consistency (variance) by driver"
            )),
            Map.entry("polesWithoutWin", Map.of(
                    "es", "Poles sin victoria por piloto",
                    "en", "Pole positions without a win"
            )),
            Map.entry("technicalFailuresByTeam", Map.of(
                    "es", "Fallos técnicos por equipo",
                    "en", "Technical failures by constructor"
            )),
            Map.entry("retirementCausePerSeason", Map.of(
                    "es", "Causa más común de abandono por temporada",
                    "en", "Most common retirement cause per season"
            )),
            Map.entry("performanceFromPole", Map.of(
                    "es", "Ratio de victorias saliendo desde la pole",
                    "en", "Win rate when starting on pole"
            )),
            Map.entry("podiumsFromOutsideTop10", Map.of(
                    "es", "Pódiums saliendo desde fuera del top 10",
                    "en", "Podiums from outside top 10"
            )),
            Map.entry("bestDriversPerCircuit", Map.of(
                    "es", "Pilotos con más victorias en ",
                    "en", "Drivers with most wins at "
            )),
            Map.entry("constructorDominanceAtCircuit", Map.of(
                    "es", "Dominio de constructores en ",
                    "en", "Constructor dominance at "
            )),
            Map.entry("mostImprovedDriversByDecade", Map.of(
                    "es", "Pilotos que más mejoraron en la década ",
                    "en", "Most improved drivers in decade "
            )),
            Map.entry("championshipsDecidedEarly", Map.of(
                    "es", "Campeonatos decididos antes de la última carrera",
                    "en", "Championships decided before last race"
            )),
            Map.entry("teammateWinsDelta", Map.of(
                    "es", "Diferencia de victorias entre compañeros",
                    "en", "Teammate win delta"
            )),
            Map.entry("teammatePodiumDelta", Map.of(
                    "es", "Diferencia de pódiums entre compañeros",
                    "en", "Teammate podium delta"
            )),
            Map.entry("driverEfficiencyRating", Map.of(
                    "es", "Índice de eficiencia del piloto",
                    "en", "Driver efficiency rating"
            )),
            Map.entry("constructorPerformanceTrajectory", Map.of(
                    "es", "Trayectoria de rendimiento del equipo ",
                    "en", "Team performance trajectory of "
            )),

            Map.entry("teamPerformanceGap", Map.of(
                    "es", "Diferencia de rendimiento entre equipos (gap al ganador) ",
                    "en", "Performance gap between teams (gap to winner) "
            )),
            Map.entry("performanceTrajectoryWithNoPoints", Map.of(
                    "es", "Trayectoria de rendimiento (sin puntos de campeonato) de ",
                    "en", "Performance trajectory (no championship points) of "
            ))
            );

    public String get(String key, String lang) {
        return translations.getOrDefault(key, Map.of()).getOrDefault(lang, translations.getOrDefault(key, Map.of()).get("en"));
    }
}

