package es.udc.fic.tfg.model.services;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import es.udc.fic.tfg.model.entities.*;
import es.udc.fic.tfg.rest.dtos.CreateGameRequest;
import es.udc.fic.tfg.rest.dtos.MoveRequest;
import es.udc.fic.tfg.rest.dtos.ValidationResponse;
import es.udc.fic.tfg.rest.dtos.ValidationResponseTikTak;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class TikiTakaGameServiceImpl implements TikiTakaGameService {

    @Autowired
    private TikiTakaGameDao gameDao;

    @Autowired
    private TikiTakaCellDao cellDao;

    @Autowired
    private TikiTakaCriteriaDao criteriaDao;

    @Autowired
    private ValidationGameService validationService;




    private String checkWinnerOrDraw(TikiTakaGame game) {

        List<TikiTakaCell> cells = game.getCells();

        String[][] grid = new String[3][3];

        // Rellenamos el grid con las jugadas
        for (TikiTakaCell cell : cells) {
            grid[cell.getRowGame() - 1][cell.getColumnGame() - 1] = cell.getFilledBy();
        }

        String[] players = {"X", "O"};

        for (String player : players) {
            // Horizontales y verticales
            for (int i = 0; i < 3; i++) {
                if ((player.equals(grid[i][0]) && player.equals(grid[i][1]) && player.equals(grid[i][2])) ||
                        (player.equals(grid[0][i]) && player.equals(grid[1][i]) && player.equals(grid[2][i]))) {
                    return player + "_WINS";
                }
            }

            // Diagonal principal
            if (player.equals(grid[0][0]) && player.equals(grid[1][1]) && player.equals(grid[2][2])) {
                return player + "_WINS";
            }

            // Diagonal secundaria
            if (player.equals(grid[0][2]) && player.equals(grid[1][1]) && player.equals(grid[2][0])) {
                return player + "_WINS";
            }
        }

        // Empate: Si todas las casillas están ocupadas
        boolean draw = cells.stream().allMatch(c -> c.getFilledBy() != null);

        return draw ? "DRAW" : "IN_PROGRESS";
    }

    private List<TikiTakaCriteria> guardarOCargarCriterios(JsonNode criteriaArray, String axis, TikiTakaGame game) {
        List<TikiTakaCriteria> result = new ArrayList<>();

        for (JsonNode c : criteriaArray) {
            String code = c.get("code").asText();
            String description = c.get("description").asText();
            String imageUrl = c.has("imageUrl") ? c.get("imageUrl").asText() : null;

            result.add(new TikiTakaCriteria(game, axis, 0, description, code, imageUrl));
        }
        return result;
    }





    private void generarCriteriosDinamicos(TikiTakaGame game) {
        try {
            String output = PythonLLMCriteriaGame.executePythonScript("src/main/resources/scripts/generate_criteria_dynamic.py");

            ObjectMapper objectMapper = new ObjectMapper();
            JsonNode jsonNode = objectMapper.readTree(output);

            if (jsonNode.has("error")) {
                throw new RuntimeException("Error desde Python: " + jsonNode.get("error").asText());
            }

            JsonNode filasJson = jsonNode.get("rowCriteria");
            JsonNode columnasJson = jsonNode.get("columnCriteria");

            if (filasJson == null || columnasJson == null) {
                throw new RuntimeException("Error: No se pudieron generar criterios válidos");
            }

            List<TikiTakaCriteria> filas = guardarOCargarCriterios(filasJson, "row", game);
            List<TikiTakaCriteria> columnas = guardarOCargarCriterios(columnasJson, "column", game);

            for (int i = 1; i <= filas.size(); i++) filas.get(i - 1).setPositionGame(i);
            for (int i = 1; i <= columnas.size(); i++) columnas.get(i - 1).setPositionGame(i);

            criteriaDao.saveAll(filas);
            criteriaDao.saveAll(columnas);

        } catch (Exception e) {
            throw new RuntimeException("Error generando criterios dinámicos", e);
        }
    }



    private void asignarCriteriosAleatorios() {

        List<TikiTakaCriteria> filas = criteriaDao.findByAxis("row");
        List<TikiTakaCriteria> columnas = criteriaDao.findByAxis("column");

        if (filas.size() < 3 || columnas.size() < 3) {
            throw new RuntimeException("No hay suficientes criterios predefinidos");
        }

        Collections.shuffle(filas);
        Collections.shuffle(columnas);

        for (int i = 1; i <= 3; i++) {
            filas.get(i - 1).setPositionGame(i);
            columnas.get(i - 1).setPositionGame(i);
        }

        criteriaDao.saveAll(filas);
        criteriaDao.saveAll(columnas);
    }

    private void generarCriteriosEstaticos(TikiTakaGame game) {
        try {
            String output = PythonLLMCriteriaGame.executePythonScript("src/main/resources/scripts/generate_criteria_static.py");

            ObjectMapper objectMapper = new ObjectMapper();
            JsonNode jsonNode = objectMapper.readTree(output);

            List<TikiTakaCriteria> filas = guardarOCargarCriterios(jsonNode.get("rowCriteria"), "row", game);
            List<TikiTakaCriteria> columnas = guardarOCargarCriterios(jsonNode.get("columnCriteria"), "column", game);

            for (int i = 1; i <= filas.size(); i++) filas.get(i - 1).setPositionGame(i);
            for (int i = 1; i <= columnas.size(); i++) columnas.get(i - 1).setPositionGame(i);

            criteriaDao.saveAll(filas);
            criteriaDao.saveAll(columnas);

        } catch (Exception e) {
            throw new RuntimeException("Error generando criterios estáticos", e);
        }
    }





    @Override
    public Long createGame(CreateGameRequest request) {

        TikiTakaGame game = new TikiTakaGame(
                request.getPlayerX(),
                request.getPlayerO(),
                "X",
                "IN_PROGRESS",
                LocalDateTime.now(),
                new ArrayList<>()
        );
        gameDao.save(game);

        for (int row = 1; row <= 3; row++) {
            for (int col = 1; col <= 3; col++) {
                TikiTakaCell cell = new TikiTakaCell(game, row, col, null, null, false);
                cellDao.save(cell);
            }
        }

        if (request.isUseDynamicCriteria()) {
            generarCriteriosDinamicos(game);
        } else {
            generarCriteriosEstaticos(game);
        }


        return game.getId();
    }





    @Override
    public TikiTakaGame getGame(Long gameId) {
        return gameDao.findById(gameId).orElseThrow(() -> new RuntimeException("Game not found"));
    }

    @Override
    public ValidationResponseTikTak playMove(Long gameId, MoveRequest request) {
        TikiTakaGame game = getGame(gameId);

        if (!game.getStatus().equals("IN_PROGRESS")) {
            return new ValidationResponseTikTak(false, "Game already finished");
        }

        TikiTakaCell cell = cellDao.findAll().stream()
                .filter(c -> c.getGame().getId().equals(gameId) &&
                        c.getRowGame() == request.getRow() &&
                        c.getColumnGame() == request.getColumn())
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Cell not found"));

        if (cell.getFilledBy() != null) {
            return new ValidationResponseTikTak(false, "Cell already occupied");
        }

        String rowCriteria = criteriaDao.findByAxisAndGameId("row", gameId).stream()
                .filter(c -> c.getPositionGame() == request.getRow())
                .findFirst().get().getCode();

        String columnCriteria = criteriaDao.findByAxisAndGameId("column", gameId).stream()
                .filter(c -> c.getPositionGame() == request.getColumn())
                .findFirst().get().getCode();




        boolean valid = validationService.validatePilot(rowCriteria, columnCriteria, request.getPiloto());

        if (!valid) {
            return new ValidationResponseTikTak(false, "Invalid pilot for selected cell");
        }

        cell.setFilledBy(game.getCurrentTurn());
        cell.setPiloto(request.getPiloto());
        cell.setValid(true);
        cellDao.save(cell);

        // Check winner or draw
        String newStatus = checkWinnerOrDraw(game);
        game.setStatus(newStatus);

        // Switch turn
        if (newStatus.equals("IN_PROGRESS")) {
            game.setCurrentTurn(game.getCurrentTurn().equals("X") ? "O" : "X");
        }

        gameDao.save(game);

        return new ValidationResponseTikTak(true, "Correct move");
    }

    @Override
    public List<TikiTakaCriteria> getAllCriteria() {
        return criteriaDao.findAll();
    }


    @Override
    public void skipTurn(Long gameId) {
        TikiTakaGame game = getGame(gameId);
        if (!game.getStatus().equals("IN_PROGRESS")) return;

        game.setCurrentTurn(game.getCurrentTurn().equals("X") ? "O" : "X");
        gameDao.save(game);
    }

}

