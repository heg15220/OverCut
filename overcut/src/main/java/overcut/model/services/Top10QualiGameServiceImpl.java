package overcut.model.services;

import com.fasterxml.jackson.databind.ObjectMapper;
import overcut.model.entities.*;
import overcut.model.services.exceptions.CooldownException;
import overcut.rest.dtos.GridSlotReveal;
import overcut.rest.dtos.GridValidationResultDto;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.*;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class Top10QualiGameServiceImpl implements Top10QualiGameService {

    @Autowired private Top10QualiGameDao gameDao;
    @Autowired private Top10QualiSlotDao slotDao;
    @Autowired private CooldownService cooldownService;

    private final HttpClient client = HttpClient.newHttpClient();
    private final ObjectMapper mapper = new ObjectMapper();

    @Override
    public Top10QualiGame createGame(Long userId, String lang) {
        try {
         /*   if (!cooldownService.canPlay("Top10QualiGame", userId)) {
                long wait = cooldownService.secondsUntilNextPlay("Top10QualiGame", userId);
                throw new CooldownException("WAIT", wait);
            }
*/
            String url = "http://localhost:8000/generate-top10quali-game?lang=" +
                    URLEncoder.encode(lang, StandardCharsets.UTF_8);

            HttpResponse<String> response = client.send(
                    HttpRequest.newBuilder().uri(URI.create(url)).GET().build(),
                    HttpResponse.BodyHandlers.ofString()
            );

            if (response.statusCode() != 200) {
                throw new RuntimeException("FastAPI error: " + response.body());
            }

            Map<String, Object> data = mapper.readValue(response.body(), Map.class);

            Top10QualiGame game = new Top10QualiGame();
            game.setSeasonYear((Integer) data.get("seasonYear"));
            game.setRaceId((Integer) data.get("raceId"));
            game.setRaceName((String) data.get("raceName"));
            game.setSessionUsed((String) data.get("sessionUsed"));

            List<Map<String, String>> top10 = (List<Map<String, String>>) data.get("top10");
            List<Top10QualiSlot> slots = new ArrayList<>();

            for (int i = 0; i < top10.size(); i++) {
                Map<String, String> row = top10.get(i);

                Top10QualiSlot slot = new Top10QualiSlot();
                slot.setPositionGame(i + 1);
                slot.setCorrectPilotName(row.get("name"));
                slot.setNationalityCode(row.get("nationality"));
                slot.setQualiTime(row.get("time"));
                slot.setFilledByPilotName(null);
                slot.setGame(game);

                slots.add(slot);
            }

            game.setSlots(slots);

            Top10QualiGame saved = gameDao.save(game);
            //cooldownService.registerPlay("Top10QualiGame", userId);

            return saved;

        } catch (CooldownException ce) {
            throw ce;
        } catch (Exception e) {
            throw new RuntimeException("Error al generar juego Top10Quali", e);
        }
    }

    @Override
    public List<Top10QualiSlot> getGrid(Long gameId) {
        return slotDao.findByGameId(gameId);
    }

    @Override
    public GridValidationResultDto validatePilot(Long gameId, String pilotName) {
        Top10QualiGame game = gameDao.findById(gameId)
                .orElseThrow(() -> new RuntimeException("Juego no encontrado"));

        try {
            String url = String.format(
                    "http://localhost:8000/validate-top10quali-pilot?pilot=%s&raceId=%d",
                    URLEncoder.encode(pilotName, StandardCharsets.UTF_8),
                    game.getRaceId()
            );

            HttpResponse<String> response = client.send(
                    HttpRequest.newBuilder().uri(URI.create(url)).GET().build(),
                    HttpResponse.BodyHandlers.ofString()
            );

            Map<String, Object> result = mapper.readValue(response.body(), Map.class);

            boolean valid = Boolean.TRUE.equals(result.get("valid"));
            Integer position = (Integer) result.get("position");

            if (valid && position != null) {
                Top10QualiSlot slot = slotDao.findByGameId(gameId).stream()
                        .filter(s -> s.getPositionGame().equals(position))
                        .findFirst().orElseThrow();

                if (slot.getFilledByPilotName() == null) {
                    slot.setFilledByPilotName(pilotName);
                    slotDao.save(slot);
                }

                return new GridValidationResultDto(
                        true,
                        pilotName,
                        slot.getNationalityCode(),
                        List.of(position)
                );
            }

            return new GridValidationResultDto(false, pilotName, null, List.of());

        } catch (Exception e) {
            throw new RuntimeException("Error validando piloto", e);
        }
    }

    @Override
    public List<GridSlotReveal> revealAllAnswers(Long gameId) {
        List<Top10QualiSlot> slots = slotDao.findByGameId(gameId);

        for (Top10QualiSlot slot : slots) {
            if (slot.getFilledByPilotName() == null) {
                slot.setFilledByPilotName(slot.getCorrectPilotName());
            }
        }

        slotDao.saveAll(slots);

        return slots.stream()
                .map(s -> new GridSlotReveal(s.getPositionGame(), null, s.getFilledByPilotName()))
                .collect(Collectors.toList());
    }

    @Override
    public List<String> autocompletePilots(Long gameId, String query) {
        try {
            String url = "http://localhost:8000/autocomplete-grid-pilot?partial=" +
                    URLEncoder.encode(query, StandardCharsets.UTF_8);

            HttpResponse<String> response = client.send(
                    HttpRequest.newBuilder().uri(URI.create(url)).GET().build(),
                    HttpResponse.BodyHandlers.ofString()
            );

            return Arrays.asList(mapper.readValue(response.body(), String[].class));
        } catch (Exception e) {
            throw new RuntimeException("Error autocomplete", e);
        }
    }
}
