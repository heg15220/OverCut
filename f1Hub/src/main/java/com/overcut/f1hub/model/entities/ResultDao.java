package com.overcut.f1hub.model.entities;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ResultDao extends JpaRepository<Result, Long> {
    List<Result> findByRaceRaceIdOrderByPositionOrderAsc(Long raceId);
}
