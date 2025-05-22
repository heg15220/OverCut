package overcut.model.entities;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface QuizCategoryTranslationDao extends JpaRepository<QuizCategoryTranslation,Long> {
    Optional<QuizCategoryTranslation> findByQuizCategoryIdAndLanguage(Long categoryId, String language);
}
