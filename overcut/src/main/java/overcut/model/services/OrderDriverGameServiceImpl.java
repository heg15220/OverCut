package overcut.model.services;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.transaction.Transactional;
import overcut.model.entities.OrderDriverGame;
import overcut.model.entities.OrderDriverGameDao;
import overcut.model.entities.OrderDriverSlot;
import overcut.model.entities.OrderDriverSlotDao;
import overcut.rest.dtos.OrderSubmissionDto;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional
public class OrderDriverGameServiceImpl implements OrderDriverGameService {

    @Autowired
    private OrderDriverGameDao gameDao;

    @Autowired
    private OrderDriverSlotDao slotDao;

    private static final ObjectMapper mapper = new ObjectMapper();
    private static final HttpClient client = HttpClient.newHttpClient();

    @Override
    public OrderDriverGame startGame(String lang) {
        try {
            String url = "http://localhost:8000/generate-order-game?lang=" +
                    URLEncoder.encode(lang, StandardCharsets.UTF_8);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .GET()
                    .build();

            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() != 200) {
                throw new RuntimeException("Error desde FastAPI: " + response.body());
            }

            JsonNode root = mapper.readTree(response.body());

            OrderDriverGame game = new OrderDriverGame();
            game.setTopic(root.get("topic").asText());

            List<OrderDriverSlot> slots = new ArrayList<>();
            for (JsonNode node : root.get("drivers")) {
                OrderDriverSlot slot = new OrderDriverSlot();
                slot.setGame(game);
                slot.setDriverId(node.get("driverId").asLong());
                slot.setDriverName(node.get("driverName").asText());
                slot.setCorrectOrder(node.get("correctOrder").asInt());
                slots.add(slot);
            }

            game.setSlots(slots);
            return gameDao.save(game);

        } catch (Exception e) {
            throw new RuntimeException("Error al iniciar juego de orden de pilotos", e);
        }
    }

    @Override
    public OrderDriverGame validateSubmission(OrderSubmissionDto submission) {
        OrderDriverGame game = gameDao.findById(submission.getGameId()).orElseThrow();

        Map<Long, Integer> correctOrderMap = game.getSlots().stream()
                .collect(Collectors.toMap(OrderDriverSlot::getDriverId, OrderDriverSlot::getCorrectOrder));

        boolean success = true;
        List<Long> submitted = submission.getOrderedDriverIds();

        for (int i = 0; i < submitted.size(); i++) {
            Long driverId = submitted.get(i);
            Integer expectedIndex = correctOrderMap.get(driverId);
            if (expectedIndex == null || expectedIndex != i) {
                success = false;
                break;
            }
        }

        game.setFinished(true);
        game.setSuccessful(success);
        return gameDao.save(game);
    }

    @Override
    public OrderDriverGame getGame(Long gameId) {
        return gameDao.findById(gameId).orElseThrow();
    }
}
