package com.overcut.f1hub.model.entities;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface DriverStandingDao extends JpaRepository<DriverStanding, Long> {
    @Query("SELECT ds FROM DriverStanding ds WHERE ds.raceId = :raceId ORDER BY ds.position ASC")
    List<DriverStanding> findByRaceIdOrderByPositionAsc(@Param("raceId") Long raceId);

}
