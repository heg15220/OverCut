package overcut.model.services;

import com.fasterxml.jackson.databind.ObjectMapper;
import overcut.model.entities.Top10Game;
import overcut.model.entities.Top10GameDao;
import overcut.model.entities.Top10Slot;
import overcut.model.entities.Top10SlotDao;
import overcut.model.services.exceptions.CooldownException;
import overcut.rest.dtos.GridSlotReveal;
import overcut.rest.dtos.GridValidationResultDto;
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
public class Top10GameServiceImpl implements Top10GameService {

    @Autowired
    private Top10GameDao top10GameDao;

    @Autowired
    private Top10SlotDao top10SlotDao;

    @Autowired
    private CooldownService cooldownService;


    private final HttpClient client = HttpClient.newHttpClient();
    private final ObjectMapper mapper = new ObjectMapper();

    @Override
    public Top10Game createGame(Long userId, String lang) {
        try {
            if (!cooldownService.canPlay("Top10Game", userId)) {
                long wait = cooldownService.secondsUntilNextPlay("Top10Game", userId);
                throw new CooldownException("WAIT", wait);
            }
            String url = "http://localhost:8000/generate-top10-game?lang=" + URLEncoder.encode(lang, StandardCharsets.UTF_8);
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .GET()
                    .build();

            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() != 200) {
                throw new RuntimeException("FastAPI error: " + response.body());
            }

            Map<String, Object> data = mapper.readValue(response.body(), Map.class);

            Top10Game game = new Top10Game();
            game.setSeasonYear((Integer) data.get("seasonYear"));
            game.setRaceId((Integer) data.get("raceId"));
            game.setRaceName((String) data.get("raceName"));

            List<Map<String, String>> top10 = (List<Map<String, String>>) data.get("top10");
            List<Top10Slot> slots = new ArrayList<>();
            for (int i = 0; i < top10.size(); i++) {
                Map<String, String> pilot = top10.get(i);
                Top10Slot slot = new Top10Slot();
                slot.setPositionGame(i + 1);
                slot.setCorrectPilotName(pilot.get("name"));
                slot.setNationalityCode(pilot.get("nationality"));
                slot.setFilledByPilotName(null);
                slot.setGame(game);
                slots.add(slot);
            }

            game.setSlots(slots);
            Top10Game saved = top10GameDao.save(game);
            cooldownService.registerPlay("Top10Game", userId);
            return saved;

        } catch (Exception e) {
            throw new RuntimeException("Error al generar juego Top10", e);
        }
    }

    @Override
    public List<Top10Slot> getGrid(Long gameId) {
        return top10SlotDao.findByGameId(gameId);
    }

    @Override
    public GridValidationResultDto validatePilot(Long gameId, String pilotName) {
        Top10Game game = top10GameDao.findById(gameId)
                .orElseThrow(() -> new RuntimeException("Juego no encontrado"));

        try {
            String url = String.format("http://localhost:8000/validate-top10-pilot?pilot=%s&raceId=%d",
                    URLEncoder.encode(pilotName, StandardCharsets.UTF_8),
                    game.getRaceId());

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .GET()
                    .build();

            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
            Map<String, Object> result = mapper.readValue(response.body(), Map.class);

            boolean valid = Boolean.TRUE.equals(result.get("valid"));
            Integer position = (Integer) result.get("position");

            if (valid && position != null) {
                Top10Slot slot = top10SlotDao.findByGameId(gameId).stream()
                        .filter(s -> s.getPositionGame().equals(position))
                        .findFirst().orElseThrow();

                if (slot.getFilledByPilotName() == null) {
                    slot.setFilledByPilotName(pilotName);
                    top10SlotDao.save(slot);
                }

                return new GridValidationResultDto(
                        true,
                        pilotName,
                        slot.getNationalityCode(),
                        List.of(position)
                );
            } else {
                return new GridValidationResultDto(false, pilotName, null, List.of());
            }

        } catch (Exception e) {
            throw new RuntimeException("Error validando piloto", e);
        }
    }

    @Override
    public List<GridSlotReveal> revealAllAnswers(Long gameId) {
        Top10Game game = top10GameDao.findById(gameId).orElseThrow();
        List<Top10Slot> slots = top10SlotDao.findByGameId(gameId);

        for (Top10Slot slot : slots) {
            if (slot.getFilledByPilotName() == null) {
                slot.setFilledByPilotName(slot.getCorrectPilotName());
            }
        }

        top10SlotDao.saveAll(slots);

        return slots.stream()
                .map(slot -> new GridSlotReveal(
                        slot.getPositionGame(), null, slot.getFilledByPilotName()
                ))
                .collect(Collectors.toList());
    }

    @Override
    public List<String> autocompletePilots(Long gameId, String query) {
        try {
            String url = "http://localhost:8000/autocomplete-grid-pilot?partial=" +
                    URLEncoder.encode(query, StandardCharsets.UTF_8);
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .GET()
                    .build();

            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
            return Arrays.asList(mapper.readValue(response.body(), String[].class));
        } catch (Exception e) {
            throw new RuntimeException("Error al ejecutar autocomplete", e);
        }
    }
}
