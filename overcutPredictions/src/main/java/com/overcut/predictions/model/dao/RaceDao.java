package com.overcut.predictions.model.dao;

import com.overcut.predictions.model.entities.Race;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RaceDao extends JpaRepository<Race, Long> {

    List<Race> findByYearAndRoundLessThanOrderByRound(Integer year, Integer round);

    List<Race> findByYearOrderByRound(Integer year);

}
