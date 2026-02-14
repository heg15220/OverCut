package overcut.model.services;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import overcut.model.entities.*;
import overcut.model.services.exceptions.CooldownException;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.*;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional
public class ThirtySecondsGameServiceImpl implements ThirtySecondsGameService {

    @Autowired private ThirtySecondsGameDao gameDao;
    @Autowired private ThirtySecondsAnswerDao answerDao;

    @Autowired private CooldownService cooldownService;

    private static final ObjectMapper mapper = new ObjectMapper();
    private static final String PYTHON_API_BASE = "http://localhost:8000";

    @Value("${fastapi.base-url:http://fastapi:8000}")
    private String fastapiBaseUrl;

    @Override
    public ThirtySecondsGame startGame(Long userId, String lang) {
        try {
            if (!cooldownService.canPlay("ThirtySeconds", userId)) {
                long wait = cooldownService.secondsUntilNextPlay("ThirtySeconds", userId);
                throw new CooldownException("WAIT", wait);
            }

            String url = fastapiBaseUrl + "/generate-30-seconds?lang=" +
                    URLEncoder.encode(lang, StandardCharsets.UTF_8);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .GET()
                    .timeout(Duration.ofSeconds(10))
                    .build();

            HttpClient client = HttpClient.newHttpClient();
            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
            JsonNode root = mapper.readTree(response.body());

            ThirtySecondsGame game = new ThirtySecondsGame();
            game.setThemeType(root.get("themeType").asText());
            game.setThemeValue(root.get("themeValue").asText());

            ThirtySecondsGame saved = gameDao.save(game);
            cooldownService.registerPlay("ThirtySeconds", userId);
            return saved;

        } catch (Exception e) {
            throw new RuntimeException("Error al iniciar ThirtySecondsGame", e);
        }
    }

    @Override
    public ThirtySecondsGame submitAnswers(Long gameId, List<String> answers) {
        try {
            ThirtySecondsGame game = gameDao.findById(gameId).orElseThrow();
            if (game.isFinished()) return game;

            long seconds = ChronoUnit.SECONDS.between(game.getCreatedAt(), LocalDateTime.now());
            // Backend “guarda-espaldas”: permite un pequeño margen (latencia usuario)
            if (seconds > 45) {
                game.setFinished(true);
                return gameDao.save(game);
            }

            // Limpieza: trim, no vacíos, únicos (case-insensitive)
            List<String> cleaned = answers == null ? List.of() :
                    answers.stream()
                            .filter(Objects::nonNull)
                            .map(String::trim)
                            .filter(s -> !s.isEmpty())
                            .collect(Collectors.toList());

            // Payload a FastAPI: valida la lista contra la temática
            Map<String, Object> payload = new HashMap<>();
            payload.put("themeType", game.getThemeType());
            payload.put("themeValue", game.getThemeValue());
            payload.put("answers", cleaned);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(fastapiBaseUrl + "/validate-30-seconds"))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(mapper.writeValueAsString(payload)))
                    .timeout(Duration.ofSeconds(20))
                    .build();

            HttpClient client = HttpClient.newHttpClient();
            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
            JsonNode root = mapper.readTree(response.body());

            // root: { results:[{answer:"", valid:true/false},...], correctCount:n }
            JsonNode results = root.get("results");
            int correctCount = root.get("correctCount").asInt();

            // Persistimos respuestas (como pairs en TwoTeams)
            game.getAnswers().clear();
            int order = 0;
            for (JsonNode r : results) {
                ThirtySecondsAnswer a = new ThirtySecondsAnswer();
                a.setGame(game);
                a.setAnswerText(r.get("answer").asText());
                a.setCorrect(r.get("valid").asBoolean());
                a.setAnswerOrder(order++);
                game.getAnswers().add(a);
            }

            game.setCorrectAnswers(correctCount);
            game.setTotalSubmitted(results.size());
            game.setFinished(true);

            return gameDao.save(game);

        } catch (Exception e) {
            throw new RuntimeException("Error al enviar respuestas ThirtySecondsGame", e);
        }
    }

    @Override
    public ThirtySecondsGame getGameStatus(Long gameId) {
        return gameDao.findById(gameId).orElseThrow();
    }

    @Override
    public List<String> autocompletePilotNames(String partial) {
        try {
            String url = String.format("%s/autocomplete-grid-pilot?partial=%s",
                    fastapiBaseUrl,
                    URLEncoder.encode(partial, StandardCharsets.UTF_8));

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .GET()
                    .timeout(Duration.ofSeconds(8))
                    .build();

            HttpClient client = HttpClient.newHttpClient();
            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());

            return mapper.readValue(
                    response.body(),
                    mapper.getTypeFactory().constructCollectionType(List.class, String.class)
            );
        } catch (Exception e) {
            throw new RuntimeException("Error en autocompletado de pilotos", e);
        }
    }
}
