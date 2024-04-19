package es.udc.fic.tfg.model.entities;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.CrudRepository;

import java.util.List;

public interface QuizDao extends CrudRepository<Quiz, Long> {
    @Query("SELECT q FROM Question q ORDER BY RAND()")
    List<Question> findRandomQuestions();
}
