package overcut.model.services;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import overcut.model.entities.*;
import jakarta.transaction.Transactional;
import java.net.URI;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import overcut.model.services.exceptions.CooldownException;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class DriversLinkGameServiceImpl implements DriversLinkGameService {

    @Autowired
    private DriversLinkGameDao gameDao;
    @Autowired
    private DriversLinkClueDao clueDao;

    @Autowired
    private CooldownService cooldownService;

    @Autowired
    private UserDao userDao;


    @Override
    public DriversLinkGame startGame(Long userId) {
        try {
            if (!cooldownService.canPlay("DriversLink", userId)) {
                long wait = cooldownService.secondsUntilNextPlay("DriversLink", userId);
                throw new CooldownException("WAIT", wait);
            }
            cooldownService.registerPlay("DriversLink", userId);

            HttpClient client = HttpClient.newHttpClient();
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("http://localhost:8000/generate-drivers-link"))
                    .GET()
                    .build();

            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() != 200) {
                throw new RuntimeException("FastAPI error: " + response.body());
            }

            ObjectMapper mapper = new ObjectMapper();
            JsonNode result = mapper.readTree(response.body());

            DriversLinkGame game = new DriversLinkGame();
            game.setDriverId(result.get("driverId").asLong());
            game.setDriverName(result.get("driverName").asText());

            JsonNode teammates = result.get("teammates");
            int clueOrder = 0;
            for (JsonNode teammate : teammates) {
                DriversLinkClue clue = new DriversLinkClue();
                clue.setGame(game);
                clue.setTeammateDriverId(teammate.get("driverId").asLong());
                clue.setTeammateName(teammate.get("driverName").asText());
                clue.setClueOrder(clueOrder++);
                game.getClues().add(clue);
            }

            return gameDao.save(game);
        } catch (Exception e) {
            throw new RuntimeException("Error iniciando DriversLinkGame", e);
        }
    }


    @Override
    public DriversLinkGame guessDriver(Long gameId, String driverGuess) {
        DriversLinkGame game = gameDao.findById(gameId).orElseThrow();
        boolean isCorrect = driverGuess.equalsIgnoreCase(game.getDriverName());

        if (isCorrect || game.getCurrentClueIndex() >= game.getClues().size() - 1) {
            game.setFinished(true);
            game.setSuccessful(isCorrect);
        } else {
            game.setCurrentClueIndex(game.getCurrentClueIndex() + 1);
        }

        return gameDao.save(game);
    }

    @Override
    public DriversLinkGame getGameStatus(Long gameId) {
        return gameDao.findById(gameId).orElseThrow();
    }

    @Override
    public List<String> autocompletePilotNames(String partial) {
        try {
            HttpClient client = HttpClient.newHttpClient();
            String encoded = java.net.URLEncoder.encode(partial, java.nio.charset.StandardCharsets.UTF_8);
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("http://localhost:8000/autocomplete-career-pilot?partial=" + encoded))
                    .GET()
                    .build();

            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() != 200) {
                throw new RuntimeException("FastAPI error: " + response.body());
            }

            ObjectMapper mapper = new ObjectMapper();
            return mapper.readValue(response.body(), new TypeReference<List<String>>() {});
        } catch (Exception e) {
            throw new RuntimeException("Error calling FastAPI autocomplete", e);
        }
    }


    @Override
    public DriversLinkGame skipClue(Long gameId) {
        DriversLinkGame game = gameDao.findById(gameId).orElseThrow();

        // Solo incrementa el índice si no estamos en la última pista
        if (!game.isFinished() && game.getCurrentClueIndex() < game.getClues().size() - 1) {
            game.setCurrentClueIndex(game.getCurrentClueIndex() + 1);
        }

        // NO marcar como terminado aquí
        gameDao.save(game);
        return game;
    }

}
