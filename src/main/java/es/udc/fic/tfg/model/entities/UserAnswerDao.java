package es.udc.fic.tfg.model.entities;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.CrudRepository;

import java.util.List;

public interface UserAnswerDao extends CrudRepository<UserAnswer, Long>, CustomizedUserAnswerDao {
    @Query("SELECT ua FROM UserAnswer ua WHERE ua.user.id = ?1 AND ua.quiz.id = ?2")
    List<UserAnswer> findByUserIdAndQuizId(Long userId, Long quizId);
}
