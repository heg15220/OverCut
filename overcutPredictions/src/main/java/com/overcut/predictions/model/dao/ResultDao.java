package com.overcut.predictions.model.dao;

import com.overcut.predictions.model.entities.Result;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ResultDao extends JpaRepository<Result, Long> {

    List<Result> findByRaceId(Long raceId);
}
