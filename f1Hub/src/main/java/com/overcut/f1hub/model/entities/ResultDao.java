package com.overcut.f1hub.model.entities;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ResultDao extends JpaRepository<Result, Long> {
    List<Result> findByRaceRaceIdOrderByPositionOrderAsc(Long raceId);
    @Query("SELECT r FROM Result r WHERE r.positionOrder = 1 AND r.grid > 2")
    List<Result> findAllByPositionOrderAndGridGreaterThan(@Param("positionOrder") int positionOrder, @Param("grid") int grid);


    @Query("SELECT COUNT(r) FROM Result r JOIN r.race ra WHERE r.driver.driverId = :driverId AND r.positionOrder = 1 AND ra.year BETWEEN :startYear AND :endYear")
    long countWinsByDriverAndYear(@Param("driverId") Long driverId, @Param("startYear") int startYear, @Param("endYear") int endYear);

    // Contar total de carreras disputadas por piloto en la década
    @Query("SELECT COUNT(r) FROM Result r JOIN r.race ra WHERE r.driver.driverId = :driverId AND ra.year BETWEEN :startYear AND :endYear")
    long countRacesByDriverAndYear(@Param("driverId") Long driverId, @Param("startYear") int startYear, @Param("endYear") int endYear);

    @Query("SELECT COUNT(r) FROM Race r WHERE r.year BETWEEN :startYear AND :endYear")
    long countRacesInDecade(@Param("startYear") int startYear, @Param("endYear") int endYear);

}
