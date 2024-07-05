package es.udc.fic.tfg.rest.controllers;

import es.udc.fic.tfg.model.common.exceptions.InstanceNotFoundException;
import es.udc.fic.tfg.model.entities.*;
import es.udc.fic.tfg.model.services.Block;
import es.udc.fic.tfg.model.services.QuizService;
import es.udc.fic.tfg.model.services.exceptions.QuizException;
import es.udc.fic.tfg.rest.dtos.*;
import jakarta.persistence.criteria.CriteriaBuilder;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * The class PostController
 */
@RestController
@RequestMapping("/api/quiz")
public class QuizController {
    @Autowired
    private QuizService quizService;


    @PostMapping("/create")
    public Long createQuiz(@RequestAttribute Long userId) throws InstanceNotFoundException{
        return (quizService.createQuiz(userId)).getId();
    }

    @PostMapping("/{id}/answer")
    public void chooseAnswer(@PathVariable("id") Long quizId, @Validated @RequestBody AnswerParamsDto params) throws QuizException,
            InstanceNotFoundException{
        quizService.chooseAnswer(quizId, params.getQuestionId(), params.getUserId(), params.getAnswerId());
    }

    @GetMapping("/{quizId}/questions")
    public BlockDto<QuestionDto> getQuizQuestions(@PathVariable String quizId,
                                            @RequestParam(defaultValue = "0") int page) throws InstanceNotFoundException{
        Long quiz = Long.parseLong(quizId);
        Block<Question> foundQuestions = quizService.findQuestionsByQuizId(quiz, page, 10);
        return new BlockDto<>(QuestionConversor.toQuestionDtos(foundQuestions.getItems()),foundQuestions.getExistMoreItems());
    }

    @GetMapping("/question/{questionId}")
    public QuestionWithAnswersDto getQuestionDetails(@PathVariable Long questionId) throws InstanceNotFoundException{
        Question question = quizService.getQuestionDetails(questionId);
        QuestionDto questionDto = QuestionConversor.convertToQuestionDto(question);
        QuestionWithAnswersDto questionWithAnswersDto = new QuestionWithAnswersDto();
        questionWithAnswersDto.setQuestion(questionDto);
        questionWithAnswersDto.setAnswers(AnswerConversor.toAnswerDtos(question.getAnswers()));
        return questionWithAnswersDto;
    }



    @GetMapping("/{quizId}/user/results")
    public BlockDto<UserAnswerDto> getUserAnswersForQuiz(@PathVariable Long quizId, @RequestAttribute Long userId,
                                                         @RequestParam(defaultValue = "0") int page)throws QuizException{
        Block<UserAnswer> userAnswers = quizService.getUserAnswersForQuiz(userId,quizId,page,2);
        return new BlockDto<>(UserAnswerConversor.toUserAnswerDtos(userAnswers.getItems()),userAnswers.getExistMoreItems());
    }

    @GetMapping("/user/assessments")
    public BlockDto<AssessmentDto> getUserAssessments(@RequestAttribute Long userId, @RequestParam(defaultValue = "0")int page) throws InstanceNotFoundException{
        Block<Assessment> assessments = quizService.getUserAssessments(userId,page,2);
        return new BlockDto<>(AssessmentConversor.toAssessmentDtos(assessments.getItems()), assessments.getExistMoreItems());
    }

    @GetMapping("/awards/award/{awardId}")
    public Long chooseAward(@PathVariable Long awardId, @RequestAttribute Long userId) throws QuizException, InstanceNotFoundException{
        return quizService.chooseAward(awardId,userId).getId();
    }

    @GetMapping("/{userId}/awards")
    public BlockDto<AwardDto> getAvailableAwards(@PathVariable Long userId, @RequestParam(defaultValue = "0") int page) throws InstanceNotFoundException{
        Block<Award> awards = quizService.getAvailableAwards(userId,page,2);
        return new BlockDto<>(AwardConversor.toAwardDtos(awards.getItems()),awards.getExistMoreItems());
    }

    @GetMapping("/{questionId}/answers")
    public List<AnswerDto> getAnswersByQuestion(@PathVariable Long questionId) throws InstanceNotFoundException{
        return AnswerConversor.toAnswerDtos(quizService.getAnswersByQuestion(questionId));
    }

    @GetMapping("/{quizId}")
    public QuizDto findQuizById(@PathVariable Long quizId){
        return QuizConversor.toQuizDto(quizService.findQuizById(quizId));
    }
    @GetMapping("/award/{awardId}")
    public AwardDto getAward(@PathVariable Long awardId) {
        return AwardConversor.convertToAwardDto(quizService.getAward(awardId));
    }

    @GetMapping("/user/{userId}/userAwards")
    public BlockDto<AwardDto> getAwardsSelectedByUser(@PathVariable Long userId, @RequestParam(defaultValue = "0") int page){
        Block<Award> awards = quizService.getAwardsSelectedByUser(userId, page,2);
        return new BlockDto<>(AwardConversor.toAwardDtos(awards.getItems()),awards.getExistMoreItems());
    }
}
