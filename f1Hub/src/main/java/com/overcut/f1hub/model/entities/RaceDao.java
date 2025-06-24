package com.overcut.f1hub.model.entities;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;


public interface RaceDao extends JpaRepository<Race, Long> {

    @Query("SELECT DISTINCT r.year FROM Race r ORDER BY r.year DESC")
    List<Integer> findAllDistinctYears();

    @Query("SELECT r FROM Race r ORDER BY r.year DESC, r.round ASC")
    List<Race> findAllOrderByYearAndRound();

    @Query("SELECT r FROM Race r WHERE r.year = :year ORDER BY r.round ASC")
    List<Race> findByYearOrderByRoundAsc(int year);

    @Query("SELECT COUNT(r) FROM Race r WHERE r.year BETWEEN :startYear AND :endYear")
    long countRacesInDecade(@Param("startYear") int startYear, @Param("endYear") int endYear);

    @Query("SELECT r FROM Race r WHERE r.circuit.circuitRef = :circuitRef")
    List<Race> findByCircuitRef(@Param("circuitRef") String circuitRef);

    @Query(value = "SELECT ra.year AS year, COUNT(DISTINCT ra.raceId) AS count " +
            "FROM races ra " +
            "GROUP BY ra.year",
            nativeQuery = true)
    List<YearCountView> getRaceCountByYear();


    @Query("""
    SELECT r FROM Race r
    WHERE r.round = (
        SELECT MAX(r2.round) FROM Race r2 WHERE r2.year = r.year
    )
""")
    List<Race> getLastRacePerYear();

}

