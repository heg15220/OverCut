package overcut.model.services;


import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import overcut.model.entities.*;
import overcut.model.services.exceptions.CooldownException;

import java.net.URI;

import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
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

    @Autowired
    private CooldownService cooldownService;

    @Autowired
    private UserDao userDao;


    @Override
    public DriversConnectionsGame startGame(String lang, Long userId) {
        try {

            /*if (!cooldownService.canPlay("DriversConnections", userId)) {
                long wait = cooldownService.secondsUntilNextPlay("DriversConnections", userId);
                throw new CooldownException("WAIT", wait);
            }
*/
            HttpClient client = HttpClient.newHttpClient();
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("http://localhost:8000/generate?lang=" + lang))
                    .GET()
                    .build();

            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() != 200) {
                throw new RuntimeException("FastAPI server error: " + response.body());
            }

            ObjectMapper mapper = new ObjectMapper();
            JsonNode root = mapper.readTree(response.body());

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

            DriversConnectionsGame driversConnectionsGame =  gameDao.save(game);

            //cooldownService.registerPlay("DriversConnections", userId);
            return driversConnectionsGame;

        } catch (Exception e) {
            throw new RuntimeException("Error calling FastAPI game generator", e);
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
