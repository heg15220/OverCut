package overcut.model.entities;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface QuizCategoryDao extends JpaRepository<QuizCategory,Long> {
    List<QuizCategory> findByQuizType(QuizType quizType);
    Optional<QuizCategory> findByCodeAndQuizType_Code(QuizCategoryCode code, QuizTypeCode quizTypeCode);

    Optional<QuizCategory> findByCode(QuizCategoryCode code);

    @Query("SELECT qc FROM QuizCategory qc WHERE qc.code = :code")
    QuizCategory findCategoryByCode(@Param("code") QuizCategoryCode code);

    @Query("SELECT qc.quizType FROM QuizCategory qc WHERE qc.code = :code")
    QuizType findQuizTypeByCategoryCode(@Param("code") QuizCategoryCode code);

    @Query("SELECT qc FROM QuizCategory qc WHERE qc.id = :id")
    QuizCategory findCategoryById(@Param("id") Long id);


}
