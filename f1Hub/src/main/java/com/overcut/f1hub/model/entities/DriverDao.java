package com.overcut.f1hub.model.entities;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface DriverDao extends JpaRepository<Driver, Long> {

    // Consulta personalizada para obtener conductores por una lista de driverIds
    @Query("SELECT d FROM Driver d WHERE d.driverId IN :driverIds")
    List<Driver> findByDriverIds(@Param("driverIds") Iterable<Long> driverIds);
}
