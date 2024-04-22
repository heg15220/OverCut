package es.udc.fic.tfg.model.services;

import es.udc.fic.tfg.model.common.exceptions.InstanceNotFoundException;
import es.udc.fic.tfg.model.entities.*;
import es.udc.fic.tfg.model.services.exceptions.QuizException;

import java.util.List;
import java.util.Map;

public interface QuizService {

    Quiz createQuiz(Long userId) throws InstanceNotFoundException, QuizException;

    void chooseAnswer(Long quizId, Long questionId, Long userId, Long answerId) throws QuizException, InstanceNotFoundException;

    Map<Question, List<Answer>> getQuizQuestionsAndAnswers(Long quizId) throws QuizException;

    Block<UserAnswer> getUserAnswersForQuiz(Long userId, Long quizId, int page, int size) throws QuizException;

    Block<Assessment> getUserAssessments(Long userId, int page, int size) throws InstanceNotFoundException;

    Assessment createAssessment(Long quizId, Long userId) throws InstanceNotFoundException, QuizException;

}
