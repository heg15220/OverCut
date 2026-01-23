package overcut.model.services;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import overcut.model.entities.*;
import overcut.utils.TowerHintValueResolver;
import overcut.rest.dtos.*;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;

@Service
@Transactional
public class TowerGameServiceImpl implements TowerGameService {

    @Autowired private TowerGameDao gameDao;
    @Autowired private TowerAttemptDao attemptDao;
    @Autowired private CooldownService cooldownService;

    @Autowired private EntityManager entityManager; // ✅ NUEVO

    private static final String COOLDOWN_KEY = "Tower";

    private final ObjectMapper mapper = new ObjectMapper();
    private final HttpClient client = HttpClient.newHttpClient();


    @Override
    public Object getThemes() {
        try {
            HttpRequest req = HttpRequest.newBuilder()
                    .uri(URI.create("http://localhost:8000/tower-themes"))
                    .GET()
                    .build();

            HttpResponse<String> res = client.send(req, HttpResponse.BodyHandlers.ofString());
            if (res.statusCode() != 200) throw new RuntimeException("FastAPI error: " + res.body());

            return mapper.readTree(res.body());
        } catch (Exception e) {
            throw new RuntimeException("Error loading Tower themes", e);
        }
    }


    @Override
    public TowerGameDto startGame(String lang, String themeType, String themeKey, Long userId) {
        try {
            String url = "http://localhost:8000/generate-tower";

            if (themeType != null && !themeType.isBlank()) {
                url += "?themeType=" + URLEncoder.encode(themeType, StandardCharsets.UTF_8);
                if (themeKey != null && !themeKey.isBlank()) {
                    url += "&themeKey=" + URLEncoder.encode(themeKey, StandardCharsets.UTF_8);
                }
            }

            HttpRequest req = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .GET()
                    .build();

            HttpResponse<String> res = client.send(req, HttpResponse.BodyHandlers.ofString());
            if (res.statusCode() != 200) throw new RuntimeException("FastAPI error: " + res.body());

            JsonNode root = mapper.readTree(res.body());

            TowerGame game = new TowerGame();
            game.setCreatedAt(LocalDateTime.now());
            game.setLang(lang);
            game.setThemeType(root.get("themeType").asText());

            JsonNode keyNode = root.get("themeKey");
            game.setThemeKey(keyNode.isTextual() ? keyNode.asText() : keyNode.toString());

            game.setHintUsed(false);
            game.setAttempts(0);
            game.setFinished(false);

            TowerGame saved = gameDao.save(game);
            return TowerConversor.toGameDto(saved, List.of());

        } catch (Exception e) {
            throw new RuntimeException("Error starting Tower game", e);
        }
    }


    @Override
    public TowerGameDto guess(TowerGuessRequest req, Long userId) {
        try {
            TowerGame game = gameDao.findById(req.gameId).orElseThrow();

            if (attemptDao.existsByGame_IdAndDriverNameIgnoreCase(game.getId(), req.driverName)) {
                List<TowerAttempt> history = attemptDao.findByGame_IdOrderByCreatedAtAsc(game.getId());
                return TowerConversor.toGameDto(game, history);
            }

            var node = mapper.createObjectNode()
                    .put("themeType", game.getThemeType())
                    .put("driverName", req.driverName)
                    .put("driverId", req.driverId == null ? 0 : req.driverId);

            if ("decade".equals(game.getThemeType())) {
                node.set("themeKey", mapper.readTree(game.getThemeKey())); // ✅ objeto JSON
            } else {
                node.put("themeKey", game.getThemeKey());
            }

            String payload = node.toString();

            HttpRequest httpReq = HttpRequest.newBuilder()
                    .uri(URI.create("http://localhost:8000/validate-tower"))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(payload))
                    .build();

            HttpResponse<String> httpRes = client.send(httpReq, HttpResponse.BodyHandlers.ofString());
            if (httpRes.statusCode() != 200) throw new RuntimeException("FastAPI error: " + httpRes.body());

            JsonNode root = mapper.readTree(httpRes.body());
            boolean valid = root.get("valid").asBoolean();

            TowerAttempt a = new TowerAttempt();
            a.setGame(game);
            a.setDriverId(req.driverId);
            a.setDriverName(req.driverName);
            a.setValid(valid);
            attemptDao.save(a);

            game.setAttempts(game.getAttempts() + 1);
            gameDao.save(game);

            List<TowerAttempt> history = attemptDao.findByGame_IdOrderByCreatedAtAsc(game.getId());
            return TowerConversor.toGameDto(game, history);

        } catch (Exception e) {
            throw new RuntimeException("Error validating Tower guess", e);
        }
    }

    @Override
    public TowerHintResponse hint(Long gameId, Long userId) {
        try {
            TowerGame game = gameDao.findById(gameId).orElseThrow();
            TowerHintResponse res = new TowerHintResponse();

            // si ya se usó, devolvemos siempre lo mismo
            if (game.isHintUsed()) {
                res.ok = true;
                res.hintType = game.getThemeType();
                res.hintValue = fetchHintValueFromFastApi(game);
                return res;
            }

            if (game.getAttempts() < 15) {
                res.ok = false;
                res.hintType = null;
                res.hintValue = null;
                return res;
            }

            game.setHintUsed(true);
            gameDao.save(game);

            res.ok = true;
            res.hintType = game.getThemeType();
            res.hintValue = fetchHintValueFromFastApi(game);
            return res;

        } catch (Exception e) {
            throw new RuntimeException("Error resolving Tower hint", e);
        }
    }

    private String fetchHintValueFromFastApi(TowerGame game) {
        try {
            var node = mapper.createObjectNode()
                    .put("themeType", game.getThemeType());

            if ("decade".equals(game.getThemeType())) {
                // en BD guardas JSON string -> mandamos objeto JSON real
                node.set("themeKey", mapper.readTree(game.getThemeKey()));
            } else {
                node.put("themeKey", game.getThemeKey());
            }

            String payload = node.toString();

            HttpRequest req = HttpRequest.newBuilder()
                    .uri(URI.create("http://localhost:8000/tower-hint-value"))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(payload))
                    .build();

            HttpResponse<String> resp = client.send(req, HttpResponse.BodyHandlers.ofString());
            if (resp.statusCode() != 200) {
                throw new RuntimeException("FastAPI error: " + resp.body());
            }

            JsonNode root = mapper.readTree(resp.body());
            return root.has("hintValue") && !root.get("hintValue").isNull()
                    ? root.get("hintValue").asText()
                    : null;

        } catch (Exception e) {
            // fallback: si FastAPI falla, no rompas el juego
            return null;
        }
    }


    @Override
    public TowerGameDto getStatus(Long gameId, Long userId) {
        TowerGame game = gameDao.findById(gameId).orElseThrow();
        List<TowerAttempt> history = attemptDao.findByGame_IdOrderByCreatedAtAsc(gameId);
        return TowerConversor.toGameDto(game, history);
    }

    @Override
    public List<String> autocompletePilots(Long gameId, String query, Long userId) {
        try {
            String url = "http://localhost:8000/autocomplete-pilot?partial=" +
                    URLEncoder.encode(query, StandardCharsets.UTF_8);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .GET()
                    .build();

            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() != 200) {
                throw new RuntimeException("FastAPI error: " + response.body());
            }

            return Arrays.asList(mapper.readValue(response.body(), String[].class));

        } catch (Exception e) {
            throw new RuntimeException("Error al ejecutar autocomplete Tower", e);
        }
    }

    @Override
    public TowerGameDto answer(TowerAnswerRequest req, Long userId) {
        TowerGame game = gameDao.findById(req.gameId).orElseThrow();

        // si ya terminó, devolvemos estado
        if (game.isFinished()) {
            List<TowerAttempt> history = attemptDao.findByGame_IdOrderByCreatedAtAsc(game.getId());
            return TowerConversor.toGameDto(game, history);
        }

        boolean ok = isAnswerCorrect(game, req.themeType, req.themeKey);

        game.setFinished(true);
        game.setSolved(ok); // ✅ NUEVO
        gameDao.save(game);

        List<TowerAttempt> history = attemptDao.findByGame_IdOrderByCreatedAtAsc(game.getId());
        return TowerConversor.toGameDto(game, history);
    }

    private boolean isAnswerCorrect(TowerGame game, String themeType, String themeKey) {
        if (themeType == null) return false;

        // type debe coincidir
        if (!themeType.equals(game.getThemeType())) return false;

        // themes sin key (champions)
        if ("champions".equals(game.getThemeType())) {
            return "world_champions".equals(game.getThemeKey());
        }

        // decade: en BD guardas JSON string
        if ("decade".equals(game.getThemeType())) {
            try {
                // el frontend manda themeKey "1980s" / "1990s"
                JsonNode saved = mapper.readTree(game.getThemeKey()); // {"code":"1980s",...}
                String code = saved.has("code") ? saved.get("code").asText() : null;
                return code != null && code.equals(themeKey);
            } catch (Exception e) {
                return false;
            }
        }

        // resto: string exacta
        return themeKey != null && themeKey.equals(game.getThemeKey());
    }

}
