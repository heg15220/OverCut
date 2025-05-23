package com.overcut.f1hub.model.entities;


import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SprintResultDao extends JpaRepository<SprintResult, Long> {
    boolean existsByRaceRaceId(Long raceId);
    List<SprintResult> findByRaceRaceIdOrderByPositionOrderAsc(Long raceId);
}
