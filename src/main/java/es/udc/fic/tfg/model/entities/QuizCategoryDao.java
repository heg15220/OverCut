package es.udc.fic.tfg.model.entities;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface QuizCategoryDao extends JpaRepository<QuizCategory,Long> {
    List<QuizCategory> findByQuizType(QuizType quizType);
    Optional<QuizCategory> findByCodeAndQuizType_Code(QuizCategoryCode code, QuizTypeCode quizTypeCode);

    Optional<QuizCategory> findByCode(QuizCategoryCode code);
}
