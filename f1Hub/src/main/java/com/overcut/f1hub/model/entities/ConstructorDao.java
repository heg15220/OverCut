package com.overcut.f1hub.model.entities;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ConstructorDao extends JpaRepository<Constructor, Long> {

    @Query("SELECT c.name FROM Constructor c WHERE c.constructorId = :constructorId")
    String findNameById(@Param("constructorId") Long constructorId);

}
