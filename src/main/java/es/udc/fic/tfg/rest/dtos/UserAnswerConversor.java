package es.udc.fic.tfg.rest.dtos;

import es.udc.fic.tfg.model.entities.Quiz;
import es.udc.fic.tfg.model.entities.UserAnswer;

import java.util.List;
import java.util.stream.Collectors;

public class UserAnswerConversor {
    /**
     * Instantiates a new quiz conversor
     */
    private UserAnswerConversor() {
    }

    /**
     * To userAnswer dto.
     *
     * @param userAnswer the userAnswer
     * @return the userAnswer dto
     */

    public static final UserAnswerDto toUserAnswerDto(UserAnswer userAnswer) {
        return new UserAnswerDto(userAnswer.getId(),userAnswer.getUser().getId(),userAnswer.getQuestion().getId(),
                userAnswer.getAnswer().getId(), userAnswer.getQuiz().getId(),userAnswer.getAnswerDate());
    }

    /**
     * To userAnswer dtos
     *
     * @param userAnswers all userAnswers
     * @return the userAnswer
     */
    public static final List<UserAnswerDto> toUserAnswerDtos(List<UserAnswer> userAnswers) {
        return userAnswers.stream().map(UserAnswerConversor::toUserAnswerDto).collect(Collectors.toList());
    }
}
