package com.overcut.f1hub.model.entities;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Set;

public interface DriverStandingDao extends JpaRepository<DriverStanding, Long> {

    @Query("SELECT ds FROM DriverStanding ds WHERE ds.raceId = :raceId ORDER BY ds.position ASC")
    List<DriverStanding> findByRaceIdOrderByPositionAsc(@Param("raceId") Long raceId);

    List<DriverStanding> findByRaceIdIn(Set<Long> raceIds); // ✅ nueva línea

    @Query(value = """
    SELECT ds.driverId AS driverId, ds.raceId AS raceId, ds.points AS points
    FROM driverstandings ds
    JOIN races ra ON ds.raceId = ra.raceId
    WHERE ra.year = :year AND ds.driverId IN (:driverId1, :driverId2)
""", nativeQuery = true)
    List<DriverStandingRaceView> getStandingsForTop2Drivers(@Param("year") int year, @Param("driverId1") Long driverId1, @Param("driverId2") Long driverId2);


}

