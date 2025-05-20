package es.udc.fic.tfg.model.services;


import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import es.udc.fic.tfg.model.entities.*;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class DriversConnectionsGameServiceImpl implements DriversConnectionsGameService {

    @Autowired
    private DriversConnectionsGameDao gameDao;

    @Autowired
    private DriversConnectionsCategoryDao categoryDao;

    @Autowired
    private DriversConnectionsPilotDao pilotDao;

    @Override
    public DriversConnectionsGame startGame() {
        try {
            ProcessBuilder pb = new ProcessBuilder("python", "src/main/resources/scripts/generate_drivers_connections.py");
            Process process = pb.start();

            String jsonOutput;
            try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()))) {
                jsonOutput = reader.lines().collect(Collectors.joining());
            }
            process.waitFor();

            ObjectMapper mapper = new ObjectMapper();
            JsonNode root = mapper.readTree(jsonOutput);

            DriversConnectionsGame game = new DriversConnectionsGame();
            game.setFinished(false);

            for (JsonNode categoryNode : root.get("categories")) {
                DriversConnectionsCategory category = new DriversConnectionsCategory();
                category.setGame(game);
                category.setCategoryCode(categoryNode.get("code").asText());
                category.setCategoryDescription(categoryNode.get("description").asText());

                for (JsonNode pilotNode : categoryNode.get("pilots")) {
                    DriversConnectionsPilot pilot = new DriversConnectionsPilot();
                    pilot.setGame(game);
                    pilot.setCategory(category);
                    pilot.setDriverId(pilotNode.get("driverId").asLong());
                    pilot.setDriverName(pilotNode.get("driverName").asText());
                    category.getPilots().add(pilot);
                }

                game.getCategories().add(category);
            }

            return gameDao.save(game);
        } catch (Exception e) {
            throw new RuntimeException("Error starting DriversConnectionsGame", e);
        }
    }

    @Override
    public boolean validateGroup(Long gameId, List<String> selectedDriverNames) {
        DriversConnectionsGame game = gameDao.findById(gameId).orElseThrow();

        for (DriversConnectionsCategory category : game.getCategories()) {
            List<String> driverNames = category.getPilots().stream()
                    .map(DriversConnectionsPilot::getDriverName)
                    .collect(Collectors.toList());

            if (driverNames.containsAll(selectedDriverNames) && selectedDriverNames.containsAll(driverNames)) {
                return true;
            }
        }

        return false;
    }

    @Override
    public DriversConnectionsGame revealAnswers(Long gameId) {
        DriversConnectionsGame game = gameDao.findById(gameId).orElseThrow();
        game.setFinished(true);
        return gameDao.save(game);
    }
}
