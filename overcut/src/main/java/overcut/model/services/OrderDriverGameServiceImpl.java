package overcut.model.services;


import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import overcut.rest.dtos.OrderSubmissionDto;
import overcut.model.entities.OrderDriverGame;
import overcut.model.entities.OrderDriverGameDao;
import overcut.model.entities.OrderDriverSlot;
import overcut.model.entities.OrderDriverSlotDao;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.InputStreamReader;
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

    @Override
    public OrderDriverGame startGame(String lang) {
        try {
            ProcessBuilder pb = new ProcessBuilder("python",
                    "src/main/resources/scripts/generate_order_drivers.py",
                    "--lang", lang);
            Process process = pb.start();

            BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()));
            String jsonOutput = reader.lines().collect(Collectors.joining());
            process.waitFor();

            JsonNode root = mapper.readTree(jsonOutput);

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

        // Obtener mapa: driverId -> correctOrder
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
