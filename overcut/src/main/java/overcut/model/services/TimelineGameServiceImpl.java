package overcut.model.services;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import overcut.model.entities.*;
import overcut.model.services.exceptions.CooldownException;
import overcut.rest.dtos.TimelineGameConversor;
import overcut.rest.dtos.ValidateTimelineResultDto;

import java.net.URI;
import java.net.http.*;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional
public class TimelineGameServiceImpl implements TimelineGameService {

    private static final int MAX_ATTEMPTS = 3;

    @Autowired private TimelineGameDao gameDao;
    @Autowired private TimelineEventDao eventDao;

    @Autowired private CooldownService cooldownService;

    @Value("${fastapi.base-url:http://fastapi:8000}")
    private String fastapiBaseUrl;

    @Override
    public TimelineGame startGame(String lang, Long userId) {
        try {
            if (!cooldownService.canPlay("Timeline", userId)) {
                long wait = cooldownService.secondsUntilNextPlay("Timeline", userId);
                throw new CooldownException("WAIT", wait);
            }

            HttpClient client = HttpClient.newHttpClient();
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(fastapiBaseUrl + "/generate-timeline?lang=" + lang))
                    .GET()
                    .build();

            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() != 200) {
                throw new RuntimeException("FastAPI server error: " + response.body());
            }

            ObjectMapper mapper = new ObjectMapper();
            JsonNode root = mapper.readTree(response.body());

            TimelineGame game = new TimelineGame();
            game.setFinished(false);
            game.setAttempts(0);

            for (JsonNode ev : root.get("events")) {
                TimelineEvent e = new TimelineEvent();
                e.setGame(game);
                e.setEventCode(ev.get("code").asText());
                e.setEventText(ev.get("text").asText());
                e.setEventDate(LocalDate.parse(ev.get("date").asText())); // "YYYY-MM-DD"
                e.setHintYear(ev.hasNonNull("hintYear") ? ev.get("hintYear").asInt() : null);
                game.getEvents().add(e);
            }

            TimelineGame saved = gameDao.save(game);
          cooldownService.registerPlay("Timeline", userId);
            return saved;

        } catch (CooldownException ce) {
            throw ce;
        } catch (Exception e) {
            throw new RuntimeException("Error calling FastAPI timeline generator", e);
        }
    }

    @Override
    public ValidateTimelineResultDto validateOrder(Long gameId, List<Long> orderedEventIds) {
        TimelineGame game = gameDao.findById(gameId).orElseThrow();

        // si ya está terminado, devolvemos estado actual “todo correcto” según orden real (o simplemente finished)
        if (game.isFinished()) {
            return new ValidateTimelineResultDto(false, Collections.emptyList(), game.getAttempts(), true);
        }

        game.setAttempts(game.getAttempts() + 1);

        // mapa rápido id -> evento
        Map<Long, TimelineEvent> byId = game.getEvents().stream()
                .collect(Collectors.toMap(TimelineEvent::getId, e -> e));

        // orden correcto (por fecha)
        List<Long> correctOrder = game.getEvents().stream()
                .sorted(Comparator.comparing(TimelineEvent::getEventDate))
                .map(TimelineEvent::getId)
                .collect(Collectors.toList());

        List<Boolean> correctPositions = new ArrayList<>();
        for (int i = 0; i < orderedEventIds.size(); i++) {
            boolean ok = i < correctOrder.size() && Objects.equals(orderedEventIds.get(i), correctOrder.get(i));
            correctPositions.add(ok);
        }

        boolean allCorrect = correctPositions.stream().allMatch(Boolean::booleanValue);

        boolean finished = allCorrect || game.getAttempts() >= MAX_ATTEMPTS;
        game.setFinished(finished);

        gameDao.save(game);

        ValidateTimelineResultDto dto = new ValidateTimelineResultDto(allCorrect, correctPositions, game.getAttempts(), finished);

        if (finished) {
            dto.setGame(TimelineGameConversor.toRevealDto(game)); // <-- incluye fechas
        }

        return dto;


    }

    @Override
    public TimelineGame reveal(Long gameId) {
        TimelineGame game = gameDao.findById(gameId).orElseThrow();
        game.setFinished(true);
        return gameDao.save(game);
    }
}
