package com.overcut.f1hub.model.entities;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

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


}
