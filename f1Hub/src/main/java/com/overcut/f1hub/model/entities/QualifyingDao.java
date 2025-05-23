package com.overcut.f1hub.model.entities;


import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface QualifyingDao extends JpaRepository<Qualifying, Long> {
    List<Qualifying> findByRaceRaceIdOrderByPositionAsc(Long raceId);
    boolean existsByRaceRaceId(Long raceId);

}
