package es.udc.fic.tfg.model.services;

import com.fasterxml.jackson.databind.ObjectMapper;
import es.udc.fic.tfg.model.entities.QuizCategoryCode;
import es.udc.fic.tfg.rest.dtos.QuestionAI;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.BufferedWriter;
import java.io.InputStreamReader;
import java.io.OutputStreamWriter;
import java.util.*;

@Service
public class QuestionLLMServiceImpl implements QuestionLLMService {
    private static final Map<String, QuizCategoryCode> CATEGORY_MAP = new HashMap<>();

    static {
        CATEGORY_MAP.put("Puntuación", QuizCategoryCode.Scores);
        CATEGORY_MAP.put("Sanciones", QuizCategoryCode.Penalty);
        CATEGORY_MAP.put("Pilotos", QuizCategoryCode.Drivers);
        CATEGORY_MAP.put("Técnico", QuizCategoryCode.Technical);
        CATEGORY_MAP.put("Parque Cerrado", QuizCategoryCode.ParcFerme);
        CATEGORY_MAP.put("Procedimientos", QuizCategoryCode.Procedures);
        CATEGORY_MAP.put("Seguridad", QuizCategoryCode.Safety);
        CATEGORY_MAP.put("Neumáticos", QuizCategoryCode.Tyres);
        CATEGORY_MAP.put("Safety Car", QuizCategoryCode.SafetyCar);
        CATEGORY_MAP.put("Clasificación", QuizCategoryCode.Qualifying);
        CATEGORY_MAP.put("Sprint", QuizCategoryCode.Sprint);
        CATEGORY_MAP.put("Bandera Roja", QuizCategoryCode.RedFlag);
        CATEGORY_MAP.put("Caso práctico", QuizCategoryCode.PracticalCase);
    }

    public static QuizCategoryCode getEnumForCategory(String category) {
        return CATEGORY_MAP.getOrDefault(category, QuizCategoryCode.GenericStats);
    }

    @Override
    public List<QuestionAI> generateQuestionsAI() {
        List<QuestionAI> questions = new ArrayList<>();

        try {
            ProcessBuilder pb = new ProcessBuilder("python", "src/main/resources/scripts/generate_questions.py");

            pb.redirectErrorStream(true);
            Process process = pb.start();

            BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()));
            StringBuilder jsonOutput = new StringBuilder();
            String line;
            while ((line = reader.readLine()) != null) {
                jsonOutput.append(line);
            }

            int exitCode = process.waitFor();
            if (exitCode == 0) {
                ObjectMapper mapper = new ObjectMapper();
                QuestionAI[] preguntas = mapper.readValue(jsonOutput.toString(), QuestionAI[].class);
                questions = Arrays.asList(preguntas);
            } else {
                throw new RuntimeException("Error ejecutando el script: código " + exitCode);
            }

        } catch (Exception e) {
            e.printStackTrace();
        }

        return questions;
    }
    @Override
    public List<QuestionAI> generateRegulationQuestions(String category) {
        List<QuestionAI> questions = new ArrayList<>();
        try {
            List<String> command = new ArrayList<>();
            command.add("python");
            command.add("src/main/resources/scripts/regulation_questions.py");

            if (category != null && !category.isEmpty()) {
                command.add("--category=" + category);
            }

            ProcessBuilder pb = new ProcessBuilder(command);
            pb.redirectErrorStream(true);
            Process process = pb.start();

            BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()));
            StringBuilder jsonOutput = new StringBuilder();
            String line;
            while ((line = reader.readLine()) != null) {
                jsonOutput.append(line);
            }

            int exitCode = process.waitFor();
            if (exitCode == 0) {
                ObjectMapper mapper = new ObjectMapper();
                List<Map<String, Object>> rawQuestions = mapper.readValue(jsonOutput.toString(), List.class);

                for (Map<String, Object> raw : rawQuestions) {
                    String q = (String) raw.get("question");
                    List<String> answers = (List<String>) raw.get("answers");
                    String correct = (String) raw.get("correctAnswer");
                    int levelVal = (Integer) raw.get("knowledgeLevel");
                    String cat = (String) raw.get("category");

                    QuizCategoryCode categoryCode = getEnumForCategory(cat);

                    questions.add(new QuestionAI(q, answers, correct, levelVal, categoryCode));
                }
            } else {
                throw new RuntimeException("Error ejecutando el script: código " + exitCode);
            }

        } catch (Exception e) {
            e.printStackTrace();
        }

        return questions;
    }


    @Override
    public String validateQuestion(String question, List<String> answers) {
        try {
            ProcessBuilder pb = new ProcessBuilder("python", "src/main/resources/scripts/validate_question.py");
            pb.redirectErrorStream(true);
            Process process = pb.start();

            // Enviar datos al script
            BufferedWriter writer = new BufferedWriter(new OutputStreamWriter(process.getOutputStream()));
            ObjectMapper mapper = new ObjectMapper();
            writer.write(mapper.writeValueAsString(Map.of(
                    "question", question,
                    "answers", answers
            )));
            writer.flush();
            writer.close();

            // Leer resultado
            BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()));
            StringBuilder jsonOutput = new StringBuilder();
            String line;
            while ((line = reader.readLine()) != null) {
                jsonOutput.append(line);
            }

            int exitCode = process.waitFor();
            if (exitCode == 0) {
                Map<?, ?> response = mapper.readValue(jsonOutput.toString(), Map.class);
                return (String) response.get("correctAnswer");
            } else {
                throw new RuntimeException("Error al ejecutar el validador, código: " + exitCode);
            }

        } catch (Exception e) {
            e.printStackTrace();
            return "error";
        }
    }



}
