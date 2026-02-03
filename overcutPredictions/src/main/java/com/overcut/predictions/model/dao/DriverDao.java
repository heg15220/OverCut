package com.overcut.predictions.model.dao;

import com.overcut.predictions.model.entities.Driver;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DriverDao extends JpaRepository<Driver, Long> {
}
