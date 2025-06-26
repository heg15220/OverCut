package overcut.model.services;

import com.fasterxml.jackson.databind.ObjectMapper;
import overcut.model.entities.QuizCategoryCode;
import overcut.rest.dtos.QuestionAI;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.BufferedWriter;
import java.io.InputStreamReader;
import java.io.OutputStreamWriter;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
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
        CATEGORY_MAP.put("LegendaryTeamRadios", QuizCategoryCode.LegendaryTeamRadios);

    }


    public static QuizCategoryCode getEnumForCategory(String category) {
        return CATEGORY_MAP.getOrDefault(category, QuizCategoryCode.GenericStats);
    }

    @Override
    public List<QuestionAI> generateQuestionsAI(String language, String category) {
        List<QuestionAI> questions = new ArrayList<>();
        try {
            String urlStr = "http://localhost:8000/generate-quiz-questions?lang=" +
                    java.net.URLEncoder.encode(language, "UTF-8");

            if (category != null && !category.isEmpty()) {
                urlStr += "&category=" + java.net.URLEncoder.encode(category, "UTF-8");
            }

            URL url = new URL(urlStr);
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("GET");

            BufferedReader reader = new BufferedReader(new InputStreamReader(conn.getInputStream(), java.nio.charset.StandardCharsets.UTF_8));
            StringBuilder json = new StringBuilder();
            String line;
            while ((line = reader.readLine()) != null) {
                json.append(line);
            }
            reader.close();

            ObjectMapper mapper = new ObjectMapper();
            List<Map<String, Object>> rawQuestions = mapper.readValue(json.toString(), List.class);

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

        } catch (Exception e) {
            e.printStackTrace();
        }

        return questions;
    }

    private List<QuestionAI> fetchQuestionsFromEndpoint(String baseUrl, String language, String category) {
        List<QuestionAI> questions = new ArrayList<>();

        try {
            String urlStr = baseUrl + "?lang=" + java.net.URLEncoder.encode(language, "UTF-8");
            if (category != null && !category.isEmpty()) {
                urlStr += "&category=" + java.net.URLEncoder.encode(category, "UTF-8");
            }

            URL url = new URL(urlStr);
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("GET");

            BufferedReader reader = new BufferedReader(new InputStreamReader(conn.getInputStream(), java.nio.charset.StandardCharsets.UTF_8));
            StringBuilder json = new StringBuilder();
            String line;
            while ((line = reader.readLine()) != null) {
                json.append(line);
            }
            reader.close();

            ObjectMapper mapper = new ObjectMapper();
            List<Map<String, Object>> rawQuestions = mapper.readValue(json.toString(), List.class);

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

        } catch (Exception e) {
            e.printStackTrace();
        }

        return questions;
    }


    @Override
    public List<QuestionAI> generateRegulationQuestions(String language, String category) {
        return fetchQuestionsFromEndpoint("http://localhost:8000/generate-quiz-regulation", language, category);
    }

    @Override
    public List<QuestionAI> generateStrategyQuestions(String language, String category) {
        return fetchQuestionsFromEndpoint("http://localhost:8000/generate-quiz-strategy", language, category);
    }

    @Override
    public List<QuestionAI> generatePhysicsQuestions(String language, String category) {
        return fetchQuestionsFromEndpoint("http://localhost:8000/generate-quiz-physics", language, category);
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


    @Override
    public List<QuestionAI> generateTeamRadioQuestions(String language, String category) {
        List<QuestionAI> questions = new ArrayList<>();
        try {
            String urlStr = "http://localhost:8000/generate-quiz-teamradios?lang=" +
                    java.net.URLEncoder.encode(language, "UTF-8");

            URL url = new URL(urlStr);
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("GET");

            BufferedReader reader = new BufferedReader(new InputStreamReader(conn.getInputStream(), StandardCharsets.UTF_8));
            StringBuilder json = new StringBuilder();
            String line;
            while ((line = reader.readLine()) != null) {
                json.append(line);
            }
            reader.close();

            ObjectMapper mapper = new ObjectMapper();
            List<Map<String, Object>> rawQuestions = mapper.readValue(json.toString(), List.class);

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

        } catch (Exception e) {
            e.printStackTrace();
        }

        return questions;
    }

}
