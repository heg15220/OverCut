package es.udc.fic.tfg.rest.controllers;

import es.udc.fic.tfg.model.common.exceptions.InstanceNotFoundException;
import es.udc.fic.tfg.model.entities.*;
import es.udc.fic.tfg.model.services.Block;
import es.udc.fic.tfg.model.services.QuizService;
import es.udc.fic.tfg.model.services.exceptions.QuizException;
import es.udc.fic.tfg.rest.dtos.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

import static es.udc.fic.tfg.rest.dtos.PostConversor.toPostDtos;

/**
 * The class PostController
 */
@RestController
@RequestMapping("/api/quiz")
public class QuizController {
    @Autowired
    private QuizService quizService;


    @PostMapping("/create")
    public Long createQuiz(@RequestAttribute Long userId) throws InstanceNotFoundException, QuizException{
        return (quizService.createQuiz(userId)).getId();
    }

    @PostMapping("/{id}/answer")
    public void chooseAnswer(@PathVariable("id") Long quizId, @Validated @RequestBody AnswerParamsDto params) throws QuizException,
            InstanceNotFoundException{
        quizService.chooseAnswer(quizId, params.getQuestionId(), params.getUserId(), params.getAnswerId());
    }

    @GetMapping("/information")
    public MapDto<QuestionDto, List<AnswerDto>> getQuizQuestionsAndAnswers(@RequestAttribute Long quizId) throws QuizException {
        // Obtener el mapa de preguntas y respuestas del servicio
        Map<Question, List<Answer>> questionAnswerMap = quizService.getQuizQuestionsAndAnswers(quizId);

        // Convertir el mapa de objetos de dominio a DTOs
        return MapDtoConversor.convertToDtoMap(questionAnswerMap);
    }


    @GetMapping("/user/results")
    public BlockDto<UserAnswerDto> getUserAnswersForQuiz(@RequestAttribute Long userId, @RequestAttribute Long quizId,
                                                         @RequestParam(defaultValue = "0") int page)throws QuizException{
        Block<UserAnswer> userAnswers = quizService.getUserAnswersForQuiz(userId,quizId,page,2);
        return new BlockDto<>(UserAnswerConversor.toUserAnswerDtos(userAnswers.getItems()),userAnswers.getExistMoreItems());
    }

    @GetMapping("/user/assessments")
    public BlockDto<AssessmentDto> getUserAssessments(Long userId, int page, int size) throws InstanceNotFoundException{
        Block<Assessment> assessments = quizService.getUserAssessments(userId,page,2);
        return new BlockDto<>(AssessmentConversor.toAssessmentDtos(assessments.getItems()), assessments.getExistMoreItems());
    }

    @PostMapping("/assessment/create")
    public Long createAssessment(@RequestAttribute Long quizId, @RequestAttribute Long userId)
            throws InstanceNotFoundException, QuizException{
        return (quizService.createAssessment(quizId,userId)).getId();
    }
}
