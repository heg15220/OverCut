package es.udc.fic.tfg.model.services;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import es.udc.fic.tfg.model.entities.Answer;
import es.udc.fic.tfg.model.entities.AnswerDao;
import es.udc.fic.tfg.model.entities.Question;
import es.udc.fic.tfg.model.entities.QuestionDao;
import es.udc.fic.tfg.model.services.exceptions.QuestionGeneratorException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Random;


@Component
public class LLMClient {

    @Value("${llm.api.key}")
    private String llmApiKey;

    @Value("${ergast.api.base-url}")
    private String ergastApiBaseUrl;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();



    private String getErgastData() throws QuestionGeneratorException {
        try {
            String url = ergastApiBaseUrl + "/current/driverStandings.json";
            ResponseEntity<String> response = restTemplate.getForEntity(url, String.class);

            // Verificar formato de la respuesta
            JsonNode rootNode = objectMapper.readTree(response.getBody());
            if (!rootNode.has("MRData") || !rootNode.path("MRData").has("StandingsTable")) {
                throw new QuestionGeneratorException("Formato de respuesta inválido de la API");
            }

            return response.getBody();
        } catch (RestClientException | JsonProcessingException e) {
            throw new QuestionGeneratorException("Error al obtener datos de la API");
        }
    }

    public List<Question> generateQuestions(String f1Data, int count) throws QuestionGeneratorException {
        List<Question> questions = new ArrayList<>();

        try {
            // Verificar que los datos contengan la estructura necesaria
            JsonNode rootNode = objectMapper.readTree(f1Data);
            if (!rootNode.has("MRData") || !rootNode.path("MRData").has("StandingsTable")) {
                throw new QuestionGeneratorException("Datos de entrada inválidos");
            }

            // Preparar el prompt para el LLM
            String prompt = createPrompt(f1Data, count);

            // Llamar al LLM
            String response = callLLM(prompt);

            // Procesar la respuesta
            questions = processResponse(response);

        } catch (JsonProcessingException e) {
            throw new QuestionGeneratorException("Error al procesar datos de entrada");
        }

        return questions;
    }

    private String createPrompt(String f1Data, int count) {
        return """
            Genera %d preguntas sobre Fórmula 1 basadas en los datos proporcionados:
            %s
            
            Cada pregunta debe:
            - Ser clara y específica
            - Tener 4 opciones de respuesta
            - Incluir la respuesta correcta
            - Basarse en datos reales de F1
            - Ser apropiada para el nivel de conocimiento especificado
            """.formatted(count, f1Data);
    }

    private String callLLM(String prompt) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("Authorization", "Bearer " + llmApiKey);

        HttpEntity<String> request = new HttpEntity<>(prompt, headers);

        return restTemplate.postForObject(
                "https://api.openai.com/v1/chat/completions",
                request,
                String.class
        );
    }

    private List<Question> processResponse(String response) throws QuestionGeneratorException {
        List<Question> questions = new ArrayList<>();

        try {
            JsonNode rootNode = objectMapper.readTree(response);
            JsonNode choices = rootNode.path("choices");

            for (JsonNode choice : choices) {
                JsonNode questionData = choice.path("message").path("content");

                Question question = new Question();
                question.setName(questionData.path("question").asText());
                question.setKnowledgequestionlevel(
                        questionData.path("knowledge_level").asInt()
                );

                // Procesar respuestas
                JsonNode answers = questionData.path("answers");
                for (JsonNode answer : answers) {
                    Answer a = new Answer();
                    a.setName(answer.path("text").asText());
                    a.setCorrect(answer.path("is_correct").asBoolean());
                    question.getAnswers().add(a);
                }

                questions.add(question);
            }
        } catch (JsonProcessingException e) {
            throw new QuestionGeneratorException("Error al procesar respuesta del LLM");
        }

        return questions;
    }
}