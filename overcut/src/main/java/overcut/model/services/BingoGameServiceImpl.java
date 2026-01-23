package overcut.model.services;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
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
    @Autowired private BingoCellPilotDao cellPilotDao;
    @Autowired private BingoSelectionDao selectionDao;
    @Autowired private CooldownService cooldownService;

    @Override
    public BingoGame startGame(String lang, Long userId) {
        try {
          /*  if (!cooldownService.canPlay("Bingo", userId)) {
                long wait = cooldownService.secondsUntilNextPlay("Bingo", userId);
                throw new CooldownException("WAIT", wait);
            }
*/
            HttpClient client = HttpClient.newHttpClient();
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("http://localhost:8000/generate-bingo?lang=" + lang))
                    .GET()
                    .build();

            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() != 200) {
                throw new RuntimeException("FastAPI server error: " + response.body());
            }

            ObjectMapper mapper = new ObjectMapper();
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

                // pilotos válidos por casilla
                for (JsonNode pilotNode : cellNode.get("validPilots")) {
                    BingoCellPilot p = new BingoCellPilot();
                    p.setGame(game);
                    p.setCell(cell);
                    p.setDriverId(pilotNode.get("driverId").asLong());
                    p.setDriverName(pilotNode.get("driverName").asText());
                    cell.getValidPilots().add(p);
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
            //cooldownService.registerPlay("Bingo", userId);
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

        // validación rápida
        boolean ok = cellPilotDao.existsByCellIdAndDriverId(dto.getCellId(), dto.getDriverId());
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
