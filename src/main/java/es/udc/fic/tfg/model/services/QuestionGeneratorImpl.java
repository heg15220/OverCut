package es.udc.fic.tfg.model.services;

import es.udc.fic.tfg.model.entities.*;
import es.udc.fic.tfg.model.services.exceptions.QuestionGeneratorException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;

@Service
public class QuestionGeneratorImpl implements QuestionGenerator{

    private  LLMClient llmClient;
    private  ErgastF1Client ergastClient;

    @Autowired
    private QuestionDao questionDao;

    @Autowired
    private AnswerDao answerDao;



    public QuestionGeneratorImpl(LLMClient llmClient, ErgastF1Client ergastClient,
                             QuestionDao questionDao, AnswerDao answerDao) {
        this.llmClient = llmClient;
        this.ergastClient = ergastClient;
        this.questionDao = questionDao;
        this.answerDao = answerDao;
    }
    private Map<String, Object> generateBasicQuestion(String context) {
        if (context.contains("driver")) {
            Driver driver = ergastClient.getDriverInfo("hamilton");
            return Map.of(
                    "question", "¿Cuál es el número del piloto " + driver.getGivenName() + " " + driver.getFamilyName() + "?",
                    "correct_answer", driver.getPermanentNumber().toString(),
                    "context", "Información básica de pilotos de F1"
            );
        }
        return null;
    }

    private Map<String, Object> generateMediumQuestion(String context) {
        if (context.contains("circuit")) {
            CircuitApiInfo circuit = ergastClient.getCircuitInfo("monza");
            return Map.of(
                    "question", "¿Cuántos giros tiene el circuito de " + circuit.getCircuitName() + "?",
                    "correct_answer", circuit.getLocation().toString(),
                    "context", "Características de circuitos de F1"
            );
        }
        return null;
    }

    private Map<String, Object> generateAdvancedQuestion(String context) {
        if (context.contains("team")) {
            Constructor team = ergastClient.getTeamInfo("mercedes");
            return Map.of(
                    "question", "¿En qué año " + team.getName() + " ganó su primer campeonato de constructores?",
                    "correct_answer", "2014",
                    "context", "Historia de equipos en F1"
            );
        }
        return null;
    }

    private String generatePrompt(int difficulty, String context, Object ergastData) {
        StringBuilder prompt = new StringBuilder();
        prompt.append("Generate a ").append(difficulty).append(" difficulty question about ");
        prompt.append(context).append(" based on the following data: ");

        if (ergastData instanceof Driver) {
            Driver driver = (Driver) ergastData;
            prompt.append("Driver: ").append(driver.getGivenName())
                    .append(" ").append(driver.getFamilyName())
                    .append(", Number: ").append(driver.getPermanentNumber());
        } else if (ergastData instanceof CircuitApiInfo) {
            CircuitApiInfo circuit = (CircuitApiInfo) ergastData;
            prompt.append("Circuit: ").append(circuit.getCircuitName())
                    .append(", Location: ").append(circuit.getLocation());
        } else if (ergastData instanceof Constructor) {
            Constructor team = (Constructor) ergastData;
            prompt.append("Team: ").append(team.getName())
                    .append(", Nationality: ").append(team.getNationality());
        }

        return prompt.toString();
    }

    private Question generateQuestionFromData(Map<String, Object> data, int difficulty) throws QuestionGeneratorException {
        if (data == null) {
            throw new QuestionGeneratorException("No se pudo generar la pregunta");
        }

        Question question = new Question();
        question.setName((String) data.get("question"));
        question.setKnowledgequestionlevel(difficulty);

        // Generar respuestas
        String correctAnswer = (String) data.get("correct_answer");
        List<String> incorrectAnswers = generateIncorrectAnswers(correctAnswer,
                (String) data.get("context"));

        // Guardar pregunta
        question = questionDao.save(question);

        // Guardar respuestas
        incorrectAnswers.add(correctAnswer);
        Collections.shuffle(incorrectAnswers);

        for (int i = 0; i < incorrectAnswers.size(); i++) {
            Answer answer = new Answer();
            answer.setName(incorrectAnswers.get(i));
            answer.setCorrect(i == incorrectAnswers.size() - 1);
            answer.setQuestion(question);
            answerDao.save(answer);
        }

        return question;
    }

    @Override
    public Question generateQuestion(int difficulty, String context) throws QuestionGeneratorException {
        Map<String, Object> data = null;

        // Primero obtener datos reales de Ergast
        Object ergastData = null;
        switch (difficulty) {
            case 1: // Básico
                ergastData = ergastClient.getDriverInfo("hamilton");
                break;
            case 2: // Medio
                ergastData = ergastClient.getCircuitInfo("monza");
                break;
            case 3: // Avanzado
                ergastData = ergastClient.getTeamInfo("mercedes");
                break;
        }

        // Generar pregunta usando LLM
        String prompt = generatePrompt(difficulty, context, ergastData);
        String questionText = llmClient.generateQuestion(prompt);

        // Crear datos para la pregunta
        data = Map.of(
                "question", questionText,
                "correct_answer", getCorrectAnswer(ergastData, difficulty),
                "context", context
        );

        return generateQuestionFromData(data, difficulty);
    }



    private String getCorrectAnswer(Object ergastData, int difficulty) {
        if (difficulty == 1) {
            Driver driver = (Driver) ergastData;
            return driver.getPermanentNumber().toString();
        } else if (difficulty == 2) {
            CircuitApiInfo circuit = (CircuitApiInfo) ergastData;
            return circuit.getLocation();
        } else {
            Constructor team = (Constructor) ergastData;
            return team.getName();
        }
    }


    private List<String> generateIncorrectAnswers(String correctAnswer, String context) {
        List<String> incorrectAnswers = new ArrayList<>();

        if (context.contains("driver")) {
            // Ejemplo: si es un número de piloto
            int number = Integer.parseInt(correctAnswer);
            for (int i = 0; i < 3; i++) {
                incorrectAnswers.add(String.valueOf(number + i + 1));
            }
        } else if (context.contains("circuit")) {
            // Ejemplo: si es número de giros
            int number = Integer.parseInt(correctAnswer);
            for (int i = 0; i < 3; i++) {
                incorrectAnswers.add(String.valueOf(number + i + 5));
            }
        }

        return incorrectAnswers;
    }



}
