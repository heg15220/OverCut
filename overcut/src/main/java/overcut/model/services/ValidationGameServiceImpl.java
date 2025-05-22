package overcut.model.services;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import overcut.model.entities.TikiTakaGame;
import overcut.model.entities.TikiTakaGameDao;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class ValidationGameServiceImpl implements ValidationGameService{

    @Autowired
    private TikiTakaGameDao gameDao;

    @Override
    public boolean validatePilot(Long gameId, String rowCriteria, String colCriteria, String piloto) {
        try {
            TikiTakaGame game = gameDao.findById(gameId)
                    .orElseThrow(() -> new RuntimeException("Game not found"));

            List<String> command = new ArrayList<>(List.of(
                    "python", "src/main/resources/scripts/validate_pilot.py",
                    "--row", rowCriteria,
                    "--col", colCriteria,
                    "--pilot", piloto
            ));

            if (game.getSinceYear() != null) {
                command.add("--since");
                command.add(String.valueOf(game.getSinceYear()));
            }
            if (game.getEndYear() != null) {
                command.add("--until");
                command.add(String.valueOf(game.getEndYear()));
            }

            ProcessBuilder pb = new ProcessBuilder(command);
            pb.redirectErrorStream(true);
            Process process = pb.start();

            String output = new String(process.getInputStream().readAllBytes());
            int exitCode = process.waitFor();

            if (exitCode != 0) {
                return false;
            }

            ObjectMapper mapper = new ObjectMapper();
            JsonNode result = mapper.readTree(output);

            return result.get("is_valid").asBoolean();

        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }



}
