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

import java.io.BufferedReader;
import java.io.InputStreamReader;
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

    @Override
    public TeamGuessGame startGame() {
        try {
            ProcessBuilder pb = new ProcessBuilder("python",
                    "src/main/resources/scripts/select_team_and_podium_drivers.py");
            Process process = pb.start();
            BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()));
            String jsonOutput = reader.lines().collect(Collectors.joining());
            process.waitFor();

            JsonNode result = mapper.readTree(jsonOutput);

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
            ProcessBuilder pb = new ProcessBuilder("python",
                    "src/main/resources/scripts/autocomplete_teams.py", "--partial", partial);
            Process process = pb.start();
            BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()));
            String json = reader.lines().collect(Collectors.joining());
            process.waitFor();
            return mapper.readValue(json, List.class);
        } catch (Exception e) {
            throw new RuntimeException("Error al autocompletar nombres de equipos", e);
        }
    }
}
