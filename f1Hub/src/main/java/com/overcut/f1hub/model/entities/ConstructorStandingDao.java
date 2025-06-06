package com.overcut.f1hub.model.entities;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ConstructorStandingDao extends JpaRepository<ConstructorStanding, Long> {
    List<ConstructorStanding> findByRaceIdOrderByPositionAsc(Long raceId);

}
