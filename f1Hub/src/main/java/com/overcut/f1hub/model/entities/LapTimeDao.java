package com.overcut.f1hub.model.entities;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Set;

public interface LapTimeDao extends JpaRepository<LapTime, LapTimeId> {
    @Query("SELECT lt FROM LapTime lt WHERE lt.raceId IN :raceIds")
    List<LapTime> findByRaceIdIn(@Param("raceIds") Set<Long> raceIds);

    @Query("""
    SELECT lt FROM LapTime lt
    JOIN Race r ON lt.raceId = r.raceId
    WHERE lt.position = 1
    AND (:season IS NULL OR r.year = :season)
    """)
    List<LapTime> findLeadersBySeason(@Param("season") Integer season);

    @Query("SELECT lt FROM LapTime lt WHERE lt.position = 1 AND lt.raceId IN :raceIds")
    List<LapTime> findByRaceIdInAndPositionOne(@Param("raceIds") Set<Long> raceIds);


    @Query(value = """
    SELECT raceId, driverId, lap, position
    FROM laptimes
    WHERE raceId IN (:raceIds)
""", nativeQuery = true)
    List<LapTimeSimpleView> findSimpleLapTimesByRaceIds(@Param("raceIds") Collection<Long> raceIds);


}
