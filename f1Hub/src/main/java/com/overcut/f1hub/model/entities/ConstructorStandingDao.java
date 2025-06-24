package com.overcut.f1hub.model.entities;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface ConstructorStandingDao extends JpaRepository<ConstructorStanding, Long> {
    List<ConstructorStanding> findByRaceIdOrderByPositionAsc(Long raceId);

    @Query(value = """
    SELECT cs.constructorId AS constructorId, cs.position AS position,
           ra.year AS year, ra.raceId AS raceId
    FROM constructorstandings cs
    JOIN races ra ON cs.raceId = ra.raceId
    WHERE ra.year BETWEEN 1950 AND 2025
      AND ra.round = (SELECT MAX(r2.round) FROM races r2 WHERE r2.year = ra.year)
""", nativeQuery = true)
    List<ConstructorStandingFinalView> getFinalTeamStandingPerYear();

}
