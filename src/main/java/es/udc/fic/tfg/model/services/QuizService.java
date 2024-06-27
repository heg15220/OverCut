package es.udc.fic.tfg.model.services;

import es.udc.fic.tfg.model.common.exceptions.InstanceNotFoundException;
import es.udc.fic.tfg.model.entities.*;
import es.udc.fic.tfg.model.services.exceptions.QuizException;

import java.util.List;

public interface QuizService {

    Quiz createQuiz(Long userId) throws InstanceNotFoundException;

    void chooseAnswer(Long quizId, Long questionId, Long userId, Long answerId) throws QuizException, InstanceNotFoundException;

    Block<Question> findQuestionsByQuizId(Long quizId, int page, int size) throws InstanceNotFoundException;

    Question getQuestionDetails(Long questionId) throws InstanceNotFoundException;
    Block<UserAnswer> getUserAnswersForQuiz(Long userId, Long quizId, int page, int size) throws QuizException;

    Block<Assessment> getUserAssessments(Long userId, int page, int size) throws InstanceNotFoundException;


    Award chooseAward(Long awardId, Long userId) throws QuizException, InstanceNotFoundException;

    Block<Award> getAvailableAwards(Long userId, int page, int size) throws InstanceNotFoundException;

}
