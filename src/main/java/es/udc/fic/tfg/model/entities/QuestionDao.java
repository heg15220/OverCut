package es.udc.fic.tfg.model.entities;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.CrudRepository;

import java.util.List;

public interface QuestionDao extends CrudRepository<Question, Long> {
    @Query("SELECT q FROM Question q WHERE q.id = ?1")
    Question findQuestionById(Long id);

    @Query("SELECT q FROM Question q WHERE q.quiz.id = ?1")
    List<Question> findByQuizId(Long quizId);
}
