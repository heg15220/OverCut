package overcut.model.services;


import overcut.model.common.exceptions.InstanceNotFoundException;
import overcut.model.entities.*;
import overcut.rest.dtos.QuestionAI;
import overcut.model.services.exceptions.QuizException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Slice;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.util.*;
import java.time.LocalDateTime;
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
    private QuizQuestionDao quizQuestionDao;

    @Autowired
    private AnswerDao answerDao;

    @Autowired
    private AssessmentDao assessmentDao;

    @Autowired
    private AwardDao awardDao;

    @Autowired
    private UserAwardDao userAwardDao;

    @Autowired
    private QuizCategoryDao quizCategoryDao;

    @Autowired
    private QuizTypeDao quizTypeDao;

    @Autowired
    private QuestionLLMService questionLLMService;

    @Autowired
    private QuizTypeTranslationRepositoryDao quizTypeTranslationDao;

    @Autowired
    private QuizCategoryTranslationDao quizCategoryTranslationDao;

    /**
     * The permission checker.
     */
    @Autowired
    private PermissionChecker permissionChecker;


    @Override
    public String getQuizTypeName(QuizType quizType, String lang) {
        return quizTypeTranslationDao.findByQuizTypeIdAndLanguage(quizType.getId(), lang)
                .map(QuizTypeTranslation::getName)
                .map(this::fixEncodingIfNeeded)
                .orElse(quizType.getCode().name());
    }

    @Override
    public String getQuizCategoryName(QuizCategory quizCategory, String lang) {
        return quizCategoryTranslationDao.findByQuizCategoryIdAndLanguage(quizCategory.getId(), lang)
                .map(QuizCategoryTranslation::getName)
                .map(this::fixEncodingIfNeeded)
                .orElse(quizCategory.getCode().name());
    }


    private String fixEncodingIfNeeded(String input) {
        if (containsEncodingArtifacts(input)) {
            String fixed = tryFixEncoding(input);
            if (fixed != null && !input.equals(fixed)) {
                System.out.println("Texto reparado: " + input + " → " + fixed);
                return fixed;
            }
        }
        return input;
    }

    private boolean containsEncodingArtifacts(String text) {
        return text != null && (
                text.contains("Ã¡") || text.contains("Ã©") || text.contains("Ã­") ||
                        text.contains("Ã³") || text.contains("Ãº") || text.contains("Ã±") ||
                        text.contains("Â¿") || text.contains("Â¡") || text.contains("â")
        );
    }
    private String tryFixEncoding(String input) {
        try {
            byte[] isoBytes = input.getBytes(StandardCharsets.ISO_8859_1);
            return new String(isoBytes, StandardCharsets.UTF_8);
        } catch (Exception e) {
            return null;
        }
    }
    private void fixEncodingIssuesSafe(List<Question> questions) {
        for (Question q : questions) {
            try {
                String originalName = q.getName();
                if (containsEncodingArtifacts(originalName)) {
                    String fixed = tryFixEncoding(originalName);
                    if (fixed != null && !originalName.equals(fixed)) {
                        q.setName(fixed);
                        System.out.println("Pregunta reparada: " + originalName + " → " + fixed);
                    }
                }

                if (q.getAnswers() != null) {
                    for (Answer a : q.getAnswers()) {
                        String ansOriginal = a.getName();
                        if (containsEncodingArtifacts(ansOriginal)) {
                            String fixed = tryFixEncoding(ansOriginal);
                            if (fixed != null && !ansOriginal.equals(fixed)) {
                                a.setName(fixed);
                                System.out.println("Respuesta reparada: " + ansOriginal + " → " + fixed);
                            }
                        }
                    }
                }
            } catch (Exception e) {
                System.err.println("Error recodificando pregunta ID " + q.getId() + ": " + e.getMessage());
            }
        }
    }



    private List<Question> getRandomQuestionsByTypeAndCategory(QuizType quizType, QuizCategory quizCategory, String language)
    {
        // Obtener preguntas existentes en BD por categoría
        List<Question> dbQuestions = questionDao.findByQuizCategoryAndLanguage(quizCategory, language);


        fixEncodingIssuesSafe(dbQuestions);

        // Generar preguntas por IA según el tipo de quiz
        List<QuestionAI> aiQuestions = new ArrayList<>();
        if (quizType.getCode().equals(QuizTypeCode.Regulations)) {
            aiQuestions = questionLLMService.generateRegulationQuestions(language, quizCategory.getCode().name());
        } else if(quizType.getCode().equals(QuizTypeCode.Stats)) {
            aiQuestions = questionLLMService.generateQuestionsAI(language, quizCategory.getCode().name());
        } else if(quizType.getCode().equals(QuizTypeCode.Strategy)){
            aiQuestions = questionLLMService.generateStrategyQuestions(language,quizCategory.getCode().name());
        } else if(quizType.getCode().equals(QuizTypeCode.Physics)){
            aiQuestions = questionLLMService.generatePhysicsQuestions(language,quizCategory.getCode().name());
        } else if (quizType.getCode().equals(QuizTypeCode.TeamRadios)) {
            aiQuestions = questionLLMService.generateTeamRadioQuestions(language, quizCategory.getCode().name());
        }

        if (dbQuestions.isEmpty() && (aiQuestions == null || aiQuestions.isEmpty())) {
            throw new RuntimeException("No hay preguntas disponibles para la categoría " + quizCategory.getCode());
        }

        Collections.shuffle(dbQuestions); // Aleatorizar

        // Filtrar por categoría en IA
        List<QuestionAI> aiFiltered = aiQuestions.stream()
                .filter(q -> q.getCategory().equals(quizCategory.getCode()))
                .collect(Collectors.toList());

        // Convertir a entidades
        List<Question> aiConverted = aiFiltered.stream()
                .map(this::convertAIToQuestionEntity)
                .collect(Collectors.toList());

        // Comprobar duplicados por nombre
        Set<String> namesUsed = dbQuestions.stream()
                .map(Question::getName)
                .collect(Collectors.toSet());

        aiConverted = aiConverted.stream()
                .filter(q -> !namesUsed.contains(q.getName()) && !questionDao.existsByName(q.getName()))
                .collect(Collectors.toList());

        // Selección aleatoria y mezcla final
        List<Question> result = new ArrayList<>();
        SecureRandom random = new SecureRandom();

            while (result.size() < 10 && (!dbQuestions.isEmpty() || !aiConverted.isEmpty())) {
            if (!dbQuestions.isEmpty() && (aiConverted.isEmpty() || random.nextBoolean())) {
                result.add(dbQuestions.remove(random.nextInt(dbQuestions.size())));
            } else if (!aiConverted.isEmpty()) {
                Question aiQ = aiConverted.remove(random.nextInt(aiConverted.size()));
                questionDao.save(aiQ);
                aiQ.getAnswers().forEach(answerDao::save);
                result.add(aiQ);
            }
        }

        return result;
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

    @Override
    public int getQuizPoints(Long quizId, Long userId){
        List <UserAnswer> userAnswers = userAnswerDao.findByUserIdAndQuizId(userId,quizId);
        int points = 0;
        for(UserAnswer userAnswer: userAnswers){
            if(userAnswer.getAnswer().isCorrect()) {
                points = points + userAnswer.getQuestion().getKnowledgequestionlevel();
            }
        }

        return points;
    }

    @Override
    public int getAvailableQuizPoints(Long quizId){
        Quiz quiz = quizDao.findQuizById(quizId);

        int points = 0;
        List <Question> questions =quizQuestionDao.findAllQuestionsByQuizId(quizId);
        for(Question question: questions){
            points = points + question.getKnowledgequestionlevel();
        }
        return points;
    }

    private Question convertAIToQuestionEntity(QuestionAI ai) {
        Question q = new Question();
        q.setName(ai.getQuestion());
        q.setKnowledgequestionlevel(ai.getKnowledgeLevel());
        q.setImagePath(null);
        q.setLanguage(ai.getLanguage()); // ← añadir esto

        Optional<QuizCategory> category = quizCategoryDao.findByCode(ai.getCategory());
        if (category.isEmpty()) {
            throw new RuntimeException("No se encontró la categoría: " + ai.getCategory());
        }
        q.setQuizCategory(category.get());

        List<Answer> answers = new ArrayList<>();
        for (String a : ai.getAnswers()) {
            Answer ans = new Answer();
            ans.setName(a);
            ans.setCorrect(a.equals(ai.getCorrectAnswer()));
            ans.setQuestion(q);
            ans.setLanguage(ai.getLanguage()); // ← si deseas traducir respuestas
            answers.add(ans);
        }

        q.setAnswers(answers);
        return q;
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
    public QuizType chooseQuizType() {
        List<QuizType> quizTypes = quizTypeDao.findAllExcludingCode(QuizTypeCode.Pictures);


        if (quizTypes.isEmpty()) {
            throw new RuntimeException("No quiz types available in the system.");
        }

        SecureRandom random = new SecureRandom();
        int randomIndex = random.nextInt(quizTypes.size());

        return quizTypes.get(randomIndex);
    }


    @Override
    public QuizCategory chooseQuizCategory(QuizType quizType) {
        List<QuizCategory> categories = quizCategoryDao.findByQuizType(quizType);

        if (categories.isEmpty()) {
            throw new RuntimeException("No quiz categories available for QuizType: " + quizType.getCode());
        }

        SecureRandom random = new SecureRandom();
        int randomIndex = random.nextInt(categories.size());

        return categories.get(randomIndex);
    }

    private QuizType getStatsType(QuizTypeCode code){
        return quizTypeDao.findByCodeWithoutOptional(code);

    }

    private QuizCategory getQuizCategoryType(){
        return quizCategoryDao.findCategoryById(8L);
    }

    @Override
    public Quiz createQuiz(Long userId, String language) throws InstanceNotFoundException {
        Optional<User> userOptional = userDao.findById(userId);
        if (!userOptional.isPresent()) {
            throw new InstanceNotFoundException("User not found here", userId);
        }

        QuizType quizType = chooseQuizType();
        //QuizType quizType = getStatsType(QuizTypeCode.Stats);
        QuizCategory quizCategory = chooseQuizCategory(quizType);
        //QuizCategory quizCategory = getQuizCategoryType();
        List<Question> storedQuestions = getRandomQuestionsByTypeAndCategory(quizType, quizCategory, language);



        int knowledgeLevelQuestions = getUserKnowledgeLevel(storedQuestions);
        LocalDateTime date = LocalDateTime.now();

        Quiz quiz = new Quiz(date, knowledgeLevelQuestions);
        quizDao.save(quiz);

        for(Question question: storedQuestions){
            QuizQuestions quizQuestion = new QuizQuestions();
            quizQuestion.setQuiz(quiz);
            quizQuestion.setQuestion(question);
            quizQuestionDao.save(quizQuestion);
        }

        return quiz;
    }



    @Override
    public QuizType getQuizQuestionsType(Long quizId) {
        // Obtener las preguntas del quiz
        List<Question> questions = quizQuestionDao.findAllQuestionsByQuizId(quizId);
        QuizCategory quizCategory = questions.get(0).getQuizCategory();

        QuizType quizType = quizCategory.getQuizType();

        return quizType;
    }
    @Override
    public QuizCategory getQuizQuestionsCategory(Long quizId) {
        List<Question> questions = quizQuestionDao.findAllQuestionsByQuizId(quizId);
        QuizCategory quizCategory = questions.get(0).getQuizCategory();

        return quizCategory;
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

        User user = userDao.findUserById(userId);

        // Crear y guardar la respuesta del usuario
        UserAnswer userAnswer = new UserAnswer(userOptional.get(), questionOptional.get(), answerOptional.get(),
                quizOptional.get(), LocalDateTime.now());

        userAnswerDao.save(userAnswer);

        Question question = questionDao.findQuestionById(questionId);
        int points = question.getKnowledgequestionlevel();
        Quiz quiz = quizDao.findQuizById(quizId);
        // Verificar si la respuesta es correcta y actualizar los puntos en la tabla Assessment
        if (answerOptional.get().isCorrect()) {
            quiz.setPoints(quiz.getPoints() + points);
            user.setPoints(user.getPoints() + points);
            quizDao.save(quiz);
            userDao.save(user);
        }

        quizDao.save(quiz);
        userDao.save(user);
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
    public Award chooseAward(Long awardId, Long userId) throws QuizException, InstanceNotFoundException {
        // Verifica si el usuario y el premio existen
        User user = userDao.findById(userId).orElseThrow(() -> new InstanceNotFoundException("No user", userId));
        Award award = awardDao.findById(awardId).orElseThrow(() -> new QuizException("Award not found"));

        // Verifica si el usuario tiene suficientes puntos
        if (user.getPoints() < award.getRequiredPoints()) {
            throw new QuizException("Not enough points");
        }

        int points = user.getPoints() - award.getRequiredPoints();

        user.setPoints(points);
        // Guarda la recompensa en la tabla Award
        award.setUser(user);
        awardDao.save(award);
        userDao.save(user);

        // Crea una nueva instancia de UserAward para registrar la elección
        UserAward userAward = new UserAward();
        userAward.setUser(user);
        userAward.setAward(award);

        // Guarda la relación en la tabla UserAward
        userAwardDao.save(userAward);
        userDao.save(user);

        return award;
    }


    @Override
    public Block<Award> getAvailableAwards(Long userId, int page, int size) throws InstanceNotFoundException{
        Set<Long> claimedAwardIds = userAwardDao.findClaimedAwardIds(userId);
        Slice<Award> allAwardsSlice = awardDao.findAllAwardsSlice(PageRequest.of(page,size));

        // Filtrar las recompensas disponibles excluyendo las ya canjeadas
        List<Award> unclaimedAwards = allAwardsSlice.getContent().stream()
                .filter(award -> !claimedAwardIds.contains(award.getId()))
                .collect(Collectors.toList());

        // Construir el objeto Block
        boolean hasNext = allAwardsSlice.hasNext();
        return new Block<>(unclaimedAwards, hasNext);
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

    @Override
    public int getUserPoints(Long userId){
        return userDao.findUserPointsById(userId);
    }

    @Override
    public Award getAward(Long awardId){
        return awardDao.findAwardById(awardId);
    }

    @Override
    public Block<Award> getAwardsSelectedByUser(Long userId, int page, int size){
        Slice<Award> awards = awardDao.findByUserId(userId, PageRequest.of(page,size));
        return new Block<>(awards.getContent(),awards.hasNext());
    }

    @Override
    public UserAward getUserAward(Long userAwardId){
        return userAwardDao.findUserAwardById(userAwardId);
    }
}


