package overcut.model.services;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import overcut.model.entities.*;
import overcut.model.services.exceptions.CooldownException;
import overcut.rest.dtos.WhoIsWhoGuessResponseDto;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.text.Normalizer;
import java.util.List;
import overcut.rest.dtos.WhoIsWhoGuessResponseDto;
@Service
@Transactional
public class WhoIsWhoGameServiceImpl implements WhoIsWhoGameService {

    @Autowired private WhoIsWhoGameDao gameDao;
    @Autowired private WhoIsWhoHintDao hintDao;

    @Autowired private CooldownService cooldownService;

    private static String norm(String s) {
        if (s == null) return "";
        String n = Normalizer.normalize(s, Normalizer.Form.NFD)
                .replaceAll("\\p{InCombiningDiacriticalMarks}+", "");
        n = n.toLowerCase().trim().replaceAll("\\s+", " ");
        return n;
    }

    @Override
    public WhoIsWhoGame startGame(String lang, Long userId) {
        try {
             if (!cooldownService.canPlay("WhoIsWho", userId)) {
                long wait = cooldownService.secondsUntilNextPlay("WhoIsWho", userId);
                throw new CooldownException("WAIT", wait);
            }

            HttpClient client = HttpClient.newHttpClient();
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("http://localhost:8000/generate-who-is-who?lang=" + lang))
                    .GET()
                    .build();

            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() != 200) {
                throw new RuntimeException("FastAPI server error: " + response.body());
            }

            ObjectMapper mapper = new ObjectMapper();
            JsonNode root = mapper.readTree(response.body());

            WhoIsWhoGame game = new WhoIsWhoGame();
            game.setLang(lang);
            game.setFinished(false);
            game.setWon(false);
            game.setHintsShown(0);
            game.setAttemptsUsed(0);

            game.setSecretDriverId(root.get("driverId").asLong());
            game.setSecretDriverName(root.get("driverName").asText());

            int order = 1;
            for (JsonNode hintNode : root.get("hints")) {
                WhoIsWhoHint h = new WhoIsWhoHint(order, hintNode.asText(), game);
                game.getHints().add(h);
                order++;
            }

            WhoIsWhoGame saved = gameDao.save(game);
            cooldownService.registerPlay("WhoIsWho", userId);
            return saved;

        } catch (CooldownException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException("Error calling FastAPI who-is-who generator", e);
        }
    }

    @Override
    public WhoIsWhoGame revealNextHint(Long gameId) {
        WhoIsWhoGame game = gameDao.findById(gameId).orElseThrow();

        if (game.isFinished()) return game;

        int total = game.getHints() != null ? game.getHints().size() : 0;
        if (game.getHintsShown() >= Math.min(game.getMaxHints(), total)) {
            return game;
        }

        game.setHintsShown(game.getHintsShown() + 1);
        return gameDao.save(game);
    }

    @Override
    public WhoIsWhoGuessResponseDto guess(Long gameId, String guess) {
        WhoIsWhoGame game = gameDao.findById(gameId).orElseThrow();

        if (game.isFinished()) {
            int left = Math.max(0, game.getMaxAttempts() - game.getAttemptsUsed());
            return new WhoIsWhoGuessResponseDto(false, true, game.isWon(), game.getAttemptsUsed(), left, null);
        }

        // consume attempt
        game.setAttemptsUsed(game.getAttemptsUsed() + 1);

        boolean correct = norm(guess).equals(norm(game.getSecretDriverName()));
        if (correct) {
            game.setWon(true);
            game.setFinished(true);
        } else if (game.getAttemptsUsed() >= game.getMaxAttempts()) {
            game.setFinished(true);
            game.setWon(false);
        }

        gameDao.save(game);

        int left = Math.max(0, game.getMaxAttempts() - game.getAttemptsUsed());

        String answer = game.isFinished() ? game.getSecretDriverName() : null;
        WhoIsWhoGuessResponseDto dto =
            new WhoIsWhoGuessResponseDto(correct, game.isFinished(), game.isWon(), game.getAttemptsUsed(), left, null);
        dto.setAnswerFullName(answer);
        return dto;

    }

    @Override
    public WhoIsWhoGame revealAnswer(Long gameId) {
        WhoIsWhoGame game = gameDao.findById(gameId).orElseThrow();
        game.setFinished(true);
        return gameDao.save(game);
    }

    @Override
    public List<String> autocomplete(String partial) {
    try {
        if (partial == null) partial = "";
        String q = java.net.URLEncoder.encode(partial, java.nio.charset.StandardCharsets.UTF_8);

        HttpClient client = HttpClient.newHttpClient();
        HttpRequest request = HttpRequest.newBuilder()
            .uri(URI.create("http://localhost:8000/autocomplete-pilot?partial=" + q))
            .GET()
            .build();

        HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() != 200) {
            throw new RuntimeException("FastAPI autocomplete error: " + response.body());
        }

        ObjectMapper mapper = new ObjectMapper();
        return mapper.readValue(response.body(),
            mapper.getTypeFactory().constructCollectionType(java.util.List.class, String.class));

    } catch (Exception e) {
        throw new RuntimeException("Error calling FastAPI autocomplete-pilot", e);
    }
}

@Override
public WhoIsWhoGame getGame(Long gameId) {
    return gameDao.findById(gameId).orElseThrow();
}


}
