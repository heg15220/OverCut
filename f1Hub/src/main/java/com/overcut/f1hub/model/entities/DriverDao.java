package com.overcut.f1hub.model.entities;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface DriverDao extends JpaRepository<Driver, Long> {

    // Consulta personalizada para obtener conductores por una lista de driverIds
    @Query("SELECT d FROM Driver d WHERE d.driverId IN :driverIds")
    List<Driver> findByDriverIds(@Param("driverIds") Iterable<Long> driverIds);

    @Query("SELECT DISTINCT d FROM Driver d JOIN d.results r JOIN r.race ra WHERE ra.year BETWEEN :startYear AND :endYear")
    List<Driver> findDriversByDecade(@Param("startYear") int startYear, @Param("endYear") int endYear);

    @Query("SELECT CONCAT(d.forename, ' ', d.surname) FROM Driver d WHERE d.driverId = :driverId")
    String findNameById(@Param("driverId") Long driverId);


}
