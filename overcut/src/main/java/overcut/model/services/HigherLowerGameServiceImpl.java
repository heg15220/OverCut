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
import java.time.LocalDateTime;

@Service
@Transactional
public class HigherLowerGameServiceImpl implements HigherLowerGameService {

    @Autowired private HigherLowerGameDao gameDao;
    @Autowired private CooldownService cooldownService;

    @Override
    public HigherLowerGame startGame(String lang, Long userId) {
        try {
            if (!cooldownService.canPlay("HigherLower", userId)) {
                long wait = cooldownService.secondsUntilNextPlay("HigherLower", userId);
                throw new CooldownException("WAIT", wait);
            }

            HttpClient client = HttpClient.newHttpClient();
            HttpRequest req = HttpRequest.newBuilder()
                    .uri(URI.create("http://localhost:8000/generate-higher-lower?lang=" + lang))
                    .GET().build();

            HttpResponse<String> res = client.send(req, HttpResponse.BodyHandlers.ofString());
            if (res.statusCode() != 200) throw new RuntimeException("FastAPI error: " + res.body());

            ObjectMapper mapper = new ObjectMapper();
            JsonNode root = mapper.readTree(res.body());
            if (root.has("error")) throw new RuntimeException(root.get("error").asText());

            HigherLowerGame game = new HigherLowerGame();
            game.setCreatedAt(LocalDateTime.now());
            game.setStatCode(root.get("statCode").asText());
            game.setThemeDescription(root.get("themeDescription").asText());
            game.setFinished(false);
            game.setWon(null);
            game.setCurrentIndex(0);
            game.setScore(0);

            int idx = 0;
            for (JsonNode n : root.get("drivers")) {
                HigherLowerEntry e = new HigherLowerEntry();
                e.setGame(game);
                e.setPositionIndex(idx++);
                e.setPilotName(n.get("pilotName").asText());
                e.setStatValue(n.get("value").asDouble());
                game.getEntries().add(e);
            }

            HigherLowerGame saved = gameDao.save(game);
           cooldownService.registerPlay("HigherLower", userId);
            return saved;

        } catch (CooldownException ce) {
            throw ce;
        } catch (Exception e) {
            throw new RuntimeException("Error calling FastAPI HigherLower generator", e);
        }
    }

    @Override
    public HigherLowerGame guess(Long gameId, String direction) {
        HigherLowerGame game = gameDao.findById(gameId).orElseThrow();
        if (game.isFinished()) return game;

        int i = game.getCurrentIndex();
        if (i >= game.getEntries().size() - 1) {
            game.setFinished(true);
            game.setWon(true);
            return gameDao.save(game);
        }

        double current = game.getEntries().get(i).getStatValue();
        double next = game.getEntries().get(i + 1).getStatValue();

        boolean correct;
        if ("higher".equalsIgnoreCase(direction)) {
            correct = next >= current; // ✅ empate cuenta como correcto
        } else if ("lower".equalsIgnoreCase(direction)) {
            correct = next <= current; // ✅ empate cuenta como correcto
        } else {
            throw new IllegalArgumentException("direction must be higher|lower");
        }

        if (correct) {
            game.setScore(game.getScore() + 1);
            game.setCurrentIndex(i + 1);

            if (game.getCurrentIndex() >= game.getEntries().size() - 1) {
                game.setFinished(true);
                game.setWon(true);
            }
        } else {
            game.setFinished(true);
            game.setWon(false);
        }

        return gameDao.save(game);
    }

    @Override
    public HigherLowerGame getGameStatus(Long gameId) {
        return gameDao.findById(gameId).orElseThrow();
    }
}
