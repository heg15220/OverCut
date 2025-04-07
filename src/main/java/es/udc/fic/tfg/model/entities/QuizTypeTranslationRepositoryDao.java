package es.udc.fic.tfg.model.entities;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface QuizTypeTranslationRepositoryDao extends JpaRepository<QuizTypeTranslation,Long> {
    Optional<QuizTypeTranslation> findByQuizTypeIdAndLanguage(Long quizTypeId, String language);
}
