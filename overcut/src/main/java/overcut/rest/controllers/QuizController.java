package overcut.rest.controllers;

import overcut.model.entities.*;
import overcut.model.services.CooldownService;
import overcut.model.services.exceptions.CooldownException;
import overcut.rest.dtos.*;
import overcut.model.common.exceptions.InstanceNotFoundException;
import overcut.model.services.Block;
import overcut.model.services.QuizService;
import overcut.model.services.exceptions.QuizException;
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

    @Autowired
    private UserDao userDao;



    @Autowired
    private CooldownService cooldownService;

    @PostMapping("/create")
    public Long createQuiz(@RequestAttribute Long userId, @RequestParam(defaultValue = "es") String lang)
            throws InstanceNotFoundException {
        if (!cooldownService.canPlay("Quiz", userId)) {
            long wait = cooldownService.secondsUntilNextPlay("Quiz", userId);
            throw new CooldownException("WAIT", wait);
        }

        Quiz quiz = quizService.createQuiz(userId, lang);
        //cooldownService.registerPlay("Quiz", userId);
        return quiz.getId();
    }






    @GetMapping("/{quizId}/quizType")
    public QuizTypeDto getQuizQuestionsType(@PathVariable Long quizId, @RequestParam(defaultValue = "es") String lang){
        QuizType type = quizService.getQuizQuestionsType(quizId);
        String name = quizService.getQuizTypeName(type,lang);
        return new QuizTypeDto(type.getId(),type.getCode(),type.getImagePath(),name);
    }

    @GetMapping("/{quizId}/quizCategory")
    public QuizCategoryDto getQuizQuestionsCategory(@PathVariable Long quizId,
                                                    @RequestParam(defaultValue = "es") String lang) {
        QuizCategory quizCategory = quizService.getQuizQuestionsCategory(quizId);
        String name = quizService.getQuizCategoryName(quizCategory, lang);

        // Si es RacesGP, intenta sobreescribir el nombre con el título del GP guardado
        if (quizCategory.getCode().equals(QuizCategoryCode.RacesGP)) {
            String display = quizService.getQuizDisplayName(quizId);
            if (display != null && !display.isBlank()) {
                name = display; // <-- aquí sustituimos "RacesGP" por "Qatar 2024", etc.
            }
        }

        QuizType quizType = quizService.getQuizQuestionsType(quizId);
        QuizTypeDto quizTypeDto = QuizTypeConversor.convertToQuizTypeDto(quizType);
        return new QuizCategoryDto(quizCategory.getId(), quizCategory.getCode(), quizTypeDto, name);
    }

    @PostMapping("/{id}/answer")
    public void chooseAnswer(@PathVariable("id") Long quizId, @Validated @RequestBody AnswerParamsDto params)
            throws QuizException,
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
        Block<Award> awards = quizService.getAvailableAwards(userId,page,28);
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
    @GetMapping("/{quizId}/user/{userId}/points")
    public int getQuizPoints(@PathVariable Long quizId, @PathVariable Long userId){
        return quizService.getQuizPoints(quizId,userId);
    }
    @GetMapping("/{quizId}/points")
    public int getAvailableQuizPoints(@PathVariable Long quizId){
        return quizService.getAvailableQuizPoints(quizId);
    }
}
