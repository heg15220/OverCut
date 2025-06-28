package overcut.model.services;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import overcut.model.entities.*;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import overcut.model.services.exceptions.CooldownException;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.text.Normalizer;
import java.util.HashSet;
import java.util.Set;

@Service
@Transactional
public class F1WordleGameServiceImpl implements F1WordleGameService {

    @Autowired
    private F1WordleGameDao gameDao;

    @Autowired
    private F1WordleAttemptDao attemptDao;

    @Autowired
    private CooldownService cooldownService;

    @Autowired
    private UserDao userDao;


    @Override
    public F1WordleGame startGame(Long userId) {
        try {
            if (!cooldownService.canPlay("F1Wordle", userId)) {
                long wait = cooldownService.secondsUntilNextPlay("F1Wordle", userId);
                throw new CooldownException("WAIT", wait);
            }

            HttpClient client = HttpClient.newHttpClient();
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("http://localhost:8000/generate-f1-wordle"))
                    .GET()
                    .build();

            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() != 200) {
                throw new RuntimeException("FastAPI error: " + response.body());
            }

            ObjectMapper mapper = new ObjectMapper();
            JsonNode result = mapper.readTree(response.body());

            F1WordleGame game = new F1WordleGame();
            game.setDriverId(result.get("driverId").asLong());
            game.setSurname(result.get("surname").asText());

            F1WordleGame f1WordleGame = gameDao.save(game);
            cooldownService.registerPlay("F1Wordle", userId);
            return f1WordleGame;

        } catch (Exception e) {
            throw new RuntimeException("Error iniciando F1WordleGame", e);
        }
    }

    private String normalize(String s) {
        return Normalizer.normalize(s, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .toLowerCase();
    }


    @Override
    public F1WordleGame makeGuess(Long gameId, String guess) {
        F1WordleGame game = gameDao.findById(gameId).orElseThrow();
        if (game.isFinished()) return game;

        String actual = normalize(game.getSurname());
        String input = normalize(guess);

        StringBuilder feedback = new StringBuilder();
        Set<Integer> matchedIndices = new HashSet<>();

        // 1. Verde
        for (int i = 0; i < actual.length(); i++) {
            if (i < input.length() && input.charAt(i) == actual.charAt(i)) {
                feedback.append("g");
                matchedIndices.add(i);
            } else {
                feedback.append("_");
            }
        }

        // 2. Amarillo
        for (int i = 0; i < actual.length(); i++) {
            if (feedback.charAt(i) == '_' && i < input.length()) {
                char c = input.charAt(i);
                for (int j = 0; j < actual.length(); j++) {
                    if (!matchedIndices.contains(j) && actual.charAt(j) == c) {
                        feedback.setCharAt(i, 'y');
                        matchedIndices.add(j);
                        break;
                    }
                }
            }
        }

        F1WordleAttempt attempt = new F1WordleAttempt();
        attempt.setGame(game);
        attempt.setGuess(guess);
        attempt.setAttemptOrder(game.getAttempts().size());
        attempt.setFeedback(feedback.toString());

        game.getAttempts().add(attempt);
        if (guess.equalsIgnoreCase(game.getSurname()) || game.getAttempts().size() >= 6) {
            game.setFinished(true);
            game.setSuccessful(guess.equalsIgnoreCase(game.getSurname()));
        }

        return gameDao.save(game);
    }

    @Override
    public F1WordleGame getGameStatus(Long gameId) {
        return gameDao.findById(gameId).orElseThrow();
    }
}

