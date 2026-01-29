package com.overcut.f1hub.model.entities;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;


public interface QualiAggDao extends JpaRepository<TeamQualiGapPerRace, TeamQualiGapPerRaceId> {

    @Query(value = """
        SELECT
          r.raceId AS raceId,
          r.round  AS round,
          r.name   AS raceName,
          tqg.constructorId AS constructorId,
          c.constructorRef  AS constructorRef,
          c.name            AS constructorName,
          tqg.avgQualiGapMs AS avgQualiGapMs
        FROM team_quali_gap_per_race tqg
        JOIN races r ON r.raceId = tqg.raceId
        JOIN constructors c ON c.constructorId = tqg.constructorId
        WHERE r.year = :year
        ORDER BY r.round
    """, nativeQuery = true)
    List<TeamAvgQualiGapToPolePerRaceView> getTeamAvgQualiGapToPolePerRaceAgg(@Param("year") int year);
}
