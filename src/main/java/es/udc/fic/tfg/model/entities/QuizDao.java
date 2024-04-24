package es.udc.fic.tfg.model.entities;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.CrudRepository;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface QuizDao extends CrudRepository<Quiz, Long> {


    @Query("SELECT q FROM Quiz q WHERE q.id = :id")
    Quiz findQuizById(@Param("id") Long id);




}
