package overcut.model.services;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import overcut.model.entities.TeamGuessGame;
import overcut.model.entities.TeamGuessClue;
import overcut.model.entities.TeamGuessGameDao;
import overcut.model.entities.TeamGuessClueDao;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class TeamGuessGameServiceImpl implements TeamGuessGameService {

    @Autowired
    private TeamGuessGameDao gameDao;

    @Autowired
    private TeamGuessClueDao clueDao;

    private static final ObjectMapper mapper = new ObjectMapper();
    private final HttpClient client = HttpClient.newHttpClient();

    @Override
    public TeamGuessGame startGame() {
        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("http://localhost:8000/generate-team-guess"))
                    .GET()
                    .build();

            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() != 200) {
                throw new RuntimeException("FastAPI error: " + response.body());
            }

            JsonNode result = mapper.readTree(response.body());

            TeamGuessGame game = new TeamGuessGame();
            game.setTeamId(result.get("teamId").asLong());
            game.setTeamName(result.get("teamName").asText());

            int clueOrder = 0;
            for (JsonNode driverNode : result.get("drivers")) {
                TeamGuessClue clue = new TeamGuessClue();
                clue.setGame(game);
                clue.setDriverId(driverNode.get("driverId").asLong());
                clue.setDriverName(driverNode.get("driverName").asText());
                clue.setClueOrder(clueOrder++);
                game.getClues().add(clue);
            }

            return gameDao.save(game);
        } catch (Exception e) {
            throw new RuntimeException("Error al iniciar TeamGuessGame", e);
        }
    }

    @Override
    public TeamGuessGame guessTeam(Long gameId, String teamGuess) {
        TeamGuessGame game = gameDao.findById(gameId).orElseThrow();
        boolean correct = teamGuess.trim().equalsIgnoreCase(game.getTeamName().trim());

        game.setFinished(true);
        game.setSuccessful(correct);

        return gameDao.save(game);
    }

    @Override
    public TeamGuessGame getGameStatus(Long gameId) {
        return gameDao.findById(gameId).orElseThrow();
    }

    @Override
    public List<String> autocompleteTeamNames(String partial) {
        try {
            String url = String.format("http://localhost:8000/autocomplete-team?partial=%s", java.net.URLEncoder.encode(partial, "UTF-8"));

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .GET()
                    .build();

            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() != 200) {
                throw new RuntimeException("FastAPI error: " + response.body());
            }

            return mapper.readValue(response.body(), List.class);

        } catch (Exception e) {
            throw new RuntimeException("Error al autocompletar nombres de equipos", e);
        }
    }
}
