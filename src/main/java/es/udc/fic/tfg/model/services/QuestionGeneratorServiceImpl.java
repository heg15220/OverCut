package es.udc.fic.tfg.model.services;

import es.udc.fic.tfg.model.entities.*;
import es.udc.fic.tfg.model.services.exceptions.QuestionGeneratorException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheConfig;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
@CacheConfig(cacheNames = "f1Data")
public class QuestionGeneratorServiceImpl implements QuestionGenerationService {
    @Autowired
    private LLMClient llmClient;

    @Autowired
    private F1APIClient f1APIClient;

    @Autowired
    private QuestionDao questionDao;

    @Autowired
    private AnswerDao answerDao;

    private String getDifficultyPrefix(int difficultyLevel) {
        switch (difficultyLevel) {
            case 1: return "fácil";
            case 2: return "media";
            case 3: return "difícil";
            default: return "media";
        }
    }

    @Override
    @Cacheable(key = "#difficultyLevel")
    public Question generateQuestion(int difficultyLevel, String f1Api) throws QuestionGeneratorException {
        // Obtener datos actualizados de la API
        F1Data data = f1APIClient.getLatestData(f1Api);

        // Generar pregunta usando el LLM
        String prompt = generatePrompt(difficultyLevel, data);
        String questionText = llmClient.generateQuestion(prompt);

        // Validar la pregunta
        if (!validateQuestion(questionText, data)) {
            throw new QuestionGeneratorException("La pregunta generada no es válida");
        }

        // Crear pregunta en la base de datos
        Question question = new Question();
        question.setName(questionText);
        question.setKnowledgequestionlevel(difficultyLevel);

        // Generar respuestas
        List<Answer> answers = generateAnswers(questionText, data);

        questionDao.save(question);
        for (Answer answer : answers) {
            answer.setQuestion(question);
            answerDao.save(answer);
        }

        return question;
    }

    private String generatePrompt(int difficultyLevel, F1Data data) {
        String difficultyPrefix = getDifficultyPrefix(difficultyLevel);
        return String.format(
                "Genera una pregunta de F1 sobre %s. La pregunta debe ser %s y tener 4 respuestas posibles.",
                data.getTopic(), difficultyPrefix
        );
    }

    private List<Answer> generateAnswers(String question, F1Data data) {
        List<Answer> answers = new ArrayList<>();

        // Respuesta correcta
        Answer correctAnswer = new Answer();
        correctAnswer.setName(data.getCorrectAnswer());
        correctAnswer.setCorrect(true);
        answers.add(correctAnswer);

        // Respuestas incorrectas
        List<String> incorrectAnswers = data.getIncorrectAnswers();
        for (String answer : incorrectAnswers) {
            Answer incorrectAnswer = new Answer();
            incorrectAnswer.setName(answer);
            incorrectAnswer.setCorrect(false);
            answers.add(incorrectAnswer);
        }

        return answers;
    }

    private boolean validateQuestion(String question, F1Data data) {
        return question != null &&
                question.contains(data.getTopic()) &&
                !questionDao.existsByName(question);
    }
}
