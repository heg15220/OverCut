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

}
