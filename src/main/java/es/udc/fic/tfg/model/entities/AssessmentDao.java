package es.udc.fic.tfg.model.entities;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.CrudRepository;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface AssessmentDao extends CrudRepository<Assessment, Long> {
    @Query(value = "SELECT * FROM assessment WHERE user_id = ?1 AND quiz_id = ?2", nativeQuery = true)
    Assessment findByUserIdAndQuizId(@Param("userId") Long userId, @Param("quizId") Long quizId);

    @Query(value = "SELECT * FROM Assessment a WHERE a.userId = :userId", nativeQuery = true)
    List<Assessment> findUserAssessmentsByUserId(@Param("userId") Long userId);

}
