package overcut.model.services;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import overcut.model.entities.TwoTeamsOneDriverGame;
import overcut.model.entities.TwoTeamsOneDriverGameDao;
import overcut.model.entities.TwoTeamsOneDriverPair;
import overcut.model.entities.TwoTeamsOneDriverPairDao;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional
public class TwoTeamsOneDriverGameServiceImpl implements TwoTeamsOneDriverGameService {

    @Autowired
    private TwoTeamsOneDriverGameDao gameDao;

    @Autowired
    private TwoTeamsOneDriverPairDao pairDao;

    @Override
    public TwoTeamsOneDriverGame startGame() {
        try {
            ProcessBuilder pb = new ProcessBuilder("python", "src/main/resources/scripts/select_teams_pilot.py");
            Process process = pb.start();

            BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()));
            String jsonOutput = reader.lines().collect(Collectors.joining());
            process.waitFor();

            ObjectMapper mapper = new ObjectMapper();
            JsonNode root = mapper.readTree(jsonOutput);

            TwoTeamsOneDriverGame game = new TwoTeamsOneDriverGame();

            for (JsonNode pairNode : root) {
                TwoTeamsOneDriverPair pair = new TwoTeamsOneDriverPair();
                pair.setGame(game);
                pair.setTeamA(pairNode.get("teamA").asText());
                pair.setTeamB(pairNode.get("teamB").asText());
                pair.setPairOrder(pairNode.get("pairOrder").asInt());

                // Lista de pilotos válidos que se almacenará como string (unido por ; para validación)
                List<String> validDrivers = new ArrayList<>();
                for (JsonNode driverNode : pairNode.get("validDrivers")) {
                    validDrivers.add(driverNode.asText().toLowerCase());
                }
                pair.setGuessedDriverName(null); // usuario aún no ha respondido
                pair.setGuessedCorrectly(null); // aún sin adivinar
                game.getPairs().add(pair);
            }

            return gameDao.save(game);

        } catch (Exception e) {
            throw new RuntimeException("Error al iniciar TwoTeamsOneDriverGame", e);
        }
    }

    private boolean hasDrivenForBothTeams(String driverGuess, String teamA, String teamB) {
        try {
            ProcessBuilder pb = new ProcessBuilder(
                    "python", "src/main/resources/scripts/validate_two_teams_driver.py",
                    "--driver", driverGuess,
                    "--teamA", teamA,
                    "--teamB", teamB
            );

            Process process = pb.start();
            BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()));
            String output = reader.lines().collect(Collectors.joining());
            process.waitFor();

            ObjectMapper mapper = new ObjectMapper();
            JsonNode json = mapper.readTree(output);
            return json.get("valid").asBoolean();

        } catch (Exception e) {
            throw new RuntimeException("Error al validar piloto con script Python", e);
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
            ProcessBuilder pb = new ProcessBuilder(
                    "python",
                    "src/main/resources/scripts/autocomplete_grid_pilot.py", "--partial", partial);
            Process process = pb.start();
            BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()));
            String jsonOutput = reader.lines().collect(Collectors.joining());
            process.waitFor();

            ObjectMapper mapper = new ObjectMapper();
            return mapper.readValue(jsonOutput, mapper.getTypeFactory().constructCollectionType(List.class, String.class));
        } catch (Exception e) {
            throw new RuntimeException("Error en autocompletado", e);
        }
    }
}

