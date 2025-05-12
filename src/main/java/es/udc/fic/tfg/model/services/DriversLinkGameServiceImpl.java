package es.udc.fic.tfg.model.services;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import es.udc.fic.tfg.model.entities.DriversLinkClue;
import es.udc.fic.tfg.model.entities.DriversLinkClueDao;
import es.udc.fic.tfg.model.entities.DriversLinkGame;
import es.udc.fic.tfg.model.entities.DriversLinkGameDao;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class DriversLinkGameServiceImpl implements DriversLinkGameService {

    @Autowired
    private DriversLinkGameDao gameDao;
    @Autowired
    private DriversLinkClueDao clueDao;

    @Override
    public DriversLinkGame startGame() {
        try {
            ProcessBuilder pb = new ProcessBuilder("python",
                    "src/main/resources/scripts/select_driver_teammates.py");
            Process process = pb.start();
            BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()));
            String jsonOutput = reader.lines().collect(Collectors.joining());
            process.waitFor();

            ObjectMapper mapper = new ObjectMapper();
            JsonNode result = mapper.readTree(jsonOutput);

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
}
