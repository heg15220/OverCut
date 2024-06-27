package es.udc.fic.tfg.model.entities;

import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.CrudRepository;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface QuizQuestionDao extends JpaRepository<QuizQuestions, Long> {
    @EntityGraph(attributePaths = {"question"})
    @Query("SELECT qq.question FROM QuizQuestions qq WHERE qq.quiz.id = :quizId")
    Slice<Question> findQuestionsByQuizId(@Param("quizId") Long quizId, Pageable pageable);
    @Query("SELECT qq.question FROM QuizQuestions qq WHERE qq.quiz.id = :quizId")
    List<Question> findAllQuestionsByQuizId(@Param("quizId") Long quizId);
}
