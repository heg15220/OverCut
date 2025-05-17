package es.udc.fic.tfg.model.services;



import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import es.udc.fic.tfg.model.entities.F1ImpostorGame;
import es.udc.fic.tfg.model.entities.F1ImpostorPilot;
import es.udc.fic.tfg.model.entities.F1ImpostorGameDao;
import es.udc.fic.tfg.model.entities.F1ImpostorPilotDao;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional
public class F1ImpostorGameServiceImpl implements F1ImpostorGameService {

    @Autowired
    private F1ImpostorGameDao gameDao;

    @Autowired
    private F1ImpostorPilotDao pilotDao;

    @Override
    public F1ImpostorGame startGame(String lang) {
        try {
            ProcessBuilder pb = new ProcessBuilder("python", "src/main/resources/scripts/generate_f1_impostor.py", "--lang", lang);
            Process process = pb.start();

            BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()));
            String jsonOutput = reader.lines().collect(Collectors.joining());
            process.waitFor();

            ObjectMapper mapper = new ObjectMapper();
            JsonNode root = mapper.readTree(jsonOutput);

            if (root.has("error")) {
                throw new RuntimeException("Script error: " + root.get("error").asText());
            }

            F1ImpostorGame game = new F1ImpostorGame();
            game.setCreatedAt(LocalDateTime.now());
            game.setCategory(root.get("category").asText());
            game.setThemeDescription(root.get("themeDescription").asText());
            game.setFinished(false);
            game.setWon(null);

            for (JsonNode pilotNode : root.get("pilots")) {
                F1ImpostorPilot pilot = new F1ImpostorPilot();
                pilot.setGame(game);
                pilot.setPilotName(pilotNode.get("pilotName").asText());
                pilot.setValid(pilotNode.get("valid").asBoolean());
                pilot.setSelectedByUser(false);
                game.getPilots().add(pilot);
            }

            return gameDao.save(game);

        } catch (Exception e) {
            throw new RuntimeException("Error al iniciar F1 Impostor Game", e);
        }
    }

    @Override
    public F1ImpostorGame validateSelection(Long gameId, List<String> selectedPilotNames) {
        F1ImpostorGame game = gameDao.findById(gameId).orElseThrow();

        if (game.isFinished()) return game;

        boolean allCorrect = true;

        for (F1ImpostorPilot pilot : game.getPilots()) {
            boolean selected = selectedPilotNames.contains(pilot.getPilotName());
            pilot.setSelectedByUser(selected);

            if ((selected && !pilot.isValid()) || (!selected && pilot.isValid())) {
                allCorrect = false;
            }
        }

        game.setFinished(true);
        game.setWon(allCorrect);

        return gameDao.save(game);
    }

    @Override
    public F1ImpostorGame getGameStatus(Long gameId) {
        return gameDao.findById(gameId).orElseThrow();
    }
}

