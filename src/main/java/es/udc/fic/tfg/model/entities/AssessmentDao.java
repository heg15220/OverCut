package es.udc.fic.tfg.model.entities;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.CrudRepository;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface AssessmentDao extends CrudRepository<Assessment, Long>, CustomizedAssessmentDao {
    @Query(value = "SELECT * FROM assessment WHERE userId = ?1 AND quizId = ?2", nativeQuery = true)
    Assessment findByUserIdAndQuizId(@Param("userId") Long userId, @Param("quizId") Long quizId);

    @Query("SELECT a FROM Assessment a JOIN a.user u WHERE u.id = :userId AND a.quiz.id = :quizId")
    Assessment findByQuizIdAndUserId(@Param("quizId") Long quizId, @Param("userId") Long userId);

    @Query(value = "SELECT * FROM Assessment a WHERE a.userId = :userId", nativeQuery = true)
    List<Assessment> findUserAssessmentsByUserId(@Param("userId") Long userId);

}
