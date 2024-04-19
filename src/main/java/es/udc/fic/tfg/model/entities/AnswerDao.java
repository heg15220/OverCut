package es.udc.fic.tfg.model.entities;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.CrudRepository;

import java.util.List;

public interface AnswerDao extends CrudRepository<Answer, Long> {
    @Query("SELECT a FROM Answer a WHERE a.id = ?1")
    Answer findAnswerById(Long id);

    @Query("SELECT a FROM Answer a WHERE a.question.id = ?1")
    List<Answer> findByQuestionId(Long questionId);
}
