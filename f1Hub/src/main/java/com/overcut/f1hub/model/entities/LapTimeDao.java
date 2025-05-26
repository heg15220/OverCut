package com.overcut.f1hub.model.entities;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Set;

public interface LapTimeDao extends JpaRepository<LapTime, LapTimeId> {
    @Query("SELECT lt FROM LapTime lt WHERE lt.raceId IN :raceIds")
    List<LapTime> findByRaceIdIn(@Param("raceIds") Set<Long> raceIds);

}
