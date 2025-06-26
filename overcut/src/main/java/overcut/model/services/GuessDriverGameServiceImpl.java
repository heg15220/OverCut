package overcut.model.services;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import overcut.model.entities.*;
import overcut.model.services.exceptions.CooldownException;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.*;

@Service
@Transactional
public class GuessDriverGameServiceImpl implements GuessDriverGameService {

    @Autowired
    private GuessDriverGameDao gameDao;

    @Autowired
    private GuessDriverQuestionDao questionDao;

    @Autowired
    private CooldownService cooldownService;

    @Autowired
    private UserDao userDao;


    private final HttpClient client = HttpClient.newHttpClient();
    private final ObjectMapper mapper = new ObjectMapper();

    @Override
    public GuessDriverGame startGame(Long userId) {
        try {
            if (!cooldownService.canPlay("GuessDriver", userId)) {
                long wait = cooldownService.secondsUntilNextPlay("GuessDriver", userId);
                throw new CooldownException("WAIT", wait);
            }
            cooldownService.registerPlay("GuessDriver", userId);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("http://localhost:8000/generate-guess-driver"))
                    .GET()
                    .build();

            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() != 200) {
                throw new RuntimeException("FastAPI error: " + response.body());
            }

            JsonNode root = mapper.readTree(response.body());

            if (!root.has("driverId") || !root.has("name")) {
                throw new RuntimeException("Respuesta inválida de FastAPI: " + response.body());
            }

            Long driverId = root.get("driverId").asLong();
            String driverName = root.get("name").asText();


            GuessDriverGame game = new GuessDriverGame();
            game.setDriverId(driverId);
            game.setDriverName(driverName);
            return gameDao.save(game);

        } catch (Exception e) {
            throw new RuntimeException("Error al iniciar partida Guess the Driver", e);
        }
    }

    @Override
    public GuessDriverQuestion askQuestion(Long gameId, String category, String value, String lang) {
        GuessDriverGame game = gameDao.findById(gameId)
                .orElseThrow(() -> new RuntimeException("Game not found"));

        if (game.isFinished()) {
            throw new IllegalStateException("Game is already finished");
        }

        try {
            String url = String.format("http://localhost:8000/validate-guess-question?driverId=%d&category=%s%s&lang=%s",
                    game.getDriverId(),
                    category,
                    value != null ? "&value=" + value : "",
                    lang);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .GET()
                    .build();

            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() != 200) {
                throw new RuntimeException("FastAPI error: " + response.body());
            }

            JsonNode root = mapper.readTree(response.body());
            boolean isCorrect = root.get("isCorrect").asBoolean();
            String questionText = root.get("question").asText();

            GuessDriverQuestion question = new GuessDriverQuestion();
            question.setGame(game);
            question.setCategory(category);
            question.setValueUser(value);
            question.setCorrect(isCorrect);
            question.setQuestion(questionText);
            questionDao.save(question);

            game.getQuestions().add(question);
            game.setQuestionCount(game.getQuestionCount() + 1);

            if (game.getQuestionCount() >= 10) {
                game.setFinished(true);
                game.setSuccessful(false);
            }

            gameDao.save(game);
            return question;

        } catch (Exception e) {
            throw new RuntimeException("Error al validar pregunta con FastAPI", e);
        }
    }

    @Override
    public GuessDriverGame guessPilot(Long gameId, String guessedName) {
        GuessDriverGame game = gameDao.findById(gameId)
                .orElseThrow(() -> new RuntimeException("Game not found"));

        if (game.isFinished() && Boolean.TRUE.equals(game.getSuccessful())) {
            throw new IllegalStateException("Game is already finished and successful");
        }

        boolean isSuccess = guessedName.trim().equalsIgnoreCase(game.getDriverName().trim());

        game.setFinished(true);
        game.setSuccessful(isSuccess);

        return gameDao.save(game);
    }

    @Override
    public GuessDriverGame getGameStatus(Long gameId) {
        return gameDao.findById(gameId)
                .orElseThrow(() -> new RuntimeException("Game not found"));
    }

    @Override
    public List<String> getRecommendations(String category, String lang) {
        try {
            String url = String.format("http://localhost:8000/recommend-guess-values?category=%s&lang=%s", category, lang);
            HttpRequest request = HttpRequest.newBuilder().uri(URI.create(url)).GET().build();

            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() != 200) {
                throw new RuntimeException("FastAPI error: " + response.body());
            }

            return Arrays.asList(mapper.readValue(response.body(), String[].class));
        } catch (Exception e) {
            throw new RuntimeException("Error al obtener recomendaciones para categoría: " + category, e);
        }
    }

    @Override
    public List<String> autocompletePilotNames(String partial) {
        try {
            String url = String.format("http://localhost:8000/autocomplete-pilot?partial=%s", partial);
            HttpRequest request = HttpRequest.newBuilder().uri(URI.create(url)).GET().build();

            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() != 200) {
                throw new RuntimeException("FastAPI error: " + response.body());
            }

            return Arrays.asList(mapper.readValue(response.body(), String[].class));
        } catch (Exception e) {
            throw new RuntimeException("Error en recomendación de pilotos: " + e.getMessage(), e);
        }
    }
}
