package com.overcut.f1hub.model.entities;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface StatusDao extends JpaRepository<Status, Long> {

    @Query(value = "SELECT ra.year AS year, COUNT(*) AS count " +
            "FROM results r " +
            "JOIN races ra ON r.raceId = ra.raceId " +
            "JOIN status s ON r.statusId = s.statusId " +
            "WHERE LOWER(s.status) LIKE '%accident%' OR LOWER(s.status) LIKE '%collision%' " +
            "GROUP BY ra.year",
            nativeQuery = true)
    List<AccidentStatView> getAccidentCountsBySeason();

}
