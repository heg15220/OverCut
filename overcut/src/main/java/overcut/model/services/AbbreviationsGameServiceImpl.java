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
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional
public class AbbreviationsGameServiceImpl implements AbbreviationsGameService {

    @Autowired private AbbreviationsGameDao gameDao;
    @Autowired private AbbreviationsAnswerDao answerDao;

    @Autowired private CooldownService cooldownService;

    private static final ObjectMapper mapper = new ObjectMapper();
    private static final String PYTHON_API_BASE = "http://localhost:8000";

    private static String norm(String s) {
        return (s == null ? "" : s.trim().toLowerCase());
    }

    @Override
    public AbbreviationsGame startGame(Long userId, String lang) {
        try {
            if (!cooldownService.canPlay("Abbreviations", userId)) {
                long wait = cooldownService.secondsUntilNextPlay("Abbreviations", userId);
                throw new CooldownException("WAIT", wait);
            }

            String url = PYTHON_API_BASE + "/generate-abbreviations?lang=" +
                    URLEncoder.encode(lang, StandardCharsets.UTF_8);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .GET()
                    .timeout(Duration.ofSeconds(12))
                    .build();

            HttpClient client = HttpClient.newHttpClient();
            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
            JsonNode root = mapper.readTree(response.body());

            JsonNode drivers = root.get("drivers");
            if (drivers == null || !drivers.isArray() || drivers.size() == 0) {
                throw new RuntimeException("No se pudo generar el pool de abreviaturas");
            }

            AbbreviationsGame game = new AbbreviationsGame();
            AbbreviationsGame saved = gameDao.save(game);

            int order = 0;
            for (JsonNode d : drivers) {
                AbbreviationsAnswer a = new AbbreviationsAnswer();
                a.setGame(saved);
                a.setDriverId(d.get("driverId").asLong());
                a.setDriverName(d.get("driverName").asText());
                a.setAbbr(d.get("abbr").asText());
                a.setSolved(false);
                a.setAnswerOrder(order++);
                saved.getAnswers().add(a);
            }

            saved = gameDao.save(saved);
            cooldownService.registerPlay("Abbreviations", userId);
            return saved;

        } catch (CooldownException ce) {
            throw ce;
        } catch (Exception e) {
            throw new RuntimeException("Error al iniciar AbbreviationsGame", e);
        }
    }

    @Override
    public AbbreviationsGame guess(Long gameId, String guessText) {
        AbbreviationsGame game = gameDao.findById(gameId).orElseThrow();

        if (game.isFinished()) return game;

        String g = norm(guessText);
        if (g.isEmpty()) return game;

        game.setTotalSubmitted(game.getTotalSubmitted() + 1);

        // Match: si el nombre coincide con uno de los 20 y no estaba resuelto
        Optional<AbbreviationsAnswer> hit = game.getAnswers().stream()
                .filter(a -> !a.isSolved())
                .filter(a -> norm(a.getDriverName()).equals(g))
                .findFirst();

        if (hit.isPresent()) {
            AbbreviationsAnswer a = hit.get();
            a.setSolved(true);
            a.setSolvedAt(LocalDateTime.now());
            game.setCorrectAnswers(game.getCorrectAnswers() + 1);
        }

        // Termina cuando estén los 20 resueltos
        boolean allSolved = game.getAnswers().stream().allMatch(AbbreviationsAnswer::isSolved);
        if (allSolved) game.setFinished(true);

        return gameDao.save(game);
    }

    @Override
    public AbbreviationsGame getGameStatus(Long gameId) {
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
