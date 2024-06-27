package es.udc.fic.tfg.rest.dtos;

import es.udc.fic.tfg.model.entities.Category;
import es.udc.fic.tfg.model.entities.Post;
import es.udc.fic.tfg.model.entities.Quiz;
import es.udc.fic.tfg.model.entities.User;
import es.udc.fic.tfg.model.services.PostDetails;

import java.util.List;
import java.util.stream.Collectors;

public class QuizConversor {
    /**
     * Instantiates a new quiz conversor
     */
    private QuizConversor() {
    }

    /**
     * To quiz dto.
     *
     * @param quiz the quiz
     * @return the post dto
     */

    public static final QuizDto toQuizDto(Quiz quiz) {
        return new QuizDto(quiz.getId(),quiz.getMaxLength(),quiz.getDate(),
                quiz.getKnowledgeLevel(), quiz.getAssessment().getId(), quiz.getPoints());

    }

    /**
     * To quiz dtos
     *
     * @param quizzes all quiz
     * @return the post
     */
    public static final List<QuizDto> toQuizDtos(List<Quiz> quizzes) {
        return quizzes.stream().map(QuizConversor::toQuizDto).collect(Collectors.toList());

    }
}
