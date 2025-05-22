package overcut.model.services;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import overcut.model.entities.CareerPathClue;
import overcut.model.entities.CareerPathGame;
import overcut.model.entities.CareerPathGameDao;
import overcut.model.entities.CareerPathClueDao;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class CareerPathGameServiceImpl implements CareerPathGameService {

    @Autowired
    private CareerPathGameDao gameDao;
    @Autowired
    private CareerPathClueDao clueDao;

    @Override
    public CareerPathGame startGame() {
        try {
            ProcessBuilder pb = new ProcessBuilder("python",
                    "src/main/resources/scripts/select_driver_teams.py");
            Process process = pb.start();
            BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()));
            String jsonOutput = reader.lines().collect(Collectors.joining());
            process.waitFor();

            ObjectMapper mapper = new ObjectMapper();
            JsonNode result = mapper.readTree(jsonOutput);

            CareerPathGame game = new CareerPathGame();
            game.setDriverId(result.get("driverId").asLong());
            game.setDriverName(result.get("driverName").asText());

            JsonNode teams = result.get("teams");
            int clueOrder = 0;
            for (JsonNode team : teams) {
                CareerPathClue clue = new CareerPathClue();
                clue.setGame(game);
                clue.setTeamName(team.asText());
                clue.setClueOrder(clueOrder++);
                game.getClues().add(clue);
            }

            return gameDao.save(game);
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
            ProcessBuilder pb = new ProcessBuilder(
                    "python",
                    "src/main/resources/scripts/autocomplete_grid_pilot.py", "--partial", partial);
            Process process = pb.start();
            BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()));
            String jsonOutput = reader.lines().collect(Collectors.joining());
            process.waitFor();
            return new ObjectMapper().readValue(jsonOutput, new TypeReference<>() {});
        } catch (Exception e) {
            throw new RuntimeException(e);
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
