package es.udc.fic.tfg.model.entities;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface QuizCategoryTranslationDao extends JpaRepository<QuizCategoryTranslation,Long> {
    Optional<QuizCategoryTranslation> findByQuizCategory_IdAndLanguage(Long categoryId, String language);
}
