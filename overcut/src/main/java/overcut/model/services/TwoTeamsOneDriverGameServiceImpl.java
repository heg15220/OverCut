package overcut.model.services;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import overcut.model.entities.*;
import overcut.model.services.exceptions.CooldownException;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional
public class TwoTeamsOneDriverGameServiceImpl implements TwoTeamsOneDriverGameService {

    @Autowired
    private TwoTeamsOneDriverGameDao gameDao;

    @Autowired
    private TwoTeamsOneDriverPairDao pairDao;

    @Autowired
    private CooldownService cooldownService;

    @Autowired
    private UserDao userDao;


    private static final ObjectMapper mapper = new ObjectMapper();
    private static final String PYTHON_API_BASE = "http://localhost:8000";

    @Override
    public TwoTeamsOneDriverGame startGame(Long userId) {
        try {
            if (!cooldownService.canPlay("TwoTeams", userId)) {
                long wait = cooldownService.secondsUntilNextPlay("TwoTeams", userId);
                throw new CooldownException("WAIT", wait);
            }

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(PYTHON_API_BASE + "/generate-two-teams-one-driver"))
                    .GET()
                    .build();

            HttpClient client = HttpClient.newHttpClient();
            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());

            JsonNode root = mapper.readTree(response.body());
            TwoTeamsOneDriverGame game = new TwoTeamsOneDriverGame();

            for (JsonNode pairNode : root) {
                TwoTeamsOneDriverPair pair = new TwoTeamsOneDriverPair();
                pair.setGame(game);
                pair.setTeamA(pairNode.get("teamA").asText());
                pair.setTeamB(pairNode.get("teamB").asText());
                pair.setPairOrder(pairNode.get("pairOrder").asInt());

                List<String> validDrivers = new ArrayList<>();
                for (JsonNode driverNode : pairNode.get("validDrivers")) {
                    validDrivers.add(driverNode.asText().toLowerCase());
                }

                pair.setGuessedDriverName(null);
                pair.setGuessedCorrectly(null);
                game.getPairs().add(pair);
            }

            TwoTeamsOneDriverGame twoTeamsOneDriverGame = gameDao.save(game);
            cooldownService.registerPlay("TwoTeams", userId);
            return twoTeamsOneDriverGame;

        } catch (Exception e) {
            throw new RuntimeException("Error al iniciar TwoTeamsOneDriverGame", e);
        }
    }

    private boolean hasDrivenForBothTeams(String driverGuess, String teamA, String teamB) {
        try {
            String url = String.format("%s/validate-two-teams-driver?driver=%s&teamA=%s&teamB=%s",
                    PYTHON_API_BASE,
                    URLEncoder.encode(driverGuess, StandardCharsets.UTF_8),
                    URLEncoder.encode(teamA, StandardCharsets.UTF_8),
                    URLEncoder.encode(teamB, StandardCharsets.UTF_8));

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .GET()
                    .build();

            HttpClient client = HttpClient.newHttpClient();
            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());

            JsonNode json = mapper.readTree(response.body());
            return json.get("valid").asBoolean();
        } catch (Exception e) {
            throw new RuntimeException("Error al validar piloto con backend Python", e);
        }
    }



    @Override
    public TwoTeamsOneDriverGame guessDriver(Long gameId, String driverGuess) {
        TwoTeamsOneDriverGame game = gameDao.findById(gameId).orElseThrow();
        if (game.isFinished()) return game;

        int index = game.getCurrentPairIndex();
        TwoTeamsOneDriverPair pair = game.getPairs().stream()
                .filter(p -> p.getPairOrder() == index)
                .findFirst()
                .orElseThrow();

        String teamA = pair.getTeamA();
        String teamB = pair.getTeamB();

        boolean valid = hasDrivenForBothTeams(driverGuess, teamA, teamB);
        pair.setGuessedDriverName(driverGuess);
        pair.setGuessedCorrectly(valid);

        if (valid) {
            game.setCorrectAnswers(game.getCorrectAnswers() + 1);
        }

        if (index >= 9) {
            game.setFinished(true);
        } else {
            game.setCurrentPairIndex(index + 1);
        }

        return gameDao.save(game);
    }


    @Override
    public TwoTeamsOneDriverGame skipPair(Long gameId) {
        TwoTeamsOneDriverGame game = gameDao.findById(gameId).orElseThrow();
        if (game.isFinished()) return game;

        int index = game.getCurrentPairIndex();
        TwoTeamsOneDriverPair pair = game.getPairs().stream()
                .filter(p -> p.getPairOrder() == index)
                .findFirst()
                .orElseThrow();

        pair.setGuessedCorrectly(false);
        pair.setGuessedDriverName("SKIPPED");

        if (index >= 9) {
            game.setFinished(true);
        } else {
            game.setCurrentPairIndex(index + 1);
        }

        return gameDao.save(game);
    }

    @Override
    public TwoTeamsOneDriverGame getGameStatus(Long gameId) {
        return gameDao.findById(gameId).orElseThrow();
    }

    @Override
    public List<String> autocompletePilotNames(String partial) {
        try {
            String url = String.format("http://localhost:8000/autocomplete-grid-pilot?partial=%s",
                    URLEncoder.encode(partial, StandardCharsets.UTF_8));

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .GET()
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

