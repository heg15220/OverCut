package com.overcut.f1hub.model.entities;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Set;

public interface ResultDao extends JpaRepository<Result, Long> {
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
    SELECT ra.year AS year,
           r.grid AS grid,
           r.positionOrder AS positionOrder
    FROM results r
    JOIN races ra ON r.raceId = ra.raceId
    WHERE r.driverId = :driverId
      AND r.grid IS NOT NULL
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
           r.constructorId AS constructorId,
           r.driverId AS driverId,
           ra.year AS year,
           r.positionOrder AS positionOrder
    FROM results r
    JOIN races ra ON r.raceId = ra.raceId
    WHERE r.constructorId IS NOT NULL
      AND r.driverId IS NOT NULL
      AND r.positionOrder IS NOT NULL
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


    @Query(value = """
    SELECT r.driverId AS driverId, COUNT(*) AS podiums
    FROM results r
    WHERE r.grid > 10 AND r.positionOrder IN (1, 2, 3)
    GROUP BY r.driverId
    ORDER BY podiums DESC
    LIMIT 15
""", nativeQuery = true)
    List<PodiumOutsideTop10View> getPodiumsFromOutsideTop10();


    @Query("SELECT DISTINCT r.driver.driverId FROM Result r WHERE r.positionOrder = 1")
    Set<Long> findAllWinners();




}
