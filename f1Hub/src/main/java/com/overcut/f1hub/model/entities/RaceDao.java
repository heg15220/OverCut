package com.overcut.f1hub.model.entities;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;


public interface RaceDao extends JpaRepository<Race, Long> {

    @Query("SELECT DISTINCT r.year FROM Race r ORDER BY r.year DESC")
    List<Integer> findAllDistinctYears();

    @Query("SELECT r FROM Race r ORDER BY r.year DESC, r.round ASC")
    List<Race> findAllOrderByYearAndRound();

    @Query("SELECT r FROM Race r WHERE r.year = :year ORDER BY r.round ASC")
    List<Race> findByYearOrderByRoundAsc(int year);

    @Query("SELECT COUNT(r) FROM Race r WHERE r.year BETWEEN :startYear AND :endYear")
    long countRacesInDecade(@Param("startYear") int startYear, @Param("endYear") int endYear);

    @Query("SELECT r FROM Race r WHERE r.circuit.circuitRef = :circuitRef")
    List<Race> findByCircuitRef(@Param("circuitRef") String circuitRef);

    @Query(value = "SELECT ra.year AS year, COUNT(DISTINCT ra.raceId) AS count " +
            "FROM races ra " +
            "GROUP BY ra.year",
            nativeQuery = true)
    List<YearCountView> getRaceCountByYear();

    @Query(value = """
    SELECT ra.year AS year, COUNT(DISTINCT ra.raceId) AS count
    FROM races ra
    WHERE ra.year BETWEEN :startYear AND :endYear
    GROUP BY ra.year
    ORDER BY ra.year
""", nativeQuery = true)
    List<YearCountView> getRaceCountByYear(
            @Param("startYear") int startYear,
            @Param("endYear") int endYear
    );


    @Query("""
    SELECT r FROM Race r
    WHERE r.round = (
        SELECT MAX(r2.round) FROM Race r2 WHERE r2.year = r.year
    )
""")
    List<Race> getLastRacePerYear();

    @Query(value = """
    SELECT r.raceId AS raceId,
           r.name AS raceName,
           r.year AS year,
           COUNT(DISTINCT lt.driverId) AS distinctLeaderCount
    FROM races r
    LEFT JOIN laptimes lt ON lt.raceId = r.raceId AND lt.position = 1
    WHERE (:season IS NULL OR r.year = :season)
    GROUP BY r.raceId, r.name, r.year
    ORDER BY r.year, r.round
""", nativeQuery = true)
    List<RaceLeaderCountView> getDistinctLeadersPerRace(@Param("season") Integer season);

    @Query(value = """
    SELECT
      ra.year AS year,
      COUNT(DISTINCT ra.raceId) AS totalRaces,
      COUNT(CASE
          WHEN LOWER(s.status) NOT IN (
              'finished', 'classified', 'not classified', 'excluded', 'disqualified',
              'did not qualify', 'did not prequalify', 'did not start', 'withdrew', '107% rule'
          )
          AND LOWER(s.status) NOT REGEXP '\\\\+\\\\d+\\\\s+laps?'
          THEN 1
          ELSE NULL
      END) AS retirements
    FROM races ra
    LEFT JOIN results r ON ra.raceId = r.raceId
    LEFT JOIN status s ON r.statusId = s.statusId
    GROUP BY ra.year
    ORDER BY ra.year
""", nativeQuery = true)
    List<RetirementRatioAggView> getRetirementsAndRaceCountsBySeason();

    @Query(value = """
SELECT
  ra.year AS year,
  COUNT(DISTINCT ra.raceId) AS totalRaces,
  COUNT(CASE
      WHEN s.statusId IS NOT NULL 
        AND s.statusId NOT IN :lapDownStatusIds
        AND LOWER(s.status) NOT IN (
            'finished', 'classified', 'not classified', 'excluded', 'disqualified',
            'did not qualify', 'did not prequalify', 'did not start', 'withdrew', '107% rule'
        )
      THEN 1
      ELSE NULL
  END) AS retirements
FROM races ra
LEFT JOIN results r ON ra.raceId = r.raceId
LEFT JOIN status s ON r.statusId = s.statusId
WHERE ra.year BETWEEN :startYear AND :endYear
GROUP BY ra.year
ORDER BY ra.year
""", nativeQuery = true)
    List<RetirementRatioAggView> getRetirementsAndRaceCountsBySeason(
            @Param("lapDownStatusIds") List<Long> lapDownStatusIds,
            @Param("startYear") int startYear,
            @Param("endYear") int endYear
    );


}

