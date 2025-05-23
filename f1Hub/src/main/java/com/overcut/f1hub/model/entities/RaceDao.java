package com.overcut.f1hub.model.entities;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface RaceDao extends JpaRepository<Race, Long> {
    @Query("SELECT DISTINCT r.year FROM Race r ORDER BY r.year DESC")
    List<Integer> findAllDistinctYears();

    @Query("SELECT r FROM Race r WHERE r.year = :year ORDER BY r.round ASC")
    List<Race> findByYearOrderByRoundAsc(@Param("year") int year);

}
