package es.udc.fic.tfg.model.entities;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.CrudRepository;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface QuestionDao extends CrudRepository<Question, Long> {
    @Query("SELECT q FROM Question q WHERE q.id = ?1")
    Question findQuestionById(Long id);

    @Query(value = "SELECT * FROM Question ORDER BY RAND() LIMIT 10", nativeQuery = true)
    List<Question> findRandomQuestions();

    @Query("SELECT q FROM Question q")
    List<Question> findAllQuestions();


}
