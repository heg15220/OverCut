package com.overcut.predictions.model.dao;

import com.overcut.predictions.model.entities.Result;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ResultDao extends JpaRepository<Result, Long> {

    List<Result> findByRaceId(Long raceId);

    @Query("""
  SELECT DISTINCT r.driverId, r.constructorId
  FROM Result r
  JOIN Race ra ON ra.raceId = r.raceId
  WHERE ra.year = :year
""")
    List<Object[]> findSeasonDriverConstructors(@Param("year") Integer year);

}
