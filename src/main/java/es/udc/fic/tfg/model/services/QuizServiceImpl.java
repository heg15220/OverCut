package es.udc.fic.tfg.model.services;


import es.udc.fic.tfg.model.common.exceptions.InstanceNotFoundException;
import es.udc.fic.tfg.model.entities.*;
import es.udc.fic.tfg.model.services.exceptions.QuizException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Slice;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.util.*;
import java.time.LocalDateTime;
import java.util.stream.Collectors;
import java.util.stream.StreamSupport;

/**
 * The Class QuizServiceImpl.
 */
@Service
@Transactional
public class QuizServiceImpl implements QuizService {


    @Autowired
    private UserAnswerDao userAnswerDao;

    @Autowired
    private UserDao userDao;

    @Autowired
    private QuizDao quizDao;

    @Autowired
    private QuestionDao questionDao;

    @Autowired
    private QuizQuestionDao quizQuestionDao;

    @Autowired
    private AnswerDao answerDao;

    @Autowired
    private AssessmentDao assessmentDao;

    @Autowired
    private AwardDao awardDao;


    /**
     * The permission checker.
     */
    @Autowired
    private PermissionChecker permissionChecker;



    private List<Question> getRandomQuestions() {
        Iterable<Question> allQuestionsWithAnswers = questionDao.findAll();

        List<Question> listQuestions = StreamSupport.stream(allQuestionsWithAnswers.spliterator(),false)
                .collect(Collectors.toList());
        // Crear una copia de la lista para no modificar la lista original
        List<Question> copy = new ArrayList<>(listQuestions);

        // Utilizar SecureRandom para seleccionar índices aleatorios
        SecureRandom rand = new SecureRandom();
        List<Question> randomQuestions = new ArrayList<>();

        // Seleccionar 10 preguntas aleatorias
        for (int i = 0; i < Math.min(10, copy.size()); i++) {
            int randomIndex = rand.nextInt(copy.size());
            randomQuestions.add(copy.remove(randomIndex));
        }

        return randomQuestions;
    }



    private int getUserKnowledgeLevel(List<Question> questions) {
        Map<Integer, Integer> knowledgeLevelCount = new HashMap<>();
        for (Question question : questions) {
            int level = question.getKnowledgequestionlevel();
            knowledgeLevelCount.put(level, knowledgeLevelCount.getOrDefault(level, 0) + 1);
        }

        int mostFrequentLevel = 0;
        int maxCount = 0;
        for (Map.Entry<Integer, Integer> entry : knowledgeLevelCount.entrySet()) {
            if (entry.getValue() > maxCount) {
                mostFrequentLevel = entry.getKey();
                maxCount = entry.getValue();
            }
        }

        return mostFrequentLevel;
    }

    private int getQuizPoints(Long quizId, Long userId){
        List <UserAnswer> userAnswers = userAnswerDao.findByUserIdAndQuizId(userId,quizId);
        int points = 0;
        for(UserAnswer userAnswer: userAnswers){
            if(userAnswer.getAnswer().isCorrect()) points ++;
        }

        return points;
    }

    private void updateAssessmentPoints(Long userId, Long quizId, int pointsToAdd) throws QuizException {
        // Buscar el registro de Assessment para el usuario y el quiz
        Assessment assessment = assessmentDao.findByQuizIdAndUserId(quizId,userId);

        User user = userDao.findUserById(userId);

        if (assessment == null) throw new QuizException("No se encontró el registro de Assessment para el usuario y el quiz");


        // Incrementar los puntos
        assessment.setPoints(assessment.getPoints() + pointsToAdd);

        user.setPoints(assessment.getPoints() + pointsToAdd);
        // Guardar el registro actualizado
        assessmentDao.save(assessment);
        userDao.save(user);
    }

    @Override
    public Quiz createQuiz(Long userId) throws InstanceNotFoundException{
        Optional<User> userOptional = userDao.findById(userId);

        if (!userOptional.isPresent()) {
            throw new InstanceNotFoundException("User not found here", userId);
        }

        List<Question> questions = getRandomQuestions();

        int knowledgeLevelQuestions = getUserKnowledgeLevel(questions);

        LocalDateTime date = LocalDateTime.now();

        Quiz quiz = new Quiz(date, knowledgeLevelQuestions);

        quizDao.save(quiz);

        // Asociar las preguntas al cuestionario
        for (Question question : questions) {
            QuizQuestions quizQuestion = new QuizQuestions();
            quizQuestion.setQuiz(quiz);
            quizQuestion.setQuestion(question);
            quizQuestionDao.save(quizQuestion);
        }

        return quiz;
    }


    private Assessment createAssessment(Long quizId, Long userId) throws InstanceNotFoundException, QuizException {
        // Verificar si el usuario existe
        Optional<User> userOptional = userDao.findById(userId);
        if (!userOptional.isPresent()) {
            throw new InstanceNotFoundException("No user", userId);
        }
        // Verificar si el quiz existe
        Optional<Quiz> quizOptional = quizDao.findById(quizId);
        if (!quizOptional.isPresent()) {
            throw new QuizException("No existe el quiz");
        }

        User user = userDao.findUserById(userId);
        Quiz quiz = quizDao.findQuizById(quizId);

        int points = getQuizPoints(quizId,userId);

        Assessment assessment = new Assessment(points,user,quiz);
        assessmentDao.save(assessment);

        quizDao.save(quiz);

        return assessment;
    }



    @Override
    public void chooseAnswer(Long quizId, Long questionId, Long userId, Long answerId) throws QuizException, InstanceNotFoundException {
        // Verificar si el usuario existe
        Optional<User> userOptional = userDao.findById(userId);
        if (!userOptional.isPresent()) {
            throw new InstanceNotFoundException("User not found", userId);
        }

        // Verificar si el quiz existe
        Optional<Quiz> quizOptional = quizDao.findById(quizId);
        if (!quizOptional.isPresent()) {
            throw new QuizException("El quiz no existe");
        }

        // Verificar si la pregunta existe
        Optional<Question> questionOptional = questionDao.findById(questionId);
        if (!questionOptional.isPresent()) {
            throw new QuizException("No existe la pregunta");
        }

        // Verificar si la respuesta existe
        Optional<Answer> answerOptional = answerDao.findById(answerId);
        if (!answerOptional.isPresent()) {
            throw new QuizException("No existe la respuesta");
        }


        // Crear y guardar la respuesta del usuario
        UserAnswer userAnswer = new UserAnswer(userOptional.get(), questionOptional.get(), answerOptional.get(),
                quizOptional.get(), LocalDateTime.now());

        userAnswerDao.save(userAnswer);

        Quiz quiz = quizDao.findQuizById(quizId);
        int points= 1;
        // Verificar si la respuesta es correcta y actualizar los puntos en la tabla Assessment
        if (answerOptional.get().isCorrect()) {
            quiz.setPoints(quiz.getPoints() + points);
        }
        quizDao.save(quiz);
        List<QuizQuestions> quizQuestions = quiz.getQuizQuestions();

        QuizQuestions lastQuizQuestion = quizQuestions.get(quizQuestions.size() - 1);
        Question question = lastQuizQuestion.getQuestion();
        if(question.getId() == questionId){
            createAssessment(quizId,userId);
            updateAssessmentPoints(userId,quizId,quiz.getPoints());
        }
    }
    @Override
    @Transactional(readOnly = true)
    public Block<Question> findQuestionsByQuizId(Long quizId, int page,int size) throws InstanceNotFoundException{
        Slice<Question> questions =quizQuestionDao.findQuestionsByQuizId(quizId,PageRequest.of(page,size));
        return new Block<>(questions.getContent(), questions.hasNext());
    }

    @Override
    @Transactional(readOnly = true)
    public Question getQuestionDetails(Long questionId) throws InstanceNotFoundException{
        if(questionDao.findQuestionById(questionId) == null) throw new InstanceNotFoundException("Question not found",questionId);
        Question question = questionDao.findQuestionById(questionId);
        return question;
    }
    @Override
    @Transactional(readOnly = true)
    public Block<UserAnswer> getUserAnswersForQuiz(Long userId, Long quizId, int page, int size) throws QuizException {
        // Buscar las respuestas del usuario para el quiz especificado
        Slice<UserAnswer> userAnswers = userAnswerDao.filterByUserIdAndQuizId(userId,quizId, page,size);

        if (userAnswers.isEmpty()) {
            throw new QuizException("No answers found for user with id: " + userId + " and quiz with id: " + quizId);
        }

        return new Block<>(userAnswers.getContent(), userAnswers.hasNext());
    }

    @Override
    @Transactional(readOnly = true)
    public Block<Assessment> getUserAssessments(Long userId, int page, int size) throws InstanceNotFoundException {
        // Verificar si el usuario existe
        Optional<User> userOptional = userDao.findById(userId);
        if (!userOptional.isPresent()) {
            throw new InstanceNotFoundException("No user", userId);
        }

        // Obtener las valoraciones del usuario
        Slice<Assessment> assessmentSlice = assessmentDao.filterUserAssessmentsByUserId(userId, page,size); // Ajusta los parámetros de paginación según sea necesario

        if (assessmentSlice.getContent().isEmpty()) {
            throw new InstanceNotFoundException("No assessments found for user", userId);
        }

        return new Block<>(assessmentSlice.getContent(), assessmentSlice.hasNext());
    }


    @Override
    public Award chooseAward(Long awardId, Long userId) throws QuizException, InstanceNotFoundException{

        // Verificar si el usuario existe
        Optional<User> userOptional = userDao.findById(userId);
        if (!userOptional.isPresent()) {
            throw new InstanceNotFoundException("No user", userId);
        }
        User user = userDao.findUserById(userId);

        Award award = awardDao.findAwardById(awardId);
        if(user.getPoints() < award.getRequiredPoints()){
            throw new QuizException("Not enough points");
        }

        int points = user.getPoints() - award.getRequiredPoints();

        user.setPoints(points);

        award.setUser(user);

        userDao.save(user);

        awardDao.save(award);

        return award;

    }

    @Override
    public Block<Award> getAvailableAwards(Long userId, int page, int size) throws InstanceNotFoundException{
        // Verificar si el usuario existe
        Optional<User> userOptional = userDao.findById(userId);
        if (!userOptional.isPresent()) {
            throw new InstanceNotFoundException("No user", userId);
        }
        User user = userDao.findUserById(userId);


        Slice<Award> awards = awardDao.findAwardsAvailableForUser(userId,user.getPoints(),PageRequest.of(page,size));

        return new Block<>(awards.getContent(), awards.hasNext());
    }

    @Override
    public List<Answer> getAnswersByQuestion(Long questionId) throws InstanceNotFoundException{
        if(questionDao.findQuestionById(questionId) == null) throw new InstanceNotFoundException("Question not found",questionId);

        return answerDao.findByQuestionId(questionId);
    }

    @Override
    public Quiz findQuizById(Long quizId){
        return quizDao.findQuizById(quizId);
    }
}


