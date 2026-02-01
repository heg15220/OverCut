package overcut.model.services;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import overcut.model.entities.*;
import overcut.model.services.exceptions.CooldownException;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.*;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.*;

@Service
@Transactional
public class TeamNationalityGameServiceImpl implements TeamNationalityGameService {

    @Autowired private TeamNationalityGameDao gameDao;
    @Autowired private TeamNationalityAnswerDao answerDao;
    @Autowired private CooldownService cooldownService;

    private static final ObjectMapper mapper = new ObjectMapper();
    private static final String PYTHON_API_BASE = "http://localhost:8000";

    @Override
    public TeamNationalityGame startGame(Long userId, String lang) {
        try {
         /*   if (!cooldownService.canPlay("TeamNationality", userId)) {
                long wait = cooldownService.secondsUntilNextPlay("TeamNationality", userId);
                throw new CooldownException("WAIT", wait);
            }
*/
            String url = PYTHON_API_BASE + "/generate-team-nationality?lang=" +
                    URLEncoder.encode(lang, StandardCharsets.UTF_8);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .GET()
                    .timeout(Duration.ofSeconds(10))
                    .build();

            HttpResponse<String> response = HttpClient.newHttpClient()
                    .send(request, HttpResponse.BodyHandlers.ofString());

            JsonNode root = mapper.readTree(response.body());

            TeamNationalityGame game = new TeamNationalityGame();
            game.setTeamName(root.get("teamName").asText());
            game.setNationality(root.get("nationality").asText());
            game.setCountryCode(root.get("countryCode").asText());
            game.setMaxAnswers(root.has("maxAnswers") ? root.get("maxAnswers").asInt() : 30);

            TeamNationalityGame saved = gameDao.save(game);
           // cooldownService.registerPlay("TeamNationality", userId);
            return saved;

        } catch (Exception e) {
            throw new RuntimeException("Error al iniciar TeamNationalityGame", e);
        }
    }

    @Override
    public TeamNationalityGame guessDriver(Long gameId, String driverName) {
        try {
            TeamNationalityGame game = gameDao.findById(gameId).orElseThrow();
            if (game.isFinished()) return game;

            // límite 30
            if (game.getCorrectAnswers() >= game.getMaxAnswers()) {
                game.setFinished(true);
                return gameDao.save(game);
            }

            String cleaned = (driverName == null ? "" : driverName.trim());
            if (cleaned.isEmpty()) return game;

            // evitar repetidos (por driverName en respuestas ya guardadas)
            List<TeamNationalityAnswer> existing = answerDao.findByGameIdOrderByAnswerOrderAsc(gameId);
            String key = cleaned.toLowerCase();
            for (TeamNationalityAnswer a : existing) {
                if (a.getDriverName() != null && a.getDriverName().toLowerCase().equals(key)) {
                    return game; // ya estaba
                }
            }

            Map<String, Object> payload = new HashMap<>();
            payload.put("teamName", game.getTeamName());
            payload.put("nationality", game.getNationality());
            payload.put("driverName", cleaned);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(PYTHON_API_BASE + "/validate-team-nationality"))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(mapper.writeValueAsString(payload)))
                    .timeout(Duration.ofSeconds(10))
                    .build();

            HttpResponse<String> response = HttpClient.newHttpClient()
                    .send(request, HttpResponse.BodyHandlers.ofString());

            JsonNode root = mapper.readTree(response.body());
            boolean valid = root.get("valid").asBoolean();

            game.setTotalSubmitted(game.getTotalSubmitted() + 1);

            if (valid) {
                long driverId = root.get("driverId").asLong();
                String canonicalName = root.get("driverName").asText();

                // evitar repetidos por driverId
                for (TeamNationalityAnswer a : existing) {
                    if (a.getDriverId() != null && a.getDriverId().equals(driverId)) {
                        return game;
                    }
                }

                TeamNationalityAnswer ans = new TeamNationalityAnswer();
                ans.setGame(game);
                ans.setDriverId(driverId);
                ans.setDriverName(canonicalName);
                ans.setAnswerOrder(existing.size());

                game.getAnswers().add(ans);

                game.setCorrectAnswers(game.getCorrectAnswers() + 1);

                if (game.getCorrectAnswers() >= game.getMaxAnswers()) {
                    game.setFinished(true);
                }

                return gameDao.save(game);
            }

            // si es inválido, simplemente devolvemos game actualizado en totalSubmitted
            return gameDao.save(game);

        } catch (Exception e) {
            throw new RuntimeException("Error en guessDriver TeamNationalityGame", e);
        }
    }

    @Override
    public TeamNationalityGame getGameStatus(Long gameId) {
        return gameDao.findById(gameId).orElseThrow();
    }

    @Override
    public List<String> autocompletePilotNames(String partial) {
        try {
            String url = String.format("%s/autocomplete-grid-pilot?partial=%s",
                    PYTHON_API_BASE,
                    URLEncoder.encode(partial, StandardCharsets.UTF_8));

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .GET()
                    .timeout(Duration.ofSeconds(8))
                    .build();

            HttpResponse<String> response = HttpClient.newHttpClient()
                    .send(request, HttpResponse.BodyHandlers.ofString());

            return mapper.readValue(
                    response.body(),
                    mapper.getTypeFactory().constructCollectionType(List.class, String.class)
            );
        } catch (Exception e) {
            throw new RuntimeException("Error en autocompletado de pilotos", e);
        }
    }
}
