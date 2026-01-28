package com.overcut.f1hub.model.entities;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Set;

public interface ResultDao extends JpaRepository<Result, Long> {



    @Query(value = """
SELECT
  r2.constructorId AS constructorId,
  ra.year          AS year,
  AVG(r2.positionOrder) AS avgPos,
  COUNT(*) AS samples
FROM results r1
JOIN results r2
  ON r1.raceId = r2.raceId
 AND r1.constructorId = r2.constructorId
 AND r1.driverId <> r2.driverId
JOIN races ra ON ra.raceId = r1.raceId
WHERE ra.year = :year
  AND r1.driverId = :driverId
  AND r1.positionOrder IS NOT NULL AND r1.positionOrder > 0
  AND r2.positionOrder IS NOT NULL AND r2.positionOrder > 0
GROUP BY r2.constructorId, ra.year
""", nativeQuery = true)
    TeammateAvgRacePosView getTeammateAvgRacePos(@Param("driverId") Long driverId,
                                                 @Param("year") int year);


    @Query(value = """
        SELECT COUNT(*)
        FROM results r
        JOIN races ra ON ra.raceId = r.raceId
        WHERE ra.year = :year
          AND r.constructorId = :constructorId
          AND r.positionOrder IS NOT NULL
          AND r.positionOrder <= 3
        """, nativeQuery = true)
    int countTeamPodiumsBySeason(@Param("constructorId") Long constructorId,
                                 @Param("year") int year);

    @Query(value = """
                WITH driver_stats AS (
                    SELECT
                        ra.year,
                        r.driverId,
                        d.forename,
                        d.surname,
                        AVG(r.positionOrder) AS avgPosition,
                        STDDEV_POP(r.positionOrder) AS stddevPosition,
                        SUM(r.points) AS totalPoints,
                        COUNT(*) AS raceCount,
                        r.constructorId
                    FROM results r
                    JOIN races ra ON r.raceId = ra.raceId
                    JOIN drivers d ON r.driverId = d.driverId
                    WHERE r.driverId = :driverId
                      AND r.positionOrder IS NOT NULL
                      AND r.positionOrder > 0
                    GROUP BY ra.year, r.driverId, r.constructorId
                ),
                team_points AS (
                    SELECT
                        ra.year,
                        r.constructorId,
                        SUM(r.points) AS teamPoints
                    FROM results r
                    JOIN races ra ON r.raceId = ra.raceId
                    WHERE r.points IS NOT NULL
                    GROUP BY ra.year, r.constructorId
                ),
                teammate_battles AS (
                    SELECT
                        ra.year,
                        r1.driverId,
                        SUM(CASE WHEN r1.positionOrder < r2.positionOrder THEN 1 ELSE 0 END) AS teammateWins,
                        COUNT(*) AS teammateBattles
                    FROM results r1
                    JOIN results r2 ON r1.raceId = r2.raceId
                      AND r1.constructorId = r2.constructorId
                      AND r1.driverId <> r2.driverId
                    JOIN races ra ON r1.raceId = ra.raceId
                    WHERE r1.driverId = :driverId
                      AND r1.positionOrder IS NOT NULL AND r2.positionOrder IS NOT NULL
                    GROUP BY ra.year, r1.driverId
                ),
                podiums_by_season_team AS (
                    SELECT
                        ra.year,
                        r.driverId,
                        r.constructorId,
                        SUM(CASE WHEN r.positionOrder IN (1,2,3) THEN 1 ELSE 0 END) AS podiums
                    FROM results r
                    JOIN races ra ON r.raceId = ra.raceId
                    WHERE r.driverId = :driverId
                      AND r.positionOrder IS NOT NULL
                      AND r.positionOrder > 0
                    GROUP BY ra.year, r.driverId, r.constructorId
                ),
            finishes_by_season_team AS (
                SELECT
                    ra.year,
                    r.driverId,
                    r.constructorId,
                    SUM(
                        CASE
                            WHEN s.statusId IS NULL THEN 0
                            WHEN LOWER(s.status) IN ('finished','classified','not classified') THEN 1
                            WHEN LOWER(s.status) REGEXP '\\\\\\\\+\\\\\\\\d+\\\\\\\\s+(lap|laps)' THEN 1
                            ELSE 0
                        END
                    ) AS finishes
                FROM results r
                JOIN races ra ON r.raceId = ra.raceId
                LEFT JOIN status s ON r.statusId = s.statusId
                WHERE r.driverId = :driverId
                GROUP BY ra.year, r.driverId, r.constructorId
            ),
                            
                grid_size_by_year AS (
                    SELECT
                        ra.year,
                        MAX(r.positionOrder) AS gridSize
                    FROM results r
                    JOIN races ra ON r.raceId = ra.raceId
                    WHERE r.positionOrder IS NOT NULL
                      AND r.positionOrder > 0
                    GROUP BY ra.year
                ),
                driver_champ AS (
                    SELECT
                        ds.driverId,
                        r.year,
                        ds.position AS driverChampPos
                    FROM driverstandings ds
                    JOIN races r ON ds.raceId = r.raceId
                    WHERE ds.raceId IN (
                        SELECT r2.raceId FROM races r2
                        WHERE r2.round = (SELECT MAX(r3.round) FROM races r3 WHERE r3.year = r2.year)
                    )
                ),
                team_champ AS (
                    SELECT
                        cs.constructorId,
                        r.year,
                        cs.position AS constructorChampPos
                    FROM constructorstandings cs
                    JOIN races r ON cs.raceId = r.raceId
                    WHERE cs.raceId IN (
                        SELECT r2.raceId FROM races r2
                        WHERE r2.round = (SELECT MAX(r3.round) FROM races r3 WHERE r3.year = r2.year)
                    )
                )
                SELECT
                    ds.driverId,
                    ds.forename,
                    ds.surname,
                    ds.year,
                    ds.avgPosition,
                    ds.stddevPosition,
                    ds.totalPoints,
                    ds.raceCount,
                    ds.constructorId,
                    tp.teamPoints,
                    tb.teammateBattles,
                    tb.teammateWins,
                    COALESCE(pod.podiums, 0) AS podiums,
                    COALESCE(fin.finishes, 0) AS finishes,
                    COALESCE(gs.gridSize, 20) AS gridSize,
                    dc.driverChampPos,
                    tc.constructorChampPos
                FROM driver_stats ds
                LEFT JOIN team_points tp ON tp.year = ds.year AND tp.constructorId = ds.constructorId
                LEFT JOIN teammate_battles tb ON tb.year = ds.year AND tb.driverId = ds.driverId
                LEFT JOIN podiums_by_season_team pod ON pod.year = ds.year AND pod.driverId = ds.driverId AND pod.constructorId = ds.constructorId
                LEFT JOIN finishes_by_season_team fin ON fin.year = ds.year AND fin.driverId = ds.driverId AND fin.constructorId = ds.constructorId
                LEFT JOIN grid_size_by_year gs ON gs.year = ds.year
                LEFT JOIN driver_champ dc ON dc.year = ds.year AND dc.driverId = ds.driverId
                LEFT JOIN team_champ tc ON tc.year = ds.year AND tc.constructorId = ds.constructorId
                ORDER BY ds.year
            """, nativeQuery = true)
    List<DriverSeasonPerformanceView2> getDriverPerformanceStats2(@Param("driverId") Long driverId);








    @Query(value = """
        SELECT
            r.raceId                  AS raceId,
            ra.round                  AS round,
            ra.name                   AS raceName,
            r.constructorId           AS constructorId,
            c.constructorRef          AS constructorRef,
            c.name                    AS constructorName,
            AVG(r.milliseconds - w.winner_ms) AS avgGapMs
        FROM results r
        JOIN races ra ON ra.raceId = r.raceId
        JOIN constructors c ON c.constructorId = r.constructorId
        JOIN (
            SELECT raceId, MIN(milliseconds) AS winner_ms
            FROM results
            WHERE positionOrder = 1 AND milliseconds IS NOT NULL
            GROUP BY raceId
        ) w ON w.raceId = r.raceId
        WHERE ra.year = :year
          AND r.milliseconds IS NOT NULL
          AND r.positionOrder IS NOT NULL
          AND r.positionOrder > 0
        GROUP BY r.raceId, ra.round, ra.name, r.constructorId, c.constructorRef, c.name
        ORDER BY ra.round ASC, c.name ASC
        """, nativeQuery = true)
    List<TeamAvgLapGapToWinnerPerRaceView> getTeamAvgGapToWinnerPerRace(@Param("year") int year);


    List<Result> findByRaceRaceIdOrderByPositionOrderAsc(Long raceId);
    @Query("SELECT r FROM Result r WHERE r.positionOrder = 1 AND r.grid > 2")
    List<Result> findAllByPositionOrderAndGridGreaterThan(@Param("positionOrder") int positionOrder, @Param("grid") int grid);


    @Query("SELECT COUNT(r) FROM Result r JOIN r.race ra WHERE r.driver.driverId = :driverId AND r.positionOrder = 1 AND ra.year BETWEEN :startYear AND :endYear")
    long countWinsByDriverAndYear(@Param("driverId") Long driverId, @Param("startYear") int startYear, @Param("endYear") int endYear);

    // Contar total de carreras disputadas por piloto en la década
    @Query("SELECT COUNT(r) FROM Result r JOIN r.race ra WHERE r.driver.driverId = :driverId AND ra.year BETWEEN :startYear AND :endYear")
    long countRacesByDriverAndYear(@Param("driverId") Long driverId, @Param("startYear") int startYear, @Param("endYear") int endYear);

    @Query("SELECT COUNT(r) FROM Race r WHERE r.year BETWEEN :startYear AND :endYear")
    long countRacesInDecade(@Param("startYear") int startYear, @Param("endYear") int endYear);

    @Query("SELECT r FROM Result r WHERE r.race.raceId = :raceId")
    List<Result> findByRaceId(@Param("raceId") Long raceId);


    @Query("""
    SELECT COUNT(r)
    FROM Result r
    JOIN r.race race
    JOIN r.driver d
    WHERE race.year = :year
      AND d.forename = :forename
      AND d.surname = :surname
      AND r.positionOrder IN (1, 2, 3)
    """)
    long countPodiumsByDriverInYear(@Param("forename") String forename,
                                    @Param("surname") String surname,
                                    @Param("year") int year);



    @Query("""
    SELECT COUNT(r)
    FROM Result r
    JOIN r.race race
    JOIN r.constructor c
    WHERE race.year = :year
      AND c.constructorRef = :constructorRef
      AND r.positionOrder IN (1, 2, 3)
    """)
    long countPodiumsByConstructorInYear(@Param("constructorRef") String constructorRef,
                                         @Param("year") int year);


    @Query("""
    SELECT r.driver.driverId, r.race.year, AVG(r.points)
    FROM Result r
    WHERE r.race.year BETWEEN :startYear AND :endYear
    GROUP BY r.driver.driverId, r.race.year
""")
    List<Object[]> getAveragePointsPerSeasonByDriver(@Param("startYear") int startYear, @Param("endYear") int endYear);


    @Query("""
    SELECT r FROM Result r
    JOIN FETCH r.race ra
    JOIN FETCH r.constructor c
    WHERE r.driver.driverId = :driverId
    ORDER BY ra.year ASC, ra.round ASC
""")
    List<Result> findAllByDriverIdWithRaceAndConstructor(@Param("driverId") Long driverId);

    @Query("""
    SELECT r FROM Result r
    JOIN FETCH r.race ra
    JOIN FETCH r.constructor c
    WHERE r.points IS NOT NULL
""")
    List<Result> findConstructorPointsAndRaces();

    @Query("""
    SELECT r FROM Result r
    JOIN FETCH r.race ra
    JOIN FETCH r.constructor c
    JOIN FETCH r.driver d
""")
    List<Result> findConstructorAndDriverForRaces();


    @Query(value = """
    SELECT
        r.driverId AS driverId,
        r.constructorId AS constructorId,
        ra.raceId AS raceId,
        ra.year AS year,
        r.positionOrder AS positionOrder,
        r.points AS points
    FROM results r
    JOIN races ra ON r.raceId = ra.raceId
    WHERE r.driverId = :driverId
    ORDER BY ra.year, ra.round
""", nativeQuery = true)
    List<DriverRaceStatView> findDriverStatsOptimized(@Param("driverId") Long driverId);

    @Query(value = """
    SELECT ra.year AS year,
           r.constructorId AS constructorId,
           SUM(r.points) AS points
    FROM results r
    JOIN races ra ON r.raceId = ra.raceId
    WHERE r.points IS NOT NULL
    GROUP BY ra.year, r.constructorId
""", nativeQuery = true)
    List<ConstructorPointsByYearView> getConstructorPointsByYear();


    @Query(value = """
    SELECT ra.raceId AS raceId,
           r.driverId AS driverId,
           r.constructorId AS constructorId,
           ra.year AS year,
           r.positionOrder AS positionOrder
    FROM results r
    JOIN races ra ON r.raceId = ra.raceId
    WHERE r.constructorId IS NOT NULL AND r.driverId IS NOT NULL AND r.positionOrder IS NOT NULL
""", nativeQuery = true)
    List<RaceResultLiteView> getAllRaceResultsLite();


    @Query(value = """
    SELECT ra.year AS year,
           r.positionOrder AS positionOrder,
           r.points AS points
    FROM results r
    JOIN races ra ON r.raceId = ra.raceId
    WHERE r.constructorId = :constructorId
    ORDER BY ra.year
""", nativeQuery = true)
    List<ConstructorRaceStatView> findConstructorStatsOptimized(@Param("constructorId") Long constructorId);


    @Query(value = """
    SELECT
        r.driverId AS driverId,
        c.constructorRef AS constructorRef,
        ra.year AS year,
        COUNT(*) AS podiums
    FROM results r
    JOIN races ra ON r.raceId = ra.raceId
    JOIN constructors c ON r.constructorId = c.constructorId
    WHERE r.positionOrder IN (1,2,3)
      AND ra.year BETWEEN :startYear AND :endYear
    GROUP BY r.driverId, c.constructorRef, ra.year
""", nativeQuery = true)
    List<PodiumStatsView> getPodiumsByDriverAndTeamPerYear(@Param("startYear") int start, @Param("endYear") int end);


    @Query(value = """
    SELECT r.driverId AS driverId,
           r.constructorId AS constructorId,
           ra.year AS year,
           r.positionOrder AS positionOrder
    FROM results r
    JOIN races ra ON r.raceId = ra.raceId
    WHERE r.positionOrder <= 3
""", nativeQuery = true)
    List<PodiumLiteView> findAllPodiumResultsLite();


    @Query(value = """
    SELECT r.grid AS grid, r.positionOrder AS positionOrder, ra.year AS year
    FROM results r
    JOIN races ra ON r.raceId = ra.raceId
    WHERE r.driverId = :driverId
      AND r.grid IS NOT NULL
      AND r.grid > 0
      AND r.positionOrder IS NOT NULL
""", nativeQuery = true)
    List<ResultDeltaView> findGridDeltasByDriver(@Param("driverId") Long driverId);



    @Query(value = """
    SELECT r.raceId AS raceId,
           r.driverId AS driverId,
           r.grid AS grid,
           l.position AS lap2Position
    FROM results r
    JOIN laptimes l ON r.raceId = l.raceId AND r.driverId = l.driverId
    WHERE l.lap = 2 AND r.grid IS NOT NULL AND r.grid != 0 AND l.position IS NOT NULL
""", nativeQuery = true)
    List<Lap2GainView> getLap2GainsLite();



    @Query(value = """
    SELECT r.raceId AS raceId,
           r.driverId AS driverId,
           r.constructorId AS constructorId,
           r.positionOrder AS positionOrder,
           ra.year AS year
    FROM results r
    JOIN races ra ON r.raceId = ra.raceId
    WHERE r.positionOrder IS NOT NULL
      AND r.constructorId IS NOT NULL
      AND r.driverId IS NOT NULL
      AND ra.year BETWEEN 1950 AND 2025
""", nativeQuery = true)
    List<RaceComparisonLiteView> getAllResultsForRaceTeammateComparison();



    @Query(value = """
    SELECT r.raceId AS raceId, r.constructorId AS constructorId,
           r.driverId AS driverId, r.points AS points
    FROM results r
    JOIN races ra ON r.raceId = ra.raceId
    WHERE ra.year = :season AND r.points IS NOT NULL
""", nativeQuery = true)
    List<PointsResultView> getPointsByDriverForSeason(@Param("season") int season);

    @Query(value = """
    SELECT r.constructorId AS constructorId, ra.year AS year,
           r.grid AS grid, r.positionOrder AS positionOrder
    FROM results r
    JOIN races ra ON r.raceId = ra.raceId
    WHERE r.grid IS NOT NULL AND r.positionOrder IS NOT NULL
      AND ra.year BETWEEN :startYear AND :endYear
""", nativeQuery = true)
    List<TeamDeltaView> getGridVsFinishByConstructor(@Param("startYear") int startYear, @Param("endYear") int endYear);


    @Query(value = """
    SELECT r.constructorId AS constructorId, ra.year AS year, SUM(r.points) AS points
    FROM results r
    JOIN races ra ON r.raceId = ra.raceId
    WHERE r.points IS NOT NULL AND ra.year BETWEEN :startYear AND :endYear
    GROUP BY r.constructorId, ra.year
""", nativeQuery = true)
    List<TeamPointsYearView> getPointsPerConstructorPerYear(@Param("startYear") int startYear, @Param("endYear") int endYear);


    @Query(value = """
    SELECT r.constructorId AS constructorId, COUNT(*) AS wins
    FROM results r
    WHERE r.grid > 2 AND r.positionOrder = 1 AND r.constructorId IS NOT NULL
    GROUP BY r.constructorId
""", nativeQuery = true)
    List<ConstructorWinsView> getWinsFromP3OrLower();


    @Query(value = """
    SELECT r.constructorId AS constructorId, SUM(r.points) AS totalPoints
    FROM results r
    WHERE r.points IS NOT NULL AND r.constructorId IS NOT NULL
    GROUP BY r.constructorId
""", nativeQuery = true)
    List<TeamPointsView> getTotalPointsByConstructor();

    @Query(value = "SELECT r.driverId AS driverId, COUNT(*) AS count " +
            "FROM results r " +
            "WHERE r.positionOrder <= 3 AND r.grid > 2 " +
            "AND r.positionOrder IS NOT NULL AND r.grid IS NOT NULL " +
            "GROUP BY r.driverId",
            nativeQuery = true)
    List<PodiumFromP3View> getPodiumsFrom3rdOrWorse();



    @Query(value = "SELECT ds.raceId AS raceId, ds.driverId AS driverId, r.constructorId AS constructorId, " +
            "ds.position AS driverPos, cs.position AS constructorPos " +
            "FROM driverstandings ds " +
            "JOIN results r ON ds.raceId = r.raceId AND ds.driverId = r.driverId " +
            "JOIN constructorstandings cs ON ds.raceId = cs.raceId AND r.constructorId = cs.constructorId " +
            "JOIN races ra ON ds.raceId = ra.raceId " +
            "WHERE ra.year BETWEEN :startYear AND :endYear " +
            "AND ra.round = (SELECT MAX(r2.round) FROM races r2 WHERE r2.year = ra.year)",
            nativeQuery = true)
    List<FinalStandingView> getDriverAndTeamPositionsAtSeasonEnd(@Param("startYear") int startYear, @Param("endYear") int endYear);


    @Query(value = "SELECT ra.year AS year, COUNT(*) AS count " +
            "FROM results r " +
            "JOIN races ra ON r.raceId = ra.raceId " +
            "JOIN status s ON r.statusId = s.statusId " +
            "WHERE LOWER(s.status) NOT IN (" +
            "'finished', 'classified', 'not classified', 'excluded', 'disqualified', " +
            "'did not qualify', 'did not prequalify', 'did not start', 'withdrew', '107% rule') " +
            "AND LOWER(s.status) NOT REGEXP '\\\\+\\\\d+\\\\s+laps?' " +
            "GROUP BY ra.year",
            nativeQuery = true)
    List<RetirementStatView> getRetirementCountsBySeason();

    @Query(value = "SELECT r.driverId AS driverId, COUNT(*) AS count " +
            "FROM results r " +
            "WHERE r.positionOrder = 1 AND r.grid > 2 " +
            "AND r.positionOrder IS NOT NULL AND r.grid IS NOT NULL " +
            "GROUP BY r.driverId",
            nativeQuery = true)
    List<PodiumFromP3View> getWinsFrom3rdOrWorse();


    // En ResultDao
// En ResultDao
    @Query(value = """
    SELECT ra.year AS year,
           AVG(r2.milliseconds - r1.milliseconds) AS diff
    FROM results r1
    JOIN results r2 ON r1.raceId = r2.raceId AND r1.positionOrder = 1 AND r2.positionOrder = 2
    JOIN races ra ON r1.raceId = ra.raceId
    WHERE r1.milliseconds IS NOT NULL AND r2.milliseconds IS NOT NULL
    GROUP BY ra.year
    ORDER BY ra.year
""", nativeQuery = true)
    List<RaceGapP1P2View> getAvgGapBetweenRaceP1AndP2PerSeason();


    // Pilotos que ganaron desde cada posición de parrilla
    @Query(value = """
    SELECT r.grid AS grid, d.driverId AS driverId, d.forename AS forename, d.surname AS surname
    FROM results r
    JOIN drivers d ON r.driverId = d.driverId
    WHERE r.positionOrder = 1 AND r.grid IS NOT NULL
""", nativeQuery = true)
    List<GridVictoryView> getWinnersByGridPosition();

    // Ratio de victorias desde la primera fila por año
    @Query(value = """
    SELECT ra.year AS year,
           COUNT(DISTINCT ra.raceId) AS totalRaces,
           SUM(CASE WHEN r.grid IN (1,2) AND r.positionOrder = 1 THEN 1 ELSE 0 END) AS frontRowWins
    FROM results r
    JOIN races ra ON r.raceId = ra.raceId
    WHERE r.grid IS NOT NULL AND r.positionOrder IS NOT NULL
    GROUP BY ra.year
    ORDER BY ra.year
""", nativeQuery = true)
    List<FrontRowWinRateView> getFrontRowWinRatePerYear();


    @Query(value = """
    SELECT d.driverId AS driverId, d.forename AS forename, d.surname AS surname, COUNT(*) AS wins
    FROM results r
    JOIN races ra ON r.raceId = ra.raceId
    JOIN circuits c ON ra.circuitId = c.circuitId
    JOIN drivers d ON r.driverId = d.driverId
    WHERE r.positionOrder = 1 AND c.circuitRef = :circuitRef
    GROUP BY d.driverId, d.forename, d.surname
""", nativeQuery = true)
    List<CircuitWinPercentageView> getWinCountsByDriverAtCircuit(@Param("circuitRef") String circuitRef);

    @Query(value = """
    SELECT r.grid AS grid, r.raceId AS raceId
    FROM results r
    JOIN races ra ON r.raceId = ra.raceId
    JOIN circuits c ON ra.circuitId = c.circuitId
    WHERE r.positionOrder = 1 AND c.circuitRef = :circuitRef
""", nativeQuery = true)
    List<PoleWinRateView> getWinningGridsAtCircuit(@Param("circuitRef") String circuitRef);

    @Query(value = """
    SELECT r.driverId AS driverId, r.positionOrder AS positionOrder, COUNT(*) AS count
    FROM results r
    WHERE r.positionOrder IS NOT NULL
    GROUP BY r.positionOrder, r.driverId
""", nativeQuery = true)
    List<FinishPositionCountView> getFinishPositionHistogram();

    @Query(value = """
    SELECT r.driverId AS driverId, LOWER(s.status) AS status
    FROM results r
    JOIN status s ON r.statusId = s.statusId
""", nativeQuery = true)
    List<FinishDnfView> getAllDriverStatus();

    @Query(value = """
    SELECT r.driverId AS driverId, ra.date AS raceDate, r.points AS points
    FROM results r
    JOIN races ra ON r.raceId = ra.raceId
    ORDER BY ra.date ASC
""", nativeQuery = true)
    List<DriverRacePointsView> getAllDriverRacePointsOrdered();


    @Query(value = """
    SELECT r.constructorId AS constructorId, (r.grid - r.positionOrder) AS delta
    FROM results r
    WHERE r.grid IS NOT NULL AND r.positionOrder IS NOT NULL
""", nativeQuery = true)
    List<ConstructorGridDeltaView> getGridDeltasPerConstructor();



    @Query(value = """
    SELECT r.constructorId AS constructorId, ra.year AS year, s.status AS status
    FROM results r
    JOIN races ra ON r.raceId = ra.raceId
    JOIN status s ON r.statusId = s.statusId
    WHERE r.constructorId IS NOT NULL AND s.status IS NOT NULL
""", nativeQuery = true)
    List<ConstructorReliabilityView> getConstructorReliabilityStats();



    @Query(value = """
    SELECT ra.year AS year, r.milliseconds AS milliseconds
    FROM results r
    JOIN races ra ON r.raceId = ra.raceId
    WHERE r.positionOrder = 1 AND r.milliseconds IS NOT NULL
""", nativeQuery = true)
    List<RaceDurationView> getRaceDurations();

    @Query(value = """
    SELECT ra.year AS year, r.fastestLapSpeed AS speed
    FROM results r
    JOIN races ra ON r.raceId = ra.raceId
    WHERE r.fastestLapSpeed IS NOT NULL
""", nativeQuery = true)
    List<FastestLapSpeedView> getFastestLapSpeedsPerSeason();



    @Query(value = """
    SELECT r.driverId AS driverId, r.grid AS grid
    FROM results r
    JOIN races ra ON r.raceId = ra.raceId
    WHERE ra.year BETWEEN :start AND :end
      AND r.grid IS NOT NULL
""", nativeQuery = true)
    List<ResultGridView> getStartPositionsInYears(@Param("start") int start, @Param("end") int end);


    @Query(value = """
    SELECT r.driverId AS driverId, r.positionOrder AS positionOrder
    FROM results r
    JOIN races ra ON r.raceId = ra.raceId
    WHERE ra.year BETWEEN :start AND :end
      AND r.positionOrder IS NOT NULL
""", nativeQuery = true)
    List<ResultFinishView> getFinishPositionsInYears(@Param("start") int start, @Param("end") int end);

    @Query(value = """
    SELECT r.grid AS grid, r.positionOrder AS positionOrder
    FROM results r
    WHERE r.grid IS NOT NULL AND r.positionOrder IS NOT NULL
""", nativeQuery = true)
    List<QualiRaceDeltaView> getAllGridRaceDeltas();


    @Query(value = """
    SELECT r.constructorId AS constructorId, COUNT(*) AS failures
    FROM results r
    JOIN status s ON r.statusId = s.statusId
    WHERE LOWER(s.status) IN (
        'accident', 'collision', 'collision damage', 'engine', 'gearbox', 'hydraulics', 'electrical',
        'suspension', 'brakes', 'fuel', 'puncture', 'tyre', 'wheel', 'steering', 'transmission',
        'overheating', 'driveshaft', 'clutch', 'chassis', 'mechanical', 'exhaust', 'radiator',
        'oil leak', 'oil pressure', 'fire', 'power unit', 'power loss', 'turbo', 'water leak',
        'water pump', 'brake duct', 'electrics', 'differential', 'drivetrain'
    )
    GROUP BY r.constructorId
    ORDER BY failures DESC
    LIMIT 25
""", nativeQuery = true)
    List<TechnicalFailureView> getTechnicalFailures();

    @Query(value = """
    SELECT ra.year AS year, LOWER(s.status) AS cause, COUNT(*) AS count
    FROM results r
    JOIN races ra ON r.raceId = ra.raceId
    JOIN status s ON r.statusId = s.statusId
    WHERE LOWER(s.status) IN (
        'accident', 'collision', 'collision damage', 'engine', 'gearbox', 'hydraulics', 'electrical',
        'suspension', 'brakes', 'fuel', 'puncture', 'tyre', 'wheel', 'steering', 'transmission',
        'overheating', 'driveshaft', 'clutch', 'chassis', 'mechanical', 'exhaust', 'radiator',
        'oil leak', 'oil pressure', 'fire', 'power unit', 'power loss', 'turbo', 'water leak',
        'water pump', 'brake duct', 'electrics', 'differential', 'drivetrain'
    )
    GROUP BY ra.year, cause
""", nativeQuery = true)
    List<RetirementCauseSeasonView> getMostCommonRetirementCausesBySeason();

    @Query(value = """
    SELECT ra.year AS year, LOWER(s.status) AS cause, COUNT(*) AS count
    FROM results r
    JOIN races ra ON r.raceId = ra.raceId
    JOIN status s ON r.statusId = s.statusId
    WHERE LOWER(s.status) IN (
        'accident', 'collision', 'collision damage', 'engine', 'gearbox', 'hydraulics', 'electrical',
        'suspension', 'brakes', 'fuel', 'puncture', 'tyre', 'wheel', 'steering', 'transmission',
        'overheating', 'driveshaft', 'clutch', 'chassis', 'mechanical', 'exhaust', 'radiator',
        'oil leak', 'oil pressure', 'fire', 'power unit', 'power loss', 'turbo', 'water leak',
        'water pump', 'brake duct', 'electrics', 'differential', 'drivetrain'
    )
    GROUP BY ra.year, cause
""", nativeQuery = true)
    List<RetirementCauseView> getYearlyRetirementCauses();

    @Query(value = """
    SELECT r.driverId AS driverId,
           COUNT(*) FILTER (WHERE r.grid = 1) AS totalPoles,
           COUNT(*) FILTER (WHERE r.grid = 1 AND r.positionOrder = 1) AS winsFromPole
    FROM results r
    WHERE r.grid IS NOT NULL AND r.positionOrder IS NOT NULL
    GROUP BY r.driverId
""", nativeQuery = true)
    List<PolePerformanceView> getPolePerformance();



    @Query("SELECT DISTINCT r.driver.driverId FROM Result r WHERE r.positionOrder = 1")
    Set<Long> findAllWinners();


    @Query(value = """
    SELECT DISTINCT r.driverId
    FROM results r
    WHERE r.positionOrder = 1
""", nativeQuery = true)
    List<Long> getAllWinningDriverIds();


    @Query(value = """
    SELECT r.constructorId AS constructorId, COUNT(*) AS failureCount
    FROM results r
    JOIN status s ON r.statusId = s.statusId
    WHERE LOWER(s.status) IN (:techFailures)
    GROUP BY r.constructorId
""", nativeQuery = true)
    List<ConstructorFailureCountView> getTechnicalFailuresPerConstructor(@Param("techFailures") Set<String> techFailures);


    @Query(value = """
    SELECT ra.year AS year, LOWER(s.status) AS status, COUNT(*) AS count
    FROM results r
    JOIN races ra ON r.raceId = ra.raceId
    JOIN status s ON r.statusId = s.statusId
    WHERE LOWER(s.status) IN (:validCauses)
    GROUP BY ra.year, LOWER(s.status)
""", nativeQuery = true)
    List<RetirementCausePerYearView> getRetirementCausesPerYear(@Param("validCauses") Set<String> validCauses);

    @Query(value = """
    SELECT r.driverId AS driverId, r.grid AS grid, r.positionOrder AS positionOrder
    FROM results r
    WHERE r.grid = 1 AND r.positionOrder IS NOT NULL
""", nativeQuery = true)
    List<PolePerformanceView> getPolePerformanceStats();

    @Query(value = """
    SELECT r.driverId AS driverId
    FROM results r
    WHERE r.grid > 10 AND r.positionOrder IS NOT NULL AND r.positionOrder <= 3
""", nativeQuery = true)
    List<OutsideTop10PodiumView> getPodiumsFromOutsideTop10();


    @Query(value = """
    SELECT r.driverId AS driverId, COUNT(*) AS wins
    FROM results r
    JOIN races ra ON r.raceId = ra.raceId
    WHERE ra.circuitId = (SELECT c.circuitId FROM circuits c WHERE c.circuitRef = :circuitRef)
      AND r.positionOrder = 1
    GROUP BY r.driverId
""", nativeQuery = true)
    List<CircuitWinByDriverView> getWinsByDriverAtCircuit(@Param("circuitRef") String circuitRef);


    @Query(value = """
    SELECT r.constructorId AS constructorId, COUNT(*) AS wins
    FROM results r
    JOIN races ra ON r.raceId = ra.raceId
    WHERE ra.circuitId = (SELECT c.circuitId FROM circuits c WHERE c.circuitRef = :circuitRef)
      AND r.positionOrder = 1
    GROUP BY r.constructorId
""", nativeQuery = true)
    List<CircuitWinByConstructorView> getWinsByConstructorAtCircuit(@Param("circuitRef") String circuitRef);


    @Query(value = """
    SELECT r.driverId AS driverId,
           r.constructorId AS constructorId,
           ra.year AS year,
           (r.positionOrder = 1) AS won
    FROM results r
    JOIN races ra ON r.raceId = ra.raceId
    WHERE r.constructorId IS NOT NULL AND r.driverId IS NOT NULL AND r.positionOrder IS NOT NULL
""", nativeQuery = true)
    List<DriverWinByTeamSeasonView> getAllDriverWinsByTeamAndSeason();

    @Query(value = """
    SELECT r.driverId AS driverId, r.grid AS grid, r.points AS points
    FROM results r
    WHERE r.grid IS NOT NULL AND r.grid > 0 AND r.driverId IS NOT NULL
""", nativeQuery = true)
    List<EfficiencyRawDataView> getEfficiencyRawData();


    @Query(value = """
    SELECT COUNT(*) FROM races WHERE year BETWEEN :startYear AND :endYear
""", nativeQuery = true)
    long countTotalRacesInDecade(@Param("startYear") int startYear, @Param("endYear") int endYear);


    @Query(value = """
    SELECT
      r1.driverId AS driverId,
      (r1.points - r2.points) AS delta
    FROM results r1
    JOIN results r2 ON r1.raceId = r2.raceId AND r1.constructorId = r2.constructorId
    JOIN races ra ON r1.raceId = ra.raceId
    WHERE ra.year = :season
      AND r1.driverId <> r2.driverId
      AND r1.points IS NOT NULL
      AND r2.points IS NOT NULL
      AND r1.constructorId IS NOT NULL
      AND r1.driverId IS NOT NULL
      AND r2.driverId IS NOT NULL
""", nativeQuery = true)
    List<TeammatePointsDeltaView> getTeammatePointsDeltas(@Param("season") int season);


    @Query(value = """
    SELECT r.raceId AS raceId,
           r.driverId AS driverId,
           r.constructorId AS constructorId,
           r.positionOrder AS positionOrder,
           ra.year AS year
    FROM results r
    JOIN races ra ON r.raceId = ra.raceId
    WHERE r.positionOrder IS NOT NULL
      AND r.constructorId IS NOT NULL
      AND r.driverId IS NOT NULL
      AND ra.year BETWEEN 1950 AND 2025
      AND EXISTS (
        SELECT 1 FROM results r2
        WHERE r2.raceId = r.raceId
          AND r2.constructorId = r.constructorId
          AND r2.driverId = :driverId
      )
""", nativeQuery = true)
    List<RaceComparisonLiteView> getRaceResultsWithDriverAndTeammates(@Param("driverId") Long driverId);


    @Query(value = """
    SELECT r.raceId AS raceId, r.driverId AS driverId,
           r.constructorId AS constructorId, r.positionOrder AS positionOrder,
           ra.year AS year
    FROM results r
    JOIN races ra ON r.raceId = ra.raceId
    WHERE ra.year BETWEEN 1950 AND 2025
      AND r.positionOrder IS NOT NULL
      AND r.constructorId IS NOT NULL
""", nativeQuery = true)
    List<RaceResultLiteView> getRaceResultsWithTeammates();

    @Query(value = """
    SELECT r.raceId AS raceId, r.driverId AS driverId,
           r.constructorId AS constructorId, r.positionOrder AS positionOrder,
           ra.year AS year
    FROM results r
    JOIN races ra ON r.raceId = ra.raceId
    WHERE ra.year IN :years
      AND r.constructorId IS NOT NULL
      AND r.positionOrder IS NOT NULL
""", nativeQuery = true)
    List<RaceResultLiteView> getRaceResultsForYears(@Param("years") Set<Integer> years);

    @Query(value = """
    SELECT
        ra.year AS year,
        r1.driverId AS driverId,
        SUM(CASE WHEN r1.positionOrder < r2.positionOrder THEN 1 ELSE 0 END) AS teammateWins,
        COUNT(*) AS teammateBattles
    FROM results r1
    JOIN results r2 ON r1.raceId = r2.raceId
      AND r1.constructorId = r2.constructorId
      AND r1.driverId <> r2.driverId
    JOIN races ra ON r1.raceId = ra.raceId
    WHERE ra.year IN :years
      AND r1.driverId = :driverId
      AND r1.positionOrder IS NOT NULL
      AND r2.positionOrder IS NOT NULL
    GROUP BY ra.year, r1.driverId
""", nativeQuery = true)
    List<TeammateBattleStatView> getTeammateBattleStats(
            @Param("driverId") Long driverId,
            @Param("years") Set<Integer> years
    );


    @Query(value = """
    SELECT driverId, COUNT(*)
    FROM results
    WHERE positionOrder IN (:positions)
    GROUP BY driverId
""", nativeQuery = true)
    List<Object[]> countPodiumsByPositions(@Param("positions") Set<Integer> positions);

    @Query(value = """
    SELECT res.driverId, MIN(r.date) AS firstPodiumDate, MIN(r.year) AS firstPodiumYear
    FROM results res
    JOIN races r ON res.raceId = r.raceId
    WHERE res.positionOrder <= 3
    GROUP BY res.driverId
""", nativeQuery = true)
    List<Object[]> getFirstPodiumPerDriver();


    @Query(value = """
    SELECT res.constructorId, MIN(r.date) AS firstPodiumDate, MIN(r.year) AS firstPodiumYear
    FROM results res
    JOIN races r ON res.raceId = r.raceId
    WHERE res.positionOrder <= 3
    GROUP BY res.constructorId
""", nativeQuery = true)
    List<Object[]> getFirstPodiumPerConstructor();


    @Query(value = """
    SELECT driverId, MIN(DATEDIFF(race.date, dob)) AS ageDays
    FROM results
    JOIN drivers USING(driverId)
    JOIN races USING(raceId)
    WHERE positionOrder <= 3
      AND dob IS NOT NULL
      AND race.date IS NOT NULL
    GROUP BY driverId
""", nativeQuery = true)
    List<Object[]> getYoungestPodiumDrivers();

    @Query(value = """
    SELECT res.driverId, COUNT(*) AS birthdayPodiums
    FROM results res
    JOIN drivers d ON res.driverId = d.driverId
    JOIN races r ON res.raceId = r.raceId
    WHERE res.positionOrder <= 3
      AND DAY(d.dob) = DAY(r.date)
      AND MONTH(d.dob) = MONTH(r.date)
    GROUP BY res.driverId
""", nativeQuery = true)
    List<Object[]> countPodiumsOnBirthday();

    @Query(value = """
    SELECT d.driverId, DATEDIFF(MAX(r.date), d.dob) AS ageDays
    FROM results res
    JOIN drivers d ON res.driverId = d.driverId
    JOIN races r ON res.raceId = r.raceId
    WHERE res.positionOrder <= 3
      AND d.dob IS NOT NULL
      AND r.date IS NOT NULL
    GROUP BY d.driverId
""", nativeQuery = true)
    List<Object[]> getOldestPodiumDrivers();

    @Query(value = """
WITH all_races AS (
    SELECT res.driverId, r.date,
           ROW_NUMBER() OVER (PARTITION BY res.driverId ORDER BY r.date) AS seq_all
    FROM results res
    JOIN races r ON res.raceId = r.raceId
),

podium_races AS (
    SELECT res.driverId, r.date,
           ROW_NUMBER() OVER (PARTITION BY res.driverId ORDER BY r.date) AS seq_podium
    FROM results res
    JOIN races r ON res.raceId = r.raceId
    WHERE res.positionOrder <= 3
),

joined AS (
    SELECT
        p.driverId,
        (a.seq_all - p.seq_podium) AS grp
    FROM podium_races p
    JOIN all_races a ON a.driverId = p.driverId AND a.date = p.date
),

streaks AS (
    SELECT driverId, grp, COUNT(*) AS streak_length
    FROM joined
    GROUP BY driverId, grp
)

SELECT driverId, MAX(streak_length) AS max_streak
FROM streaks
GROUP BY driverId
ORDER BY max_streak DESC
""", nativeQuery = true)
    List<Object[]> getLongestPodiumStreaks();


    @Query(value = """
    WITH ordered_rounds AS (
        SELECT
            res.driverId,
            r.year,
            r.round,
            ROW_NUMBER() OVER (PARTITION BY res.driverId, r.year ORDER BY r.round) AS seq
        FROM results res
        JOIN races r ON res.raceId = r.raceId
        WHERE res.positionOrder <= 3
    ),
    start_matches AS (
        SELECT driverId, year, round, seq
        FROM ordered_rounds
        WHERE round = seq
    ),
    streak_counts AS (
        SELECT driverId, year, COUNT(*) AS seasonStartStreak
        FROM start_matches
        GROUP BY driverId, year
    )
    SELECT driverId, MAX(seasonStartStreak) AS maxStreak
    FROM streak_counts
    GROUP BY driverId
    """, nativeQuery = true)
    List<Object[]> getSeasonStartPodiumStreaks();

    @Query(value = """
    SELECT res.driverId, MAX(r.year)
    FROM results res
    JOIN races r ON res.raceId = r.raceId
    WHERE res.positionOrder <= 3
    GROUP BY res.driverId
""", nativeQuery = true)
    List<Object[]> getLastPodiumYearPerDriver();

    @Query(value = """
    WITH podiums AS (
        SELECT res.driverId, r.date AS raceDate
        FROM results res
        JOIN races r ON res.raceId = r.raceId
        WHERE res.positionOrder <= 3
    ),
    ordered AS (
        SELECT
            driverId,
            raceDate,
            LAG(raceDate) OVER (PARTITION BY driverId ORDER BY raceDate) AS prevDate
        FROM podiums
    ),
    gaps AS (
        SELECT driverId, DATEDIFF(raceDate, prevDate) AS gap
        FROM ordered
        WHERE prevDate IS NOT NULL
    )
    SELECT driverId, MAX(gap) AS maxGap
    FROM gaps
    GROUP BY driverId
""", nativeQuery = true)
    List<Object[]> getBiggestGapBetweenPodiums();

    @Query(value = """
    SELECT res.driverId, DATEDIFF(MAX(r.date), MIN(r.date)) AS daysGap
    FROM results res
    JOIN races r ON res.raceId = r.raceId
    WHERE res.positionOrder <= 3
    GROUP BY res.driverId
    HAVING COUNT(*) >= 2
""", nativeQuery = true)
    List<Object[]> getGapBetweenFirstAndLastPodium();

    @Query(value = """
    SELECT res.driverId, r.year, COUNT(*) AS podiums
    FROM results res
    JOIN races r ON res.raceId = r.raceId
    WHERE res.positionOrder <= 3
    GROUP BY res.driverId, r.year
    HAVING podiums >= 11
""", nativeQuery = true)
    List<Object[]> getMostPodiumsInSingleYear();

    @Query(value = """
    SELECT res.driverId, COUNT(DISTINCT r.year) AS podiumYears
    FROM results res
    JOIN races r ON res.raceId = r.raceId
    WHERE res.positionOrder <= 3
    GROUP BY res.driverId
""", nativeQuery = true)
    List<Object[]> getPodiumYearsCount();

    @Query(value = """
    WITH driver_years AS (
        SELECT DISTINCT res.driverId, r.year
        FROM results res
        JOIN races r ON res.raceId = r.raceId
        WHERE res.positionOrder <= 3
    ),
    numbered AS (
        SELECT 
            driverId, 
            year,
            ROW_NUMBER() OVER (PARTITION BY driverId ORDER BY year) AS seq
        FROM driver_years
    ),
    grouped AS (
        SELECT 
            driverId, 
            (year - seq) AS grp
        FROM numbered
    ),
    streaks AS (
        SELECT driverId, COUNT(*) AS streak
        FROM grouped
        GROUP BY driverId, grp
    )
    SELECT driverId, MAX(streak) AS maxStreak
    FROM streaks
    GROUP BY driverId
""", nativeQuery = true)
    List<Object[]> getConsecutivePodiumYears();

    @Query(value = """
    WITH first_podium AS (
        SELECT res.driverId, MIN(r.date) AS firstPodiumDate
        FROM results res
        JOIN races r ON res.raceId = r.raceId
        WHERE res.positionOrder <= 3
        GROUP BY res.driverId
    )
    SELECT res.driverId, COUNT(*) AS gpCount
    FROM results res
    JOIN races r ON res.raceId = r.raceId
    JOIN first_podium fp ON res.driverId = fp.driverId
    WHERE r.date < fp.firstPodiumDate
    GROUP BY res.driverId
""", nativeQuery = true)
    List<Object[]> getGpCountBeforeFirstPodium();


    @Query(value = """
    WITH first_win AS (
        SELECT res.driverId, MIN(r.date) AS firstWinDate
        FROM results res
        JOIN races r ON res.raceId = r.raceId
        WHERE res.positionOrder = 1
        GROUP BY res.driverId
    )
    SELECT res.driverId, COUNT(*) AS podiumsBeforeWin
    FROM results res
    JOIN races r ON res.raceId = r.raceId
    JOIN first_win fw ON res.driverId = fw.driverId
    WHERE r.date < fw.firstWinDate
      AND res.positionOrder <= 3
    GROUP BY res.driverId
""", nativeQuery = true)
    List<Object[]> getPodiumsBeforeFirstWin();


    @Query(value = """
    SELECT res.driverId
    FROM results res
    WHERE res.positionOrder <= 3
    GROUP BY res.driverId
    HAVING COUNT(DISTINCT res.constructorId) = 1
""", nativeQuery = true)
    List<Long> getDriversWithSingleConstructorPodiums();

    @Query(value = """
    SELECT res.driverId, COUNT(*) AS podiums
    FROM results res
    WHERE res.positionOrder <= 3
      AND res.driverId NOT IN (
        SELECT DISTINCT driverId FROM results WHERE positionOrder = 1
      )
    GROUP BY res.driverId
""", nativeQuery = true)
    List<Object[]> getPodiumsWithNoWins();

    @Query(value = """
    SELECT res.driverId, COUNT(DISTINCT res.constructorId) AS constructorCount
    FROM results res
    WHERE res.positionOrder <= 3
    GROUP BY res.driverId
""", nativeQuery = true)
    List<Object[]> getPodiumsWithMostConstructors();

    @Query(value = """
    SELECT r.name, COUNT(*) AS podiums
    FROM results res
    JOIN races r ON res.raceId = r.raceId
    WHERE res.positionOrder <= 3
    GROUP BY r.name
""", nativeQuery = true)
    List<Object[]> getPodiumsByGrandPrix();

    @Query(value = """
    SELECT res.driverId, COUNT(DISTINCT r.name) AS differentGPs
    FROM results res
    JOIN races r ON res.raceId = r.raceId
    WHERE res.positionOrder <= 3
    GROUP BY res.driverId
""", nativeQuery = true)
    List<Object[]> getDriversWithMostDifferentGPsWithPodium();

    @Query(value = """
    SELECT res.driverId, COUNT(DISTINCT r.circuitId) AS differentCircuits
    FROM results res
    JOIN races r ON res.raceId = r.raceId
    WHERE res.positionOrder <= 3
    GROUP BY res.driverId
""", nativeQuery = true)
    List<Object[]> getDriversWithMostDifferentCircuitsWithPodium();

    @Query(value = """
    SELECT res.driverId, COUNT(*) AS homePodiums
    FROM results res
    JOIN races r ON res.raceId = r.raceId
    JOIN circuits c ON r.circuitId = c.circuitId
    JOIN drivers d ON res.driverId = d.driverId
    WHERE res.positionOrder <= 3
      AND d.nationality = c.country
    GROUP BY res.driverId
""", nativeQuery = true)
    List<Object[]> getPodiumsAtHomeGP();

    @Query(value = """
    SELECT podiumCombo, COUNT(*) AS repeats
    FROM (
        SELECT
            res.raceId,
            GROUP_CONCAT(LOWER(d.surname) ORDER BY res.positionOrder SEPARATOR ' - ') AS podiumCombo
        FROM results res
        JOIN drivers d ON res.driverId = d.driverId
        WHERE res.positionOrder <= 3
        GROUP BY res.raceId
        HAVING COUNT(*) = 3
    ) AS combos
    GROUP BY podiumCombo
    HAVING repeats >= 2
    ORDER BY repeats DESC
""", nativeQuery = true)
    List<Object[]> getRepeatedIdenticalPodiums();

    @Query(value = """
    SELECT trioCombo, COUNT(*) AS times
    FROM (
        SELECT 
            res.raceId,
            GROUP_CONCAT(LOWER(d.surname) ORDER BY d.surname SEPARATOR ' - ') AS trioCombo
        FROM results res
        JOIN drivers d ON res.driverId = d.driverId
        WHERE res.positionOrder <= 3
        GROUP BY res.raceId
        HAVING COUNT(DISTINCT res.driverId) = 3
    ) AS trios
    GROUP BY trioCombo
    ORDER BY times DESC
""", nativeQuery = true)
    List<Object[]> getMostFrequentPodiumTrios();

    @Query(value = """
    SELECT CONCAT(LOWER(d1.surname), ' - ', LOWER(d2.surname)) AS pairCombo, COUNT(*) AS times
    FROM results res1
    JOIN results res2 ON res1.raceId = res2.raceId
    JOIN drivers d1 ON res1.driverId = d1.driverId
    JOIN drivers d2 ON res2.driverId = d2.driverId
    WHERE res1.positionOrder <= 3
      AND res2.positionOrder <= 3
      AND res1.driverId < res2.driverId
    GROUP BY pairCombo
    ORDER BY times DESC
""", nativeQuery = true)
    List<Object[]> getMostFrequentPodiumPairs();

    @Query(value = """
    SELECT CONCAT(LOWER(d1.surname), ' - ', LOWER(d2.surname)) AS pairCombo, COUNT(*) AS times
    FROM results res1
    JOIN results res2 ON res1.raceId = res2.raceId
    JOIN drivers d1 ON res1.driverId = d1.driverId
    JOIN drivers d2 ON res2.driverId = d2.driverId
    WHERE res1.positionOrder = 1
      AND res2.positionOrder = 2
    GROUP BY pairCombo
    ORDER BY times DESC
""", nativeQuery = true)
    List<Object[]> getMostCommonFirstSecondPairs();

    @Query(value = """
WITH all_points AS (
    SELECT driverId, raceId, points FROM results WHERE points > 0
    UNION ALL
    SELECT driverId, raceId, points FROM sprintresults WHERE points > 0
),
points_dates AS (
    SELECT ap.driverId, r.date
    FROM all_points ap
    JOIN races r ON ap.raceId = r.raceId
),
ordered AS (
    SELECT
        driverId,
        date,
        ROW_NUMBER() OVER (PARTITION BY driverId ORDER BY date) AS rn
    FROM points_dates
),
grouped AS (
    SELECT
        driverId,
        DATE_SUB(date, INTERVAL rn DAY) AS grp
    FROM ordered
),
streaks AS (
    SELECT driverId, COUNT(*) AS streak_length
    FROM grouped
    GROUP BY driverId, grp
)
SELECT driverId, MAX(streak_length) AS max_streak
FROM streaks
GROUP BY driverId
ORDER BY max_streak DESC

""", nativeQuery = true)
    List<Object[]> getLongestConsecutivePointsStreaks();


    @Query(value = """
WITH points_only AS (
    SELECT r.driverId, ra.date
    FROM results r
    JOIN races ra ON r.raceId = ra.raceId
    WHERE r.points > 0
),
numbered AS (
    SELECT
        driverId,
        date,
        ROW_NUMBER() OVER (PARTITION BY driverId ORDER BY date) AS rn
    FROM points_only
),
grouped AS (
    SELECT
        driverId,
        DATE_SUB(date, INTERVAL rn DAY) AS grp
    FROM numbered
),
streaks AS (
    SELECT
        driverId,
        COUNT(*) AS streak_length
    FROM grouped
    GROUP BY driverId, grp
)
SELECT driverId, MAX(streak_length) AS max_streak
FROM streaks
GROUP BY driverId
ORDER BY max_streak DESC

""", nativeQuery = true)
    List<Object[]> getLongestConsecutivePointsStreaksWithoutSprints();


    @Query(value = """
WITH all_points AS (
    SELECT driverId, raceId FROM results WHERE points > 0
    UNION ALL
    SELECT driverId, raceId FROM sprintresults WHERE points > 0
),
dates AS (
    SELECT ap.driverId, r.date
    FROM all_points ap
    JOIN races r ON ap.raceId = r.raceId
),
ordered AS (
    SELECT
        driverId,
        date,
        LAG(date) OVER (PARTITION BY driverId ORDER BY date) AS prev_date
    FROM dates
),
gaps AS (
    SELECT
        driverId,
        DATEDIFF(date, prev_date) AS gap
    FROM ordered
    WHERE prev_date IS NOT NULL
)
SELECT driverId, MAX(gap) AS max_gap
FROM gaps
GROUP BY driverId
ORDER BY max_gap DESC
""", nativeQuery = true)
    List<Object[]> getLongestGapBetweenPoints();

    @Query(value = """
WITH all_points AS (
    SELECT driverId, raceId FROM results WHERE points > 0
    UNION ALL
    SELECT driverId, raceId FROM sprintresults WHERE points > 0
),
dates AS (
    SELECT ap.driverId, r.date
    FROM all_points ap
    JOIN races r ON ap.raceId = r.raceId
)
SELECT driverId, DATEDIFF(MAX(date), MIN(date)) AS daysGap
FROM dates
GROUP BY driverId
HAVING COUNT(*) >= 2
ORDER BY daysGap DESC
""", nativeQuery = true)
    List<Object[]> getGapBetweenFirstAndLastPoints();

    @Query(value = """
WITH all_points AS (
    SELECT driverId, raceId FROM results WHERE points > 0
    UNION ALL
    SELECT driverId, raceId FROM sprintresults WHERE points > 0
),
years AS (
    SELECT DISTINCT ap.driverId, r.year
    FROM all_points ap
    JOIN races r ON ap.raceId = r.raceId
),
numbered AS (
    SELECT 
        driverId, 
        year,
        ROW_NUMBER() OVER (PARTITION BY driverId ORDER BY year) AS seq
    FROM years
),
grouped AS (
    SELECT 
        driverId, 
        (year - seq) AS grp
    FROM numbered
),
streaks AS (
    SELECT driverId, COUNT(*) AS streak
    FROM grouped
    GROUP BY driverId, grp
)
SELECT driverId, MAX(streak) AS max_streak
FROM streaks
GROUP BY driverId
ORDER BY max_streak DESC
""", nativeQuery = true)
    List<Object[]> getMostConsecutiveSeasonsWithPoints();

    @Query("""
    SELECT r FROM Result r
    JOIN FETCH r.driver
    JOIN FETCH r.status
    JOIN FETCH r.race ra
    WHERE ra.year = :year
""")
    List<Result> findByRaceYearWithDriverAndStatus(@Param("year") int year);


    @Query(value = """
    SELECT r.driverId AS driverId, ra.name AS raceName, ra.year AS year
    FROM results r
    JOIN races ra ON r.raceId = ra.raceId
    WHERE r.positionOrder = 1
    ORDER BY r.driverId, ra.name, ra.year
    """, nativeQuery = true)
    List<DriverGpWinView> getAllDriverGpWins();


    @Query(value = """
    SELECT
        ra.year AS year,
        AVG(r.grid - r.positionOrder) AS avgDelta
    FROM results r
    JOIN races ra ON r.raceId = ra.raceId
    WHERE
        r.driverId = :driverId
        AND r.grid IS NOT NULL AND r.grid > 0
        AND r.positionOrder IS NOT NULL AND r.positionOrder > 0 AND r.positionOrder <= 30
    GROUP BY ra.year
    ORDER BY ra.year
""", nativeQuery = true)
    List<AvgPositionDeltaPerSeasonView> findAvgPositionDeltaByDriver(@Param("driverId") Long driverId);

    @Query(value = """
    SELECT
        r.driverId AS driverId,
        d.forename AS forename,
        d.surname AS surname,
        COUNT(*) AS winCount,
        (SELECT COUNT(*) FROM races WHERE year BETWEEN :startYear AND :endYear) AS totalRaces
    FROM results r
    JOIN races ra ON r.raceId = ra.raceId
    JOIN drivers d ON r.driverId = d.driverId
    WHERE r.positionOrder = 1
      AND ra.year BETWEEN :startYear AND :endYear
    GROUP BY r.driverId, d.forename, d.surname
    ORDER BY winCount DESC
""", nativeQuery = true)
    List<DriverVictoryPercentageView> getVictoryPercentagesInDecade(
            @Param("startYear") int startYear,
            @Param("endYear") int endYear
    );

    @Query(value = """
    SELECT
        r.driverId AS driverId,
        d.forename AS forename,
        d.surname AS surname,
        COUNT(*) AS winCount
    FROM results r
    JOIN races ra ON r.raceId = ra.raceId
    JOIN drivers d ON r.driverId = d.driverId
    WHERE r.positionOrder = 1
      AND ra.year BETWEEN :startYear AND :endYear
    GROUP BY r.driverId, d.forename, d.surname
    ORDER BY winCount DESC
""", nativeQuery = true)
    List<DriverWinsView> getDriverWinsInDecade(
            @Param("startYear") int startYear,
            @Param("endYear") int endYear
    );

    @Query(value = """
    SELECT COUNT(*) FROM races WHERE year BETWEEN :startYear AND :endYear
""", nativeQuery = true)
    long getTotalRacesInDecade(@Param("startYear") int startYear, @Param("endYear") int endYear);


    @Query(value = """
    SELECT DISTINCT ra.year AS year, c.constructorRef AS constructorRef
    FROM results res
    JOIN races ra ON res.raceId = ra.raceId
    JOIN constructors c ON res.constructorId = c.constructorId
    WHERE res.driverId = :driverId
    """, nativeQuery = true)
    List<PilotSeasonTeamView> getSeasonsAndTeamsFromResults(@Param("driverId") Long driverId);


    @Query(value = """
    SELECT ra.year AS year,
           COUNT(CASE
                     WHEN LOWER(s.status) NOT IN (
                         'finished', 'classified', 'not classified', 'excluded', 'disqualified',
                         'did not qualify', 'did not prequalify', 'did not start', 'withdrew', '107% rule')
                     AND LOWER(s.status) NOT REGEXP '\\\\+\\\\d+\\\\s+laps?'
                     THEN 1
                     ELSE NULL
                 END) AS retirements,
           COUNT(DISTINCT ra.raceId) AS totalRaces
    FROM races ra
    LEFT JOIN results r ON ra.raceId = r.raceId
    LEFT JOIN status s ON r.statusId = s.statusId
    GROUP BY ra.year
    ORDER BY ra.year
""", nativeQuery = true)
    List<RetirementRatioPerYearView> getRetirementRatioPerSeason();

    @Query(value = """
    SELECT r.driverId AS driverId,
           ROUND(AVG(r.grid - l.position), 1) AS avgGain
    FROM results r
    JOIN laptimes l ON r.raceId = l.raceId AND r.driverId = l.driverId
    WHERE l.lap = 2
      AND r.grid IS NOT NULL AND r.grid != 0
      AND l.position IS NOT NULL
    GROUP BY r.driverId
""", nativeQuery = true)
    List<DriverAvgGainView> getAvgGainAfterLap2();

    @Query(value = """
    SELECT
        d.driverId AS driverId,
        d.forename AS forename,
        d.surname AS surname,
        SUM(CASE
            WHEN LOWER(s.status) LIKE '%finished%' OR LOWER(s.status) LIKE '%classified%' THEN 1 ELSE 0
        END) AS finishes,
        SUM(CASE
            WHEN NOT (LOWER(s.status) LIKE '%finished%' OR LOWER(s.status) LIKE '%classified%') THEN 1 ELSE 0
        END) AS dnfs
    FROM results r
    JOIN drivers d ON r.driverId = d.driverId
    JOIN status s ON r.statusId = s.statusId
    GROUP BY d.driverId, d.forename, d.surname
""", nativeQuery = true)
    List<FinishVsDnfRatioView> getFinishVsDnfRatio();

    @Query(value = """
WITH all_points AS (
    SELECT driverId, raceId
    FROM results
    WHERE points > 0
    UNION ALL
    SELECT driverId, raceId
    FROM sprintresults
    WHERE points > 0
),
points_dates AS (
    SELECT ap.driverId, r.date
    FROM all_points ap
    JOIN races r ON ap.raceId = r.raceId
),
ordered AS (
    SELECT
        driverId,
        date,
        ROW_NUMBER() OVER (PARTITION BY driverId ORDER BY date) AS rn
    FROM points_dates
),
grouped AS (
    SELECT
        driverId,
        DATE_SUB(date, INTERVAL rn DAY) AS grp
    FROM ordered
),
streaks AS (
    SELECT
        driverId,
        COUNT(*) AS streak_length
    FROM grouped
    GROUP BY driverId, grp
)
SELECT driverId, MAX(streak_length) AS max_streak
FROM streaks
GROUP BY driverId
ORDER BY max_streak DESC
""", nativeQuery = true)
    List<Object[]> getPointsStreaksPerDriver();


    @Query(value = """
    SELECT
      r.constructorId AS constructorId,
      ra.year AS year,
      COUNT(*) AS totalCount,
      SUM(CASE
          WHEN LOWER(s.status) IN (:dnfCauses) THEN 1 ELSE 0
      END) AS dnfCount
    FROM results r
    JOIN races ra ON r.raceId = ra.raceId
    JOIN status s ON r.statusId = s.statusId
    WHERE r.constructorId IS NOT NULL
    GROUP BY r.constructorId, ra.year
""", nativeQuery = true)
    List<ConstructorReliabilityAggView> getConstructorReliabilityAggregated(
            @Param("dnfCauses") Set<String> dnfCauses
    );

    @Query(value = """
    SELECT
      r.constructorId AS constructorId,
      ra.year AS year,
      COUNT(*) AS totalCount,
      SUM(CASE
          WHEN LOWER(s.status) IN (:dnfCauses) THEN 1 ELSE 0
      END) AS dnfCount
    FROM results r
    JOIN races ra ON r.raceId = ra.raceId
    JOIN status s ON r.statusId = s.statusId
    WHERE r.constructorId IS NOT NULL
      AND ra.year BETWEEN :startYear AND :endYear
    GROUP BY r.constructorId, ra.year
""", nativeQuery = true)
    List<ConstructorReliabilityAggView> getConstructorReliabilityAggregatedForPeriod(
            @Param("dnfCauses") Set<String> dnfCauses,
            @Param("startYear") int startYear,
            @Param("endYear") int endYear
    );


    @Query(value = """
    WITH driver_stats AS (
        SELECT
            ra.year,
            r.driverId,
            d.forename,
            d.surname,
            AVG(r.positionOrder) AS avgPosition,
            STDDEV_POP(r.positionOrder) AS stddevPosition,
            SUM(r.points) AS totalPoints,
            COUNT(*) AS raceCount,
            CASE
                WHEN ra.year >= 2010 THEN 25
                WHEN ra.year >= 2003 THEN 10
                WHEN ra.year >= 1991 THEN 10
                WHEN ra.year >= 1960 THEN 9
                ELSE 8
            END AS maxPointsPerRace,
            r.constructorId
        FROM results r
        JOIN races ra ON r.raceId = ra.raceId
        JOIN drivers d ON r.driverId = d.driverId
        WHERE r.driverId = :driverId
        GROUP BY ra.year, r.driverId, r.constructorId
    ),
    team_points AS (
        SELECT
            ra.year,
            r.constructorId,
            SUM(r.points) AS teamPoints
        FROM results r
        JOIN races ra ON r.raceId = ra.raceId
        WHERE r.points IS NOT NULL
        GROUP BY ra.year, r.constructorId
    ),
    teammate_battles AS (
        SELECT
            ra.year,
            r1.driverId,
            SUM(CASE WHEN r1.positionOrder < r2.positionOrder THEN 1 ELSE 0 END) AS teammateWins,
            COUNT(*) AS teammateBattles
        FROM results r1
        JOIN results r2 ON r1.raceId = r2.raceId
          AND r1.constructorId = r2.constructorId
          AND r1.driverId <> r2.driverId
        JOIN races ra ON r1.raceId = ra.raceId
        WHERE r1.driverId = :driverId
        GROUP BY ra.year, r1.driverId
    ),
    driver_champ AS (
        SELECT
            ds.driverId,
            r.year,
            ds.position AS driverChampPos
        FROM driverstandings ds
        JOIN races r ON ds.raceId = r.raceId
        WHERE ds.raceId IN (
            SELECT r2.raceId FROM races r2
            WHERE r2.round = (SELECT MAX(r3.round) FROM races r3 WHERE r3.year = r2.year)
        )
    ),
    team_champ AS (
        SELECT
            cs.constructorId,
            r.year,
            cs.position AS constructorChampPos
        FROM constructorstandings cs
        JOIN races r ON cs.raceId = r.raceId
        WHERE cs.raceId IN (
            SELECT r2.raceId FROM races r2
            WHERE r2.round = (SELECT MAX(r3.round) FROM races r3 WHERE r3.year = r2.year)
        )
    )
    SELECT
        ds.driverId,
        ds.forename,
        ds.surname,
        ds.year,
        ds.avgPosition,
        ds.stddevPosition,
        ds.totalPoints,
        ds.raceCount,
        ds.maxPointsPerRace,
        ds.constructorId,
        tp.teamPoints,
        tb.teammateBattles,
        tb.teammateWins,
        dc.driverChampPos,
        tc.constructorChampPos
    FROM driver_stats ds
    LEFT JOIN team_points tp ON tp.year = ds.year AND tp.constructorId = ds.constructorId
    LEFT JOIN teammate_battles tb ON tb.year = ds.year AND tb.driverId = ds.driverId
    LEFT JOIN driver_champ dc ON dc.year = ds.year AND dc.driverId = ds.driverId
    LEFT JOIN team_champ tc ON tc.year = ds.year AND tc.constructorId = ds.constructorId
    ORDER BY ds.year
""", nativeQuery = true)
    List<DriverSeasonPerformanceView> getDriverPerformanceStats(@Param("driverId") Long driverId);


    @Query(value = """
WITH constructor_stats AS (
    SELECT
        ra.year,
        r.constructorId,
        AVG(r.positionOrder) AS avgPosition,
        STDDEV_POP(r.positionOrder) AS stddevPosition,
        SUM(r.points) AS totalPoints,
        COUNT(*) AS raceCount,
        CASE
            WHEN ra.year >= 2010 THEN 25
            WHEN ra.year >= 2003 THEN 10
            WHEN ra.year >= 1991 THEN 10
            WHEN ra.year >= 1960 THEN 9
            ELSE 8
        END AS maxPointsPerRace
    FROM results r
    JOIN races ra ON r.raceId = ra.raceId
    WHERE r.constructorId = :constructorId
    GROUP BY ra.year, r.constructorId
),
team_champ AS (
    SELECT
        cs.constructorId,
        r.year,
        cs.position AS constructorChampPos
    FROM constructorstandings cs
    JOIN races r ON cs.raceId = r.raceId
    WHERE cs.raceId IN (
        SELECT r2.raceId FROM races r2
        WHERE r2.round = (SELECT MAX(r3.round) FROM races r3 WHERE r3.year = r2.year)
    )
)
SELECT
    cs.year,
    cs.constructorId,
    cs.avgPosition,
    cs.stddevPosition,
    cs.totalPoints,
    cs.raceCount,
    cs.maxPointsPerRace,
    tc.constructorChampPos
FROM constructor_stats cs
LEFT JOIN team_champ tc ON tc.year = cs.year AND tc.constructorId = cs.constructorId
ORDER BY cs.year
""", nativeQuery = true)
    List<ConstructorSeasonPerformanceView> getConstructorPerformanceStats(@Param("constructorId") Long constructorId);


}
