package com.overcut.f1hub.model.entities;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface PitStopDao extends JpaRepository<PitStop, PitStopId> {

    @Query(value = "SELECT ra.raceId AS raceId, ra.name AS raceName, ra.round AS round, COUNT(*) AS count " +
            "FROM pitstops p " +
            "JOIN races ra ON p.raceId = ra.raceId " +
            "WHERE ra.year = :year " +
            "GROUP BY ra.raceId, ra.name, ra.round",
            nativeQuery = true)
    List<PitStopsRaceView> getPitStopsByRaceForYear(@Param("year") int year);

    @Query(value = "SELECT ra.year AS year, COUNT(*) AS pitCount, COUNT(DISTINCT ra.raceId) AS raceCount " +
            "FROM pitstops p " +
            "JOIN races ra ON p.raceId = ra.raceId " +
            "GROUP BY ra.year",
            nativeQuery = true)
    List<AvgPitStopsSeasonView> getAvgPitStopsPerSeason();

    @Query(value = """
    SELECT p.raceId AS raceId, MIN(p.milliseconds) AS milliseconds
    FROM pitstops p
    WHERE p.milliseconds IS NOT NULL
    GROUP BY p.raceId
""", nativeQuery = true)
    List<FastestPitStopView> getMinPitStopPerRace();



}
