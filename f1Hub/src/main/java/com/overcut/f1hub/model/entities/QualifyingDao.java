package com.overcut.f1hub.model.entities;


import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface QualifyingDao extends JpaRepository<Qualifying, Long> {




    @Query(value = """
SELECT
  r.raceId AS raceId,
  r.round  AS round,
  r.name   AS raceName,

  q.constructorId AS constructorId,
  c.constructorRef AS constructorRef,
  c.name AS constructorName,

  AVG( (qd.bestSec - p.poleBestSec) * 1000.0 ) AS avgQualiGapMs
FROM races r
JOIN qualifying q ON q.raceId = r.raceId
JOIN constructors c ON c.constructorId = q.constructorId

JOIN (
  SELECT
    qx.raceId,
    qx.driverId,
    qx.constructorId,
    LEAST(
      CASE WHEN qx.q1 REGEXP '^[0-9]+:[0-9]+\\.[0-9]+$' THEN TIME_TO_SEC(STR_TO_DATE(qx.q1, '%i:%s.%f')) ELSE 999999 END,
      CASE WHEN qx.q2 REGEXP '^[0-9]+:[0-9]+\\.[0-9]+$' THEN TIME_TO_SEC(STR_TO_DATE(qx.q2, '%i:%s.%f')) ELSE 999999 END,
      CASE WHEN qx.q3 REGEXP '^[0-9]+:[0-9]+\\.[0-9]+$' THEN TIME_TO_SEC(STR_TO_DATE(qx.q3, '%i:%s.%f')) ELSE 999999 END
    ) AS bestSec
  FROM qualifying qx
  WHERE qx.position IS NOT NULL
) qd ON qd.raceId = q.raceId AND qd.driverId = q.driverId AND qd.constructorId = q.constructorId

JOIN (
  SELECT
    qp.raceId,
    LEAST(
      CASE WHEN qp.q1 REGEXP '^[0-9]+:[0-9]+\\.[0-9]+$' THEN TIME_TO_SEC(STR_TO_DATE(qp.q1, '%i:%s.%f')) ELSE 999999 END,
      CASE WHEN qp.q2 REGEXP '^[0-9]+:[0-9]+\\.[0-9]+$' THEN TIME_TO_SEC(STR_TO_DATE(qp.q2, '%i:%s.%f')) ELSE 999999 END,
      CASE WHEN qp.q3 REGEXP '^[0-9]+:[0-9]+\\.[0-9]+$' THEN TIME_TO_SEC(STR_TO_DATE(qp.q3, '%i:%s.%f')) ELSE 999999 END
    ) AS poleBestSec
  FROM qualifying qp
  WHERE qp.position = 1
) p ON p.raceId = r.raceId

WHERE r.year = :year
  AND qd.bestSec < 999999
  AND p.poleBestSec < 999999
GROUP BY r.raceId, r.round, r.name, q.constructorId, c.constructorRef, c.name, p.poleBestSec
ORDER BY r.round
""", nativeQuery = true)
    List<TeamAvgQualiGapToPolePerRaceView> getTeamAvgQualiGapToPolePerRace(@Param("year") int year);


    @Query(value = """
WITH qsec AS (
  SELECT
    q.raceId,
    q.driverId,
    q.constructorId,

    CASE WHEN q.q1 REGEXP '^[0-9]+:[0-9]+\\.[0-9]+$'
      THEN TIME_TO_SEC(STR_TO_DATE(q.q1, '%i:%s.%f')) ELSE NULL END AS q1Sec,

    CASE WHEN q.q2 REGEXP '^[0-9]+:[0-9]+\\.[0-9]+$'
      THEN TIME_TO_SEC(STR_TO_DATE(q.q2, '%i:%s.%f')) ELSE NULL END AS q2Sec,

    CASE WHEN q.q3 REGEXP '^[0-9]+:[0-9]+\\.[0-9]+$'
      THEN TIME_TO_SEC(STR_TO_DATE(q.q3, '%i:%s.%f')) ELSE NULL END AS q3Sec
  FROM qualifying q
  JOIN races r ON r.raceId = q.raceId
  WHERE r.year = :year
),
qmax AS (
  SELECT
    raceId,
    driverId,
    constructorId,
    q1Sec, q2Sec, q3Sec,
    CASE
      WHEN q3Sec IS NOT NULL THEN 3
      WHEN q2Sec IS NOT NULL THEN 2
      WHEN q1Sec IS NOT NULL THEN 1
      ELSE 0
    END AS maxSession
  FROM qsec
),
pairs AS (
  SELECT
    a.raceId,
    a.driverId AS driverId,
    a.constructorId,
    b.driverId AS teammateId,

    LEAST(a.maxSession, b.maxSession) AS commonSession,

    CASE LEAST(a.maxSession, b.maxSession)
      WHEN 3 THEN a.q3Sec
      WHEN 2 THEN a.q2Sec
      WHEN 1 THEN a.q1Sec
      ELSE NULL
    END AS aTime,

    CASE LEAST(a.maxSession, b.maxSession)
      WHEN 3 THEN b.q3Sec
      WHEN 2 THEN b.q2Sec
      WHEN 1 THEN b.q1Sec
      ELSE NULL
    END AS bTime
  FROM qmax a
  JOIN qmax b
    ON a.raceId = b.raceId
   AND a.constructorId = b.constructorId
   AND a.driverId <> b.driverId
  WHERE a.driverId = :driverId
)
SELECT
  p.driverId AS driverId,
  p.constructorId AS constructorId,
  :year AS year,
  AVG( (p.aTime - p.bTime) * 1000.0 ) AS avgGapMs
FROM pairs p
WHERE p.commonSession >= 1
  AND p.aTime IS NOT NULL
  AND p.bTime IS NOT NULL
GROUP BY p.driverId, p.constructorId
""", nativeQuery = true)
    DriverAvgQualiGapToTeammateView getDriverAvgQualiGapToTeammateMs(
            @Param("driverId") Long driverId,
            @Param("year") int year
    );



    @Query(value = """
        WITH q AS (
            SELECT q.raceId,
                   q.driverId,
                   r.constructorId,
                   CASE
                     WHEN q.q3 IS NOT NULL AND q.q3 <> '' THEN q.q3
                     WHEN q.q2 IS NOT NULL AND q.q2 <> '' THEN q.q2
                     WHEN q.q1 IS NOT NULL AND q.q1 <> '' THEN q.q1
                     ELSE NULL
                   END AS bestTimeStr
            FROM qualifying q
            JOIN results r ON r.raceId = q.raceId AND r.driverId = q.driverId
            JOIN races ra ON ra.raceId = q.raceId
            WHERE ra.year = :year
        ),
        qt AS (
            SELECT raceId,
                   driverId,
                   constructorId,
                   (
                     CAST(SUBSTRING_INDEX(bestTimeStr, ':', 1) AS UNSIGNED) * 60
                     + CAST(SUBSTRING_INDEX(SUBSTRING_INDEX(bestTimeStr, ':', -1), '.', 1) AS UNSIGNED)
                     + CAST(SUBSTRING_INDEX(bestTimeStr, '.', -1) AS UNSIGNED) / 1000.0
                   ) AS bestSec
            FROM q
            WHERE bestTimeStr IS NOT NULL AND bestTimeStr <> ''
        )
        SELECT AVG(
            qt.bestSec
            - (
                SELECT MIN(t2.bestSec)
                FROM qt t2
                WHERE t2.raceId = qt.raceId
                  AND t2.constructorId = qt.constructorId
                  AND t2.driverId <> qt.driverId
              )
        )
        FROM qt
        WHERE qt.driverId = :driverId
        """, nativeQuery = true)
    Double getAvgQualiGapToTeammateSec(@Param("driverId") Long driverId,
                                       @Param("year") int year);

    /**
     * Devuelve, para un año, por carrera y constructor:
     *   - gap medio en ms respecto a la pole (qualy pace)
     *
     * Requiere qualifying con q1/q2/q3 (string tiempos) o un campo pre-parsado.
     * Si ya tienes esto hecho, deja esta firma y usa tu query.
     */
    @Query(value = """
        WITH pole AS (
            SELECT
                ra.raceId,
                MIN(
                    CASE
                        WHEN q.q3 IS NOT NULL AND q.q3 <> '' THEN TIME_TO_SEC(STR_TO_DATE(q.q3, '%i:%s.%f'))*1000
                        WHEN q.q2 IS NOT NULL AND q.q2 <> '' THEN TIME_TO_SEC(STR_TO_DATE(q.q2, '%i:%s.%f'))*1000
                        WHEN q.q1 IS NOT NULL AND q.q1 <> '' THEN TIME_TO_SEC(STR_TO_DATE(q.q1, '%i:%s.%f'))*1000
                        ELSE NULL
                    END
                ) AS poleMs
            FROM qualifying q
            JOIN races ra ON ra.raceId = q.raceId
            WHERE ra.year = :year
            GROUP BY ra.raceId
        ),
        driver_best AS (
            SELECT
                ra.raceId,
                q.driverId,
                r.constructorId,
                CASE
                    WHEN q.q3 IS NOT NULL AND q.q3 <> '' THEN TIME_TO_SEC(STR_TO_DATE(q.q3, '%i:%s.%f'))*1000
                    WHEN q.q2 IS NOT NULL AND q.q2 <> '' THEN TIME_TO_SEC(STR_TO_DATE(q.q2, '%i:%s.%f'))*1000
                    WHEN q.q1 IS NOT NULL AND q.q1 <> '' THEN TIME_TO_SEC(STR_TO_DATE(q.q1, '%i:%s.%f'))*1000
                    ELSE NULL
                END AS bestMs
            FROM qualifying q
            JOIN races ra ON ra.raceId = q.raceId
            JOIN results r ON r.raceId = q.raceId AND r.driverId = q.driverId
            WHERE ra.year = :year
        )
        SELECT
            db.constructorId AS constructorId,
            c.name AS constructorName,
            c.constructorRef AS constructorRef,
            db.raceId AS raceId,
            AVG(db.bestMs - p.poleMs) AS avgQualiGapMs
        FROM driver_best db
        JOIN pole p ON p.raceId = db.raceId
        JOIN constructors c ON c.constructorId = db.constructorId
        WHERE db.bestMs IS NOT NULL AND p.poleMs IS NOT NULL
        GROUP BY db.constructorId, db.raceId, c.name, c.constructorRef
        """, nativeQuery = true)
    List<TeamAvgQualiGapToPolePerRaceView2> getTeamAvgQualiGapToPolePerRace2(@Param("year") int year);



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
