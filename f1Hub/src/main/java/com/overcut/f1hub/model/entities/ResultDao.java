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





}
