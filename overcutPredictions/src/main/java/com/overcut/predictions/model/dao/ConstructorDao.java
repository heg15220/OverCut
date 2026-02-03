package com.overcut.predictions.model.dao;

import com.overcut.predictions.model.entities.Constructor;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ConstructorDao extends JpaRepository<Constructor, Long> {
}
