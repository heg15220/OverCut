package overcut.model.services;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import overcut.model.entities.*;
import overcut.model.services.exceptions.CooldownException;
import overcut.rest.dtos.BingoSelectRequestDto;
import overcut.rest.dtos.BingoSelectResponseDto;

import java.net.URI;
import java.net.http.*;
import java.time.LocalDateTime;

@Service
@Transactional
public class BingoGameServiceImpl implements BingoGameService {

    @Autowired private BingoGameDao gameDao;
    @Autowired private BingoCellDao cellDao;              // ✅ NUEVO: para leer la celda y sus validPilotIds
    @Autowired private BingoSelectionDao selectionDao;
    @Autowired private CooldownService cooldownService;

    private final ObjectMapper mapper = new ObjectMapper(); // ✅ reutiliza (menos basura GC)


    @Value("${fastapi.base-url:http://fastapi:8000}")
    private String fastapiBaseUrl;
    @Override
    public BingoGame startGame(String lang, Long userId) {
        try {

            if (!cooldownService.canPlay("Bingo", userId)) {
                long wait = cooldownService.secondsUntilNextPlay("Bingo", userId);
                throw new CooldownException("WAIT", wait);
            }


            HttpClient client = HttpClient.newHttpClient();
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(fastapiBaseUrl + "/generate-bingo?lang=" + lang))
                    .GET()
                    .build();

            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() != 200) {
                throw new RuntimeException("FastAPI server error: " + response.body());
            }

            JsonNode root = mapper.readTree(response.body());

            BingoGame game = new BingoGame();
            game.setFinished(false);
            game.setStartedAt(LocalDateTime.now());
            game.setDurationSeconds(60);

            // 9 casillas
            int idx = 0;
            for (JsonNode cellNode : root.get("cells")) {
                BingoCell cell = new BingoCell();
                cell.setGame(game);
                cell.setCellIndex(idx++);
                cell.setThemeCode(cellNode.get("code").asText());
                cell.setThemeDescription(cellNode.get("description").asText());

                if (cellNode.hasNonNull("image")) {
                    cell.setThemeImage(cellNode.get("image").asText());
                }

                // ✅ Guardar SOLO ids en JSON (sin insertar miles de BingoCellPilot)
                JsonNode vpi = cellNode.get("validPilotIds");
                JsonNode vp = cellNode.get("validPilots");

                if (vpi != null && vpi.isArray()) {
                    // formato compacto (solo ids) -> guardamos JSON tal cual
                    cell.setValidPilotIds(vpi.toString());
                } else if (vp != null && vp.isArray()) {
                    // formato antiguo (full) -> lo convertimos a ids y guardamos JSON
                    StringBuilder sb = new StringBuilder("[");
                    boolean first = true;
                    for (JsonNode pilotNode : vp) {
                        if (!first) sb.append(",");
                        sb.append(pilotNode.get("driverId").asLong());
                        first = false;
                    }
                    sb.append("]");
                    cell.setValidPilotIds(sb.toString());
                } else {
                    throw new RuntimeException("Bingo cell missing validPilotIds/validPilots");
                }

                game.getCells().add(cell);
            }

            // cola de 60
            int q = 0;
            for (JsonNode d : root.get("driversQueue")) {
                BingoGameDriver gd = new BingoGameDriver();
                gd.setGame(game);
                gd.setQueueIndex(q++);
                gd.setDriverId(d.get("driverId").asLong());
                gd.setDriverName(d.get("driverName").asText());
                game.getDriversQueue().add(gd);
            }

            BingoGame saved = gameDao.save(game);
            cooldownService.registerPlay("Bingo", userId);
            return saved;

        } catch (Exception e) {
            throw new RuntimeException("Error calling FastAPI bingo generator", e);
        }
    }

    @Override
    public BingoSelectResponseDto selectCell(BingoSelectRequestDto dto) {
        BingoGame game = gameDao.findById(dto.getGameId()).orElseThrow();

        if (game.isFinished()) {
            return new BingoSelectResponseDto(false, true, "GAME_FINISHED");
        }

        // bloqueos básicos
        if (selectionDao.existsByGameIdAndCellId(dto.getGameId(), dto.getCellId())) {
            return new BingoSelectResponseDto(false, false, "CELL_ALREADY_FILLED");
        }
        if (selectionDao.existsByGameIdAndDriverId(dto.getGameId(), dto.getDriverId())) {
            return new BingoSelectResponseDto(false, false, "DRIVER_ALREADY_USED");
        }

        // ✅ validación sin tabla BingoCellPilot: membership en validPilotIds (JSON)
        BingoCell cell = cellDao.findById(dto.getCellId()).orElseThrow();

        String jsonIds = cell.getValidPilotIds();
        if (jsonIds == null || jsonIds.isBlank()) {
            // si por cualquier motivo está vacío, consideramos inválido
            return new BingoSelectResponseDto(false, false, "INCORRECT");
        }

        boolean ok;
        try {
            Long[] ids = mapper.readValue(jsonIds, Long[].class);
            ok = false;
            for (Long id : ids) {
                if (id != null && id.equals(dto.getDriverId())) {
                    ok = true;
                    break;
                }
            }
        } catch (Exception ex) {
            // JSON corrupto -> inválido
            return new BingoSelectResponseDto(false, false, "INCORRECT");
        }

        if (!ok) {
            return new BingoSelectResponseDto(false, false, "INCORRECT");
        }

        // guardar acierto
        BingoSelection sel = new BingoSelection();
        sel.setGame(game);

        BingoCell cellRef = new BingoCell();
        cellRef.setId(dto.getCellId());
        sel.setCell(cellRef);

        sel.setDriverId(dto.getDriverId());
        sel.setDriverName(dto.getDriverName());

        selectionDao.save(sel);

        // comprobar fin (9 casillas)
        boolean finished = selectionDao.countByGameId(dto.getGameId()) >= 9;
        if (finished) {
            game.setFinished(true);
            gameDao.save(game);
        }

        return new BingoSelectResponseDto(true, finished, "CORRECT");
    }

    @Override
    public BingoGame finish(Long gameId) {
        BingoGame game = gameDao.findById(gameId).orElseThrow();
        game.setFinished(true);
        return gameDao.save(game);
    }
}
