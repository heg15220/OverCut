package com.overcut.f1hub.model.entities;


import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface QualifyingDao extends JpaRepository<Qualifying, Long> {
    List<Qualifying> findByRaceRaceIdOrderByPositionAsc(Long raceId);
    boolean existsByRaceRaceId(Long raceId);

    @Query("SELECT COUNT(q) > 0 FROM Qualifying q WHERE q.race.raceId = :raceId")
    boolean existsQualifyingForRace(@Param("raceId") Long raceId);

    @Query("""
        SELECT COUNT(q)
        FROM Qualifying q
        JOIN q.race r
        JOIN q.driver d
        WHERE r.year = :year
          AND d.forename = :forename
          AND d.surname = :surname
          AND q.q3 IS NOT NULL
    """)
    long countQ3ByDriverInYear(@Param("forename") String forename,
                               @Param("surname") String surname,
                               @Param("year") int year);


    // Q3 counts para todos los pilotos de un equipo en un año (agrupados)
    @Query("""
        SELECT d.forename, d.surname, COUNT(q)
        FROM Qualifying q
        JOIN q.race r
        JOIN q.driver d
        JOIN q.constructor c
        WHERE r.year = :year
          AND c.constructorRef = :constructorRef
          AND q.q3 IS NOT NULL
        GROUP BY d.driverId
    """)
    List<Object[]> countQ3ByConstructorInYear(@Param("constructorRef") String constructorRef,
                                              @Param("year") int year);

    @Query("""
    SELECT COUNT(q)
    FROM Qualifying q
    JOIN q.race r
    JOIN q.driver d
    WHERE r.year = :year
      AND d.forename = :forename
      AND d.surname = :surname
      AND q.q1 IS NOT NULL
""")
    long countByDriverAndQ1NotNull(@Param("forename") String forename,
                                   @Param("surname") String surname,
                                   @Param("year") int year);

    @Query("""
    SELECT COUNT(q)
    FROM Qualifying q
    JOIN q.race r
    JOIN q.constructor c
    WHERE r.year = :year
      AND c.constructorRef = :constructorRef
      AND q.q1 IS NOT NULL
""")
    long countByConstructorAndQ1NotNull(@Param("constructorRef") String constructorRef,
                                        @Param("year") int year);


    @Query("""
    SELECT q FROM Qualifying q
    JOIN FETCH q.race r
    JOIN FETCH q.constructor c
    WHERE q.driver.driverId = :driverId
      AND r.year IS NOT NULL
""")
    List<Qualifying> findByDriverWithConstructorAndRace(@Param("driverId") Long driverId);

    @Query(value = """
    SELECT q.raceId AS raceId,
           q.driverId AS driverId,
           q.constructorId AS constructorId,
           q.position AS position,
           ra.year AS year
    FROM qualifying q
    JOIN races ra ON q.raceId = ra.raceId
    WHERE q.position IS NOT NULL
      AND q.constructorId IS NOT NULL
""", nativeQuery = true)
    List<QualiResultLiteView> findAllQualifyingLite();


    @Query(value = """
    SELECT q.raceId AS raceId,
           q.driverId AS driverId,
           q.constructorId AS constructorId,
           q.position AS position,
           ra.year AS year
    FROM qualifying q
    JOIN races ra ON q.raceId = ra.raceId
    WHERE q.position IS NOT NULL
      AND q.constructorId IS NOT NULL
      AND q.driverId IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM qualifying q2
        WHERE q2.raceId = q.raceId
          AND q2.constructorId = q.constructorId
          AND q2.driverId = :driverId
      )
""", nativeQuery = true)
    List<QualiResultLiteView> getQualifyingWithDriverAndTeammates(@Param("driverId") Long driverId);




    @Query(value = """
    SELECT q.driverId AS driverId, q.position AS position, COUNT(*) AS count
    FROM qualifying q
    WHERE q.position IS NOT NULL
    GROUP BY q.driverId, q.position
""", nativeQuery = true)
    List<MostCommonQualiView> getAllQualiPositionFrequencies();



    @Query(value = """
    SELECT ra.year AS year,
           AVG(GREATEST(
               (
                   LEAST(
                       IF(p2.q1 REGEXP '^[0-9]+:[0-9]+\\.[0-9]+$', TIME_TO_SEC(STR_TO_DATE(p2.q1, '%i:%s.%f')), NULL),
                       IF(p2.q2 REGEXP '^[0-9]+:[0-9]+\\.[0-9]+$', TIME_TO_SEC(STR_TO_DATE(p2.q2, '%i:%s.%f')), NULL),
                       IF(p2.q3 REGEXP '^[0-9]+:[0-9]+\\.[0-9]+$', TIME_TO_SEC(STR_TO_DATE(p2.q3, '%i:%s.%f')), NULL)
                   ) -
                   LEAST(
                       IF(p1.q1 REGEXP '^[0-9]+:[0-9]+\\.[0-9]+$', TIME_TO_SEC(STR_TO_DATE(p1.q1, '%i:%s.%f')), NULL),
                       IF(p1.q2 REGEXP '^[0-9]+:[0-9]+\\.[0-9]+$', TIME_TO_SEC(STR_TO_DATE(p1.q2, '%i:%s.%f')), NULL),
                       IF(p1.q3 REGEXP '^[0-9]+:[0-9]+\\.[0-9]+$', TIME_TO_SEC(STR_TO_DATE(p1.q3, '%i:%s.%f')), NULL)
                   )
               ) * 1000,
               0
           )) AS diff
    FROM qualifying p1
    JOIN qualifying p2 ON p1.raceId = p2.raceId AND p1.position = 1 AND p2.position = 2
    JOIN races ra ON p1.raceId = ra.raceId
    WHERE (
        (p1.q1 REGEXP '^[0-9]+:[0-9]+\\.[0-9]+$' OR
         p1.q2 REGEXP '^[0-9]+:[0-9]+\\.[0-9]+$' OR
         p1.q3 REGEXP '^[0-9]+:[0-9]+\\.[0-9]+$')
    )
    AND (
        (p2.q1 REGEXP '^[0-9]+:[0-9]+\\.[0-9]+$' OR
         p2.q2 REGEXP '^[0-9]+:[0-9]+\\.[0-9]+$' OR
         p2.q3 REGEXP '^[0-9]+:[0-9]+\\.[0-9]+$')
    )
    GROUP BY ra.year
    ORDER BY ra.year
    """, nativeQuery = true)
    List<QualiGapView> getAvgGapBetweenP1AndP2PerSeason();


    @Query(value = """
    SELECT ra.year AS year,
           AVG(
               (
                   LEAST(
                       CASE WHEN p10.q1 REGEXP '^[0-9]+:[0-9]+\\.[0-9]+$'
                           THEN TIME_TO_SEC(STR_TO_DATE(p10.q1, '%i:%s.%f')) ELSE 999999 END,
                       CASE WHEN p10.q2 REGEXP '^[0-9]+:[0-9]+\\.[0-9]+$'
                           THEN TIME_TO_SEC(STR_TO_DATE(p10.q2, '%i:%s.%f')) ELSE 999999 END,
                       CASE WHEN p10.q3 REGEXP '^[0-9]+:[0-9]+\\.[0-9]+$'
                           THEN TIME_TO_SEC(STR_TO_DATE(p10.q3, '%i:%s.%f')) ELSE 999999 END
                   ) -
                   LEAST(
                       CASE WHEN p1.q1 REGEXP '^[0-9]+:[0-9]+\\.[0-9]+$'
                           THEN TIME_TO_SEC(STR_TO_DATE(p1.q1, '%i:%s.%f')) ELSE 999999 END,
                       CASE WHEN p1.q2 REGEXP '^[0-9]+:[0-9]+\\.[0-9]+$'
                           THEN TIME_TO_SEC(STR_TO_DATE(p1.q2, '%i:%s.%f')) ELSE 999999 END,
                       CASE WHEN p1.q3 REGEXP '^[0-9]+:[0-9]+\\.[0-9]+$'
                           THEN TIME_TO_SEC(STR_TO_DATE(p1.q3, '%i:%s.%f')) ELSE 999999 END
                   )
               ) * 1000
           ) AS diff
    FROM qualifying p1
    JOIN qualifying p10 ON p1.raceId = p10.raceId AND p1.position = 1 AND p10.position = 10
    JOIN races ra ON p1.raceId = ra.raceId
    GROUP BY ra.year
""", nativeQuery = true)
    List<QualiGapP10PoleView> getAvgGapBetweenP10AndPolePerSeason();

    @Query(value = """
    SELECT ra.year AS year,
           q.q1 AS q1,
           q.q3 AS q3
    FROM qualifying q
    JOIN races ra ON q.raceId = ra.raceId
    WHERE ra.year >= 2006
      AND q.q1 IS NOT NULL AND q.q3 IS NOT NULL
""", nativeQuery = true)
    List<Q1Q3DeltaView> getQ1Q3TimesSince2006();


    @Query(value = """
    SELECT q.driverId AS driverId, q.q1 AS q1, q.q2 AS q2, q.q3 AS q3
    FROM qualifying q
    WHERE q.q1 IS NOT NULL OR q.q2 IS NOT NULL OR q.q3 IS NOT NULL
""", nativeQuery = true)
    List<QualiProgressView> getAllQualiTimesGroupedByDriver();

    @Query(value = """
    SELECT q.driverId AS driverId, q.position AS position
    FROM qualifying q
    WHERE q.position IS NOT NULL
""", nativeQuery = true)
    List<QualiPositionView> getAllQualiPositions();

    @Query(value = """
    SELECT q.driverId AS driverId, COUNT(*) AS count
    FROM qualifying q
    WHERE q.position = 1
      AND q.driverId NOT IN (
          SELECT DISTINCT r.driverId
          FROM results r
          WHERE r.positionOrder = 1
      )
    GROUP BY q.driverId
    ORDER BY count DESC
    LIMIT 15
""", nativeQuery = true)
    List<PolesWithoutWinView> getPolesWithoutWin();


    @Query("SELECT q.driver.driverId AS driverId FROM Qualifying q WHERE q.position = 1")
    List<PolePositionView> findAllPoles();

    @Query(value = """
    SELECT q.driverId AS driverId, COUNT(*) AS poleCount
    FROM qualifying q
    WHERE q.position = 1
    GROUP BY q.driverId
""", nativeQuery = true)
    List<DriverPoleCountView> getPoleCountsForAllDrivers();

    @Query("""
    SELECT r.year AS year, d.driverId AS driverId, c.constructorRef AS constructorRef, COUNT(q.q1) AS qCount
    FROM Qualifying q
    JOIN q.race r
    JOIN q.driver d
    JOIN q.constructor c
    WHERE r.year < 2006 AND q.q1 IS NOT NULL
    GROUP BY r.year, d.driverId, c.constructorRef
""")
    List<QualiCountByYearAndTeamView> getQ1CountsByYearAndTeam();

    @Query("""
    SELECT r.year AS year, d.driverId AS driverId, c.constructorRef AS constructorRef, COUNT(q.q3) AS qCount
    FROM Qualifying q
    JOIN q.race r
    JOIN q.driver d
    JOIN q.constructor c
    WHERE r.year >= 2006 AND q.q3 IS NOT NULL
    GROUP BY r.year, d.driverId, c.constructorRef
""")
    List<QualiCountByYearAndTeamView> getQ3CountsByYearAndTeam();

    @Query("""
    SELECT DISTINCT r.year AS year, c.constructorRef AS constructorRef
    FROM Qualifying q
    JOIN q.race r
    JOIN q.constructor c
    WHERE q.driver.driverId = :driverId
""")
    List<PilotSeasonTeamView> getSeasonsAndTeamsByDriver(@Param("driverId") Long driverId);

    @Query("""
    SELECT r.year AS year, d.driverId AS driverId, c.constructorRef AS constructorRef, COUNT(q.q1) AS qCount
    FROM Qualifying q
    JOIN q.race r
    JOIN q.driver d
    JOIN q.constructor c
    WHERE r.year < 2006
      AND q.q1 IS NOT NULL
      AND r.year IN :years
      AND c.constructorRef IN :constructorRefs
    GROUP BY r.year, d.driverId, c.constructorRef
""")
    List<QualiCountByYearAndTeamView> getQ1CountsFiltered(
            @Param("constructorRefs") List<String> constructorRefs,
            @Param("years") List<Integer> years
    );

    @Query("""
    SELECT r.year AS year, d.driverId AS driverId, c.constructorRef AS constructorRef, COUNT(q.q3) AS qCount
    FROM Qualifying q
    JOIN q.race r
    JOIN q.driver d
    JOIN q.constructor c
    WHERE r.year >= 2006
      AND q.q3 IS NOT NULL
      AND r.year IN :years
      AND c.constructorRef IN :constructorRefs
    GROUP BY r.year, d.driverId, c.constructorRef
""")
    List<QualiCountByYearAndTeamView> getQ3CountsFiltered(
            @Param("constructorRefs") List<String> constructorRefs,
            @Param("years") List<Integer> years
    );





}
