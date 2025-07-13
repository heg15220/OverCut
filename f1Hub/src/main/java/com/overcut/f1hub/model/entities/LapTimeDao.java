package com.overcut.f1hub.model.entities;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Set;

public interface LapTimeDao extends JpaRepository<LapTime, LapTimeId> {
    @Query("SELECT lt FROM LapTime lt WHERE lt.raceId IN :raceIds")
    List<LapTime> findByRaceIdIn(@Param("raceIds") Set<Long> raceIds);

    @Query("""
    SELECT lt FROM LapTime lt
    JOIN Race r ON lt.raceId = r.raceId
    WHERE lt.position = 1
    AND (:season IS NULL OR r.year = :season)
    """)
    List<LapTime> findLeadersBySeason(@Param("season") Integer season);

    @Query("SELECT lt FROM LapTime lt WHERE lt.position = 1 AND lt.raceId IN :raceIds")
    List<LapTime> findByRaceIdInAndPositionOne(@Param("raceIds") Set<Long> raceIds);


    @Query(value = """
    SELECT raceId, driverId, lap, position
    FROM laptimes
    WHERE raceId IN (:raceIds)
""", nativeQuery = true)
    List<LapTimeSimpleView> findSimpleLapTimesByRaceIds(@Param("raceIds") Collection<Long> raceIds);

    @Query(value = """
    SELECT
      raceId,
      COUNT(*) AS overtakes
    FROM (
      SELECT
        raceId,
        driverId,
        lap,
        position,
        LAG(position) OVER (PARTITION BY raceId, driverId ORDER BY lap) AS prev_position
      FROM laptimes
      WHERE raceId IN :raceIds
    ) t
    WHERE prev_position IS NOT NULL
      AND position < prev_position
    GROUP BY raceId
""", nativeQuery = true)
    List<OvertakeCountPerRaceView> getOvertakesPerRace(@Param("raceIds") Set<Long> raceIds);

    @Query(value = """
    WITH race_data AS (
        SELECT raceId, name AS raceName, round
        FROM races
        WHERE year = :year
    ),
    driver_laps AS (
        SELECT
            laptimes.raceId,
            laptimes.driverId,
            laptimes.lap,
            laptimes.position,
            LAG(laptimes.position) OVER (
                PARTITION BY laptimes.raceId, laptimes.driverId
                ORDER BY laptimes.lap
            ) AS prev_position
        FROM laptimes
        WHERE laptimes.raceId IN (SELECT raceId FROM races WHERE year = :year)
    ),
    overtake_counts AS (
        SELECT
            raceId,
            COUNT(*) AS overtakes
        FROM driver_laps
        WHERE prev_position IS NOT NULL
          AND position < prev_position
        GROUP BY raceId
    )
    SELECT
        rd.raceId,
        rd.raceName,
        rd.round,
        COALESCE(oc.overtakes, 0) AS overtakes
    FROM race_data rd
    LEFT JOIN overtake_counts oc ON rd.raceId = oc.raceId
    ORDER BY rd.round
""", nativeQuery = true)
    List<OvertakePerRaceFullView> getOvertakesPerRaceForYear(@Param("year") int year);


    @Query(value = """
WITH driver_laps AS (
    SELECT
        lt.raceId,
        r.year,
        lt.driverId,
        lt.lap,
        lt.position,
        LAG(lt.position) OVER (PARTITION BY lt.raceId, lt.driverId ORDER BY lt.lap) AS prev_position
    FROM laptimes lt
    JOIN races r ON lt.raceId = r.raceId
)
SELECT
    r.year AS year,
    COUNT(*) AS overtakes
FROM driver_laps r
WHERE prev_position IS NOT NULL
  AND position < prev_position
GROUP BY r.year
ORDER BY r.year
""", nativeQuery = true)
    List<OvertakeCountPerYearView> getOvertakesPerYear();


}
