package es.udc.fic.tfg.model.services;

import com.fasterxml.jackson.databind.ObjectMapper;
import es.udc.fic.tfg.model.entities.QuizCategory;
import es.udc.fic.tfg.model.entities.QuizCategoryCode;
import es.udc.fic.tfg.model.entities.QuizCategoryDao;
import es.udc.fic.tfg.model.entities.QuizType;
import es.udc.fic.tfg.rest.dtos.QuestionAI;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.BufferedWriter;
import java.io.InputStreamReader;
import java.io.OutputStreamWriter;
import java.nio.file.Paths;
import java.util.*;

@Service
public class QuestionLLMServiceImpl implements QuestionLLMService {
    private static final Map<String, QuizCategoryCode> CATEGORY_MAP = new HashMap<>();


    static {
        CATEGORY_MAP.put("Scores", QuizCategoryCode.Scores);
        CATEGORY_MAP.put("Penalty", QuizCategoryCode.Penalty);
        CATEGORY_MAP.put("Drivers", QuizCategoryCode.Drivers);
        CATEGORY_MAP.put("Technical", QuizCategoryCode.Technical);
        CATEGORY_MAP.put("ParcFerme", QuizCategoryCode.ParcFerme);
        CATEGORY_MAP.put("Procedures", QuizCategoryCode.Procedures);
        CATEGORY_MAP.put("Safety", QuizCategoryCode.Safety);
        CATEGORY_MAP.put("Tyres", QuizCategoryCode.Tyres);
        CATEGORY_MAP.put("SafetyCar", QuizCategoryCode.SafetyCar);
        CATEGORY_MAP.put("Qualifying", QuizCategoryCode.Qualifying);
        CATEGORY_MAP.put("Sprint", QuizCategoryCode.Sprint);
        CATEGORY_MAP.put("RedFlag", QuizCategoryCode.RedFlag);
        CATEGORY_MAP.put("PracticalCase", QuizCategoryCode.PracticalCase);
        CATEGORY_MAP.put("GenericStats", QuizCategoryCode.GenericStats);
        CATEGORY_MAP.put("Driver", QuizCategoryCode.Driver);
        CATEGORY_MAP.put("Circuit", QuizCategoryCode.Circuit);
        CATEGORY_MAP.put("Duels", QuizCategoryCode.Duels);
        CATEGORY_MAP.put("LegendarySeason", QuizCategoryCode.LegendarySeason);
        CATEGORY_MAP.put("Team", QuizCategoryCode.Team);
        CATEGORY_MAP.put("RaceStrategy", QuizCategoryCode.RaceStrategy);
        CATEGORY_MAP.put("F1Physics", QuizCategoryCode.F1Physics);

    }


    public static QuizCategoryCode getEnumForCategory(String category) {
        return CATEGORY_MAP.getOrDefault(category, QuizCategoryCode.GenericStats);
    }

    @Override
    public List<QuestionAI> generateQuestionsAI(String language, String category) {
        List<QuestionAI> questions = new ArrayList<>();

        try {
            List<String> command = new ArrayList<>();
            command.add("python"); // o usa variable configurada

            // Ruta absoluta del script
            String scriptPath = Paths.get("src/main/resources/scripts/generate_questions.py").toAbsolutePath().toString();
            command.add(scriptPath);

            if (category != null && !category.isEmpty()) {
                command.add("--category=" + category);
            }
            if (language != null && !language.isEmpty()) {
                command.add("--lang=" + language);
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
                    String lang = (String) raw.get("language");
                    QuizCategoryCode categoryCode = getEnumForCategory(cat);
                    questions.add(new QuestionAI(q, answers, correct, levelVal, categoryCode, lang));

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
    public List<QuestionAI> generateRegulationQuestions(String language, String category) {
        List<QuestionAI> questions = new ArrayList<>();

        try {
            // Construcción del comando
            List<String> command = new ArrayList<>();
            command.add("python"); // Cambia por "python" si estás en Windows o usa variable @Value
            String scriptPath = Paths.get("src/main/resources/scripts/regulation_questions.py")
                    .toAbsolutePath().toString();
            command.add(scriptPath);

            if (category != null && !category.isEmpty()) {
                command.add("--category=" + category);
            }
            if (language != null && !language.isEmpty()) {
                command.add("--lang=" + language);
            }


            // Preparación del proceso
            ProcessBuilder pb = new ProcessBuilder(command);
            pb.redirectErrorStream(true);
            Process process = pb.start();

            // Leer la salida del script
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
                    String lang = (String) raw.get("language");
                    QuizCategoryCode categoryCode = getEnumForCategory(cat);
                    questions.add(new QuestionAI(q, answers, correct, levelVal, categoryCode, lang));
                }
            } else {
                throw new RuntimeException("Error ejecutando el script regulation_questions.py: código " + exitCode);
            }

        } catch (Exception e) {
            e.printStackTrace();
        }

        return questions;
    }

    @Override
    public List<QuestionAI> generateStrategyQuestions(String language, String category) {
        List<QuestionAI> questions = new ArrayList<>();

        try {
            // Construcción del comando
            List<String> command = new ArrayList<>();
            command.add("python"); // Cambia por "python" si estás en Windows o usa variable @Value
            String scriptPath = Paths.get("src/main/resources/scripts/strategy_questions.py")
                    .toAbsolutePath().toString();
            command.add(scriptPath);

            if (category != null && !category.isEmpty()) {
                command.add("--category=" + category);
            }
            if (language != null && !language.isEmpty()) {
                command.add("--lang=" + language);
            }


            // Preparación del proceso
            ProcessBuilder pb = new ProcessBuilder(command);
            pb.redirectErrorStream(true);
            Process process = pb.start();

            // Leer la salida del script
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
                    String lang = (String) raw.get("language");
                    QuizCategoryCode categoryCode = getEnumForCategory(cat);
                    questions.add(new QuestionAI(q, answers, correct, levelVal, categoryCode, lang));
                }
            } else {
                throw new RuntimeException("Error ejecutando el script regulation_questions.py: código " + exitCode);
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
