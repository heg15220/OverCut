package overcut.model.services;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import overcut.model.entities.F1WordleAttempt;
import overcut.model.entities.F1WordleAttemptDao;
import overcut.model.entities.F1WordleGame;
import overcut.model.entities.F1WordleGameDao;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.util.HashSet;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@Transactional
public class F1WordleGameServiceImpl implements F1WordleGameService {

    @Autowired
    private F1WordleGameDao gameDao;

    @Autowired
    private F1WordleAttemptDao attemptDao;

    @Override
    public F1WordleGame startGame() {
        try {
            ProcessBuilder pb = new ProcessBuilder("python",
                    "src/main/resources/scripts/select_wordle_driver.py");
            Process process = pb.start();
            BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()));
            String jsonOutput = reader.lines().collect(Collectors.joining());
            process.waitFor();

            ObjectMapper mapper = new ObjectMapper();
            JsonNode result = mapper.readTree(jsonOutput);

            F1WordleGame game = new F1WordleGame();
            game.setDriverId(result.get("driverId").asLong());
            game.setSurname(result.get("surname").asText());

            return gameDao.save(game);
        } catch (Exception e) {
            throw new RuntimeException("Error iniciando F1WordleGame", e);
        }
    }


    @Override
    public F1WordleGame makeGuess(Long gameId, String guess) {
        F1WordleGame game = gameDao.findById(gameId).orElseThrow();
        if (game.isFinished()) return game;

        String actual = game.getSurname().toLowerCase();
        String input = guess.toLowerCase();

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

