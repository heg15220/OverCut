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
    SELECT ds.raceId AS raceId, ds.driverId AS driverId, ds.points AS points
    FROM driverstandings ds
    JOIN races ra ON ds.raceId = ra.raceId
    WHERE ra.year = :year
      AND ds.driverId IN (:driver1, :driver2)
""", nativeQuery = true)
    List<DriverStandingRaceView> getStandingsForTop2Drivers(
            @Param("year") int year,
            @Param("driver1") Long driver1,
            @Param("driver2") Long driver2
    );


    @Query(value = """
    SELECT ds.driverId AS driverId, ds.position AS position, r.year AS year
    FROM driverstandings ds
    JOIN races r ON ds.raceId = r.raceId
    WHERE r.year BETWEEN :startYear AND :endYear
""", nativeQuery = true)
    List<DriverStandingYearlyPositionView> getDriverPositionsByYear(
            @Param("startYear") int startYear,
            @Param("endYear") int endYear
    );

    @Query(value = """
    SELECT ds.raceId AS raceId, ds.driverId AS driverId, ds.points AS points, ds.position AS position
    FROM driverstandings ds
    WHERE ds.raceId IN :raceIds
      AND ds.position IN (1, 2)
""", nativeQuery = true)
    List<RaceStandingView> getTop2StandingsByRaceIds(@Param("raceIds") Set<Long> raceIds);

}

