package es.udc.fic.tfg.model.services;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import es.udc.fic.tfg.model.entities.AnswerDao;
import es.udc.fic.tfg.model.entities.Question;
import es.udc.fic.tfg.model.entities.QuestionDao;
import es.udc.fic.tfg.model.services.exceptions.QuestionGeneratorException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.List;

@Service
public class QuestionGeneratorServiceImpl implements QuestionGenerator{

    @Autowired
    private LLMClient llmClient;

    @Autowired
    private QuestionDao questionDao;

    @Autowired
    private AnswerDao answerDao;


    private CacheManager cacheManager;

    @Value("${ergast.api.base-url}")
    private String ergastApiBaseUrl;

    private final RestTemplate restTemplate = new RestTemplate();


    private final ObjectMapper objectMapper = new ObjectMapper();

    private static final String CACHE_KEY = "f1_data";

    @Override
    public List<Question> generateQuestions(int count) throws QuestionGeneratorException {
        // Obtener datos actualizados de la API
        String f1Data = getF1DataFromCache();

        // Generar preguntas usando el LLM
        List<Question> questions = llmClient.generateQuestions(f1Data, count);

        // Validar y almacenar las preguntas
        return validateAndSaveQuestions(questions);
    }

    private String getF1DataFromCache() throws QuestionGeneratorException {
        Cache cache = cacheManager.getCache(CACHE_KEY);
        String data = cache.get("current_data", String.class);

        if (data == null) {
            try {
                // Obtener datos de la API en formato JSON
                String url = ergastApiBaseUrl + "/current/driverStandings.json";
                ResponseEntity<String> response = restTemplate.getForEntity(url, String.class);

                // Verificar que la respuesta tenga el formato correcto
                JsonNode rootNode = objectMapper.readTree(response.getBody());
                if (!rootNode.has("MRData") || !rootNode.path("MRData").has("StandingsTable")) {
                    throw new QuestionGeneratorException("Formato de respuesta inválido de la API");
                }

                data = response.getBody();
                cache.put("current_data", data);
            } catch (RestClientException | JsonProcessingException e) {
                throw new QuestionGeneratorException("Error al obtener datos de la API");
            }
        }

        return data;
    }

    private List<Question> validateAndSaveQuestions(List<Question> questions) {
        List<Question> validQuestions = new ArrayList<>();

        for (Question question : questions) {
            if (isValidQuestion(question)) {
                questionDao.save(question);
                validQuestions.add(question);
            }
        }

        return validQuestions;
    }

    private boolean isValidQuestion(Question question) {
        // Verificar que la pregunta no existe
        if (questionDao.existsByName(question.getName())) {
            return false;
        }

        // Verificar que tiene respuestas válidas
        if (question.getAnswers().size() < 2) {
            return false;
        }

        return true;
    }
}
