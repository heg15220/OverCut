package com.overcut.f1hub.model.entities;


import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface SprintResultDao extends JpaRepository<SprintResult, Long> {
    boolean existsByRaceRaceId(Long raceId);
    List<SprintResult> findByRaceRaceIdOrderByPositionOrderAsc(Long raceId);

    @Query("""
    SELECT s FROM SprintResult s
    JOIN FETCH s.driver
    JOIN FETCH s.race ra
    WHERE ra.year = :year
""")
    List<SprintResult> findByRaceYearWithDriver(@Param("year") int year);

}
