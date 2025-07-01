package overcut.model.entities;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface QuizTypeDao extends JpaRepository<QuizType, Long> {
    Optional<QuizType> findByCode(QuizTypeCode code);
    @Query("SELECT qt FROM QuizType qt WHERE qt.code = :code")
    QuizType findByCodeWithoutOptional(@Param("code") QuizTypeCode code);

    @Query("SELECT q FROM QuizType q WHERE q.code <> :excludedCode")
    List<QuizType> findAllExcludingCode(@Param("excludedCode") QuizTypeCode excludedCode);

}
