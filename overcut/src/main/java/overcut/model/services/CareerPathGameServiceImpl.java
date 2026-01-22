package overcut.model.services;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import overcut.model.entities.CareerPathClue;
import overcut.model.entities.CareerPathGame;
import overcut.model.entities.CareerPathGameDao;
import overcut.model.entities.CareerPathClueDao;
import java.net.URI;
import jakarta.transaction.Transactional;
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
public class CareerPathGameServiceImpl implements CareerPathGameService {

    @Autowired
    private CareerPathGameDao gameDao;
    @Autowired
    private CareerPathClueDao clueDao;

    @Autowired
    private CooldownService cooldownService;

    @Override
    public CareerPathGame startGame(Long userId) {
    /*    if (!cooldownService.canPlay("CareerPath", userId)) {
            long wait = cooldownService.secondsUntilNextPlay("CareerPath", userId);
            throw new CooldownException("WAIT", wait);
        }
*/

        try {
            HttpClient client = HttpClient.newHttpClient();
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("http://localhost:8000/generate-career-path"))
                    .GET()
                    .build();

            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() != 200) {
                throw new RuntimeException("FastAPI error: " + response.body());
            }

            ObjectMapper mapper = new ObjectMapper();
            JsonNode result = mapper.readTree(response.body());

            CareerPathGame game = new CareerPathGame();
            game.setDriverId(result.get("driverId").asLong());
            game.setDriverName(result.get("driverName").asText());

            int clueOrder = 0;
            for (JsonNode teamNode : result.get("teams")) {
                CareerPathClue clue = new CareerPathClue();
                clue.setGame(game);
                clue.setTeamName(teamNode.asText());
                clue.setClueOrder(clueOrder++);
                game.getClues().add(clue);
            }

            CareerPathGame careerPathGame =  gameDao.save(game);
            //cooldownService.registerPlay("CareerPath", userId);
            return careerPathGame;

        } catch (Exception e) {
            throw new RuntimeException("Error iniciando CareerPathGame", e);
        }
    }
    @Override
    public CareerPathGame guessDriver(Long gameId, String driverGuess) {
        CareerPathGame game = gameDao.findById(gameId).orElseThrow();
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
    public CareerPathGame getGameStatus(Long gameId) {
        return gameDao.findById(gameId).orElseThrow();
    }

    @Override
    public List<String> autocompletePilotNames(String partial) {
        try {
            HttpClient client = HttpClient.newHttpClient();
            String encodedPartial = java.net.URLEncoder.encode(partial, java.nio.charset.StandardCharsets.UTF_8);
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("http://localhost:8000/autocomplete-career-pilot?partial=" + encodedPartial))
                    .GET()
                    .build();

            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() != 200) {
                throw new RuntimeException("FastAPI error: " + response.body());
            }

            ObjectMapper mapper = new ObjectMapper();
            return mapper.readValue(response.body(), new TypeReference<List<String>>() {});
        } catch (Exception e) {
            throw new RuntimeException("Error en autocompleteCareerPath", e);
        }
    }

    @Override
    public CareerPathGame skipClue(Long gameId) {
        CareerPathGame game = gameDao.findById(gameId).orElseThrow();

        if (!game.isFinished() && game.getCurrentClueIndex() < game.getClues().size() - 1) {
            game.setCurrentClueIndex(game.getCurrentClueIndex() + 1);
        }

        return gameDao.save(game);
    }
}
