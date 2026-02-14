package overcut.model.services;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import overcut.model.entities.F1AnagramsAttempt;
import overcut.model.entities.F1AnagramsGame;
import overcut.model.entities.F1AnagramsGameDao;
import overcut.model.entities.F1AnagramsRound;
import overcut.model.services.CooldownService;
import overcut.model.services.F1AnagramsGameService;
import overcut.model.services.exceptions.CooldownException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.text.Normalizer;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Locale;

@Service
@Transactional
public class F1AnagramsGameServiceImpl implements F1AnagramsGameService {

    private static final int MAX_ATTEMPTS_PER_ROUND = 5;
    private static final int TOTAL_ROUNDS = 6;

    @Autowired
    private F1AnagramsGameDao gameDao;
    @Autowired private CooldownService cooldownService;

    @Value("${fastapi.base-url:http://fastapi:8000}")
    private String fastapiBaseUrl;


    @Override
    public F1AnagramsGame startGame(Long userId) {
        try {
            if (!cooldownService.canPlay("Anagrams", userId)) {
                long wait = cooldownService.secondsUntilNextPlay("Anagrams", userId);
                throw new CooldownException("WAIT", wait);
            }

            HttpClient client = HttpClient.newHttpClient();
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(fastapiBaseUrl + "/generate-f1-anagrams"))
                    .GET()
                    .build();

            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() != 200) {
                throw new RuntimeException("FastAPI error: " + response.body());
            }

            ObjectMapper mapper = new ObjectMapper();
            JsonNode root = mapper.readTree(response.body());

            JsonNode drivers = root.get("drivers");
            if (drivers == null || !drivers.isArray() || drivers.size() != TOTAL_ROUNDS) {
                throw new RuntimeException("FastAPI debe devolver { drivers: [..6..] }");
            }

            F1AnagramsGame game = new F1AnagramsGame();
            game.setUserId(userId);
            game.setCurrentRound(0);

            for (int i = 0; i < drivers.size(); i++) {
                Long driverId = drivers.get(i).get("driverId").asLong();
                String surname = drivers.get(i).get("surname").asText();

                F1AnagramsRound round = new F1AnagramsRound();
                round.setGame(game);
                round.setRoundOrder(i);
                round.setDriverId(driverId);
                round.setSurname(surname);
                round.setScrambled(scrambleSurname(surname));

                game.getRounds().add(round);
            }

            F1AnagramsGame saved = gameDao.save(game);
          cooldownService.registerPlay("Anagrams", userId);
            return saved;

        } catch (CooldownException ce) {
            throw ce;
        } catch (Exception e) {
            throw new RuntimeException("Error iniciando AnagramsGame", e);
        }
    }

    @Override
    public F1AnagramsGame makeGuess(Long gameId, String guess) {
        F1AnagramsGame game = gameDao.findById(gameId).orElseThrow();
        if (game.isFinished()) return game;

        int idx = game.getCurrentRound();
        if (idx < 0 || idx >= TOTAL_ROUNDS) {
            game.setFinished(true);
            game.setSuccessful(false);
            return gameDao.save(game);
        }

        // buscar ronda activa por roundOrder
        F1AnagramsRound round = game.getRounds().stream()
                .filter(r -> r.getRoundOrder() == idx)
                .findFirst()
                .orElseThrow();

        // si ronda ya cerrada por lo que sea, avanza
        if (round.isFinished()) {
            advanceRoundOrFinish(game);
            return gameDao.save(game);
        }

        String actual = normalizeLettersOnly(round.getSurname());
        String input  = normalizeLettersOnly(guess);
        boolean correct = actual.equals(input);

        F1AnagramsAttempt attempt = new F1AnagramsAttempt();
        attempt.setRound(round);
        attempt.setGuess(guess);
        attempt.setAttemptOrder(round.getAttempts().size());
        attempt.setCorrect(correct);

        round.getAttempts().add(attempt);

        // cerrar ronda si acierta o llega a 5 intentos
        if (correct || round.getAttempts().size() >= MAX_ATTEMPTS_PER_ROUND) {
            round.setFinished(true);
            round.setSuccessful(correct);
            advanceRoundOrFinish(game);
        }

        return gameDao.save(game);
    }

    @Override
    public F1AnagramsGame getGameStatus(Long gameId) {
        return gameDao.findById(gameId).orElseThrow();
    }

    // -------------------------
    // Helpers
    // -------------------------

    private void advanceRoundOrFinish(F1AnagramsGame game) {
        int next = game.getCurrentRound() + 1;
        game.setCurrentRound(next);

        if (next >= TOTAL_ROUNDS) {
            game.setFinished(true);
            // ✅ partida “ganada” si acierta las 6 rondas
            boolean allSolved = game.getRounds().stream()
                    .allMatch(r -> Boolean.TRUE.equals(r.getSuccessful()));
            game.setSuccessful(allSolved);
        }
    }

    private String normalizeLettersOnly(String s) {
        if (s == null) return "";
        String n = Normalizer.normalize(s, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "");
        n = n.toUpperCase(Locale.ROOT);
        n = n.replaceAll("[^A-Z]", "");
        return n;
    }

    private String scrambleSurname(String surname) {
        String base = normalizeLettersOnly(surname);
        if (base.length() <= 1) return base;

        List<Character> chars = new ArrayList<>();
        for (char c : base.toCharArray()) chars.add(c);

        String scrambled = base;
        int tries = 0;
        while (scrambled.equals(base) && tries < 25) {
            Collections.shuffle(chars);
            StringBuilder sb = new StringBuilder();
            for (char c : chars) sb.append(c);
            scrambled = sb.toString();
            tries++;
        }
        return scrambled;
    }
}
