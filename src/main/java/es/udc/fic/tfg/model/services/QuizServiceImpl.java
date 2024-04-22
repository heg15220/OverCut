package es.udc.fic.tfg.model.services;


import es.udc.fic.tfg.model.common.exceptions.InstanceNotFoundException;
import es.udc.fic.tfg.model.entities.*;
import es.udc.fic.tfg.model.services.exceptions.QuizException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.HashMap;
import java.util.Map;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

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
    private AnswerDao answerDao;

    @Autowired
    private AssessmentDao assessmentDao;

    /**
     * The permission checker.
     */
    @Autowired
    private PermissionChecker permissionChecker;

    private List<Question> getRandomQuestions() {
        List<Question> allRandomQuestions = quizDao.findRandomQuestions();
        // Limitamos el resultado a las primeras 10 preguntas
        return allRandomQuestions.stream()
                .limit(10)
                .collect(Collectors.toList());
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
        Assessment assessment = assessmentDao.findByUserIdAndQuizId(userId, quizId);

        User user = userDao.findUserById(userId);

        if (assessment == null) new QuizException("No se encontró el registro de Assessment para el usuario y el quiz");


        // Incrementar los puntos
        assessment.setPoints(assessment.getPoints() + pointsToAdd);

        user.setPoints(assessment.getPoints() + pointsToAdd);
        // Guardar el registro actualizado
        assessmentDao.save(assessment);
        userDao.save(user);
    }


    @Override
    public Quiz createQuiz(Long userId) throws InstanceNotFoundException {
        Optional<User> userOptional = userDao.findById(userId);

        if (!userOptional.isPresent()) {
            throw new InstanceNotFoundException("User not found here", userId);
        }

        List<Question> questions = getRandomQuestions();

        int knowledgeLevelQuestions = getUserKnowledgeLevel(questions);

        LocalDateTime date = LocalDateTime.now();

        Quiz quiz = new Quiz(date, knowledgeLevelQuestions);
        quiz.setQuestions(questions);

        return quiz;
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

        // Verificar si la respuesta es correcta y actualizar los puntos en la tabla Assessment
        if (answerOptional.get().isCorrect()) {
            updateAssessmentPoints(userId, quizId, 1); // Asumiendo que 1 punto se otorga por respuesta correcta
        }
    }

    @Override
    public Map<Question, List<Answer>> getQuizQuestionsAndAnswers(Long quizId) throws QuizException {
        // Verificar si el quiz existe
        Optional<Quiz> quizOptional = quizDao.findById(quizId);
        if (!quizOptional.isPresent()) {
            throw new QuizException("No existe el quiz");
        }
        // Obtener las preguntas asociadas al quiz
        List<Question> questions = questionDao.findByQuizId(quizId);

        // Crear un mapa para almacenar las preguntas y sus respuestas
        Map<Question, List<Answer>> questionAnswerMap = new HashMap<>();

        // Recorrer las preguntas y obtener las respuestas asociadas a cada una
        for (Question question : questions) {
            List<Answer> answers = answerDao.findByQuestionId(question.getId());
            questionAnswerMap.put(question, answers);
        }

        return questionAnswerMap;
    }

    @Override
    public List<UserAnswer> getUserAnswersForQuiz(Long userId, Long quizId) throws QuizException {
        // Buscar las respuestas del usuario para el quiz especificado
        List<UserAnswer> userAnswers = userAnswerDao.findByUserIdAndQuizId(userId, quizId);

        if (userAnswers.isEmpty()) {
            throw new QuizException("No answers found for user with id: " + userId + " and quiz with id: " + quizId);
        }

        return userAnswers;
    }

    @Override
    public List<Assessment> getUserAssessments(Long userId) throws InstanceNotFoundException {
        // Verificar si el usuario existe
        Optional<User> userOptional = userDao.findById(userId);
        if (!userOptional.isPresent()) {
            throw new InstanceNotFoundException("No user", userId);
        }

        // Obtener las valoraciones del usuario
        List<Assessment> userAssessments = assessmentDao.findUserAssessmentsByUserId(userId);

        if (userAssessments.isEmpty()) {
            throw new InstanceNotFoundException("No assessments found for user", userId);
        }

        return userAssessments;
    }

    @Override
    public Assessment createAssessment(Long quizId, Long userId) throws InstanceNotFoundException, QuizException {
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

        return assessment;
    }

}


