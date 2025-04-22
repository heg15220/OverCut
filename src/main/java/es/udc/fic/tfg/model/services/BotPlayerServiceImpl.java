package es.udc.fic.tfg.model.services;

import es.udc.fic.tfg.model.entities.*;
import es.udc.fic.tfg.utils.BotUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class BotPlayerServiceImpl implements BotPlayerService {

    @Autowired
    private TikiTakaCellDao cellDao;

    @Autowired
    private TikiTakaGameDao gameDao;

    @Autowired
    private TikiTakaCriteriaDao criteriaDao;

    @Autowired
    private ValidationGameService validationService;


    private boolean isWinningGrid(String[][] grid, String player) {
        for (int i = 0; i < 3; i++) {
            if ((player.equals(grid[i][0]) && player.equals(grid[i][1]) && player.equals(grid[i][2])) ||
                    (player.equals(grid[0][i]) && player.equals(grid[1][i]) && player.equals(grid[2][i]))) {
                return true;
            }
        }
        return (player.equals(grid[0][0]) && player.equals(grid[1][1]) && player.equals(grid[2][2])) ||
                (player.equals(grid[0][2]) && player.equals(grid[1][1]) && player.equals(grid[2][0]));
    }



    private TikiTakaCell findWinningMove(List<TikiTakaCell> cells, String[][] grid, String player) {
        for (TikiTakaCell cell : cells) {
            int row = cell.getRowGame() - 1;
            int col = cell.getColumnGame() - 1;

            if (grid[row][col] != null) continue;

            grid[row][col] = player;
            boolean win = isWinningGrid(grid, player);
            grid[row][col] = null;

            if (win) return cell;
        }
        return null;
    }


    private void realizarJugada(TikiTakaCell cell, TikiTakaGame game) {
        String rowCrit = criteriaDao.findByAxisAndGameId("row", game.getId()).stream()
                .filter(c -> c.getPositionGame() == cell.getRowGame())
                .findFirst().get().getCode();

        String colCrit = criteriaDao.findByAxisAndGameId("column", game.getId()).stream()
                .filter(c -> c.getPositionGame() == cell.getColumnGame())
                .findFirst().get().getCode();

        List<String> pilotos = BotUtils.getValidPilots(rowCrit, colCrit, game.getSinceYear(), game.getEndYear());
        if (!pilotos.isEmpty()) {
            cell.setFilledBy("O");
            cell.setPiloto(pilotos.get(0));
            cell.setValid(true);
            cellDao.save(cell);
        }
    }


    @Override
    public void playAsBot(TikiTakaGame game) {
        if (!"O".equals(game.getCurrentTurn()) || !"BOT".equals(game.getPlayerO())) return;

        List<TikiTakaCell> allCells = cellDao.findByGameId(game.getId());
        List<TikiTakaCell> emptyCells = allCells.stream()
                .filter(c -> c.getFilledBy() == null)
                .toList();

        String[][] grid = new String[3][3];
        for (TikiTakaCell cell : allCells) {
            if (cell.getFilledBy() != null) {
                grid[cell.getRowGame() - 1][cell.getColumnGame() - 1] = cell.getFilledBy();
            }
        }

        // 1. Intentar ganar
        TikiTakaCell winningMove = findWinningMove(emptyCells, grid, "O");
        if (winningMove != null) {
            realizarJugada(winningMove, game);
            return;
        }

        // 2. Intentar bloquear a X
        TikiTakaCell blockingMove = findWinningMove(emptyCells, grid, "X");
        if (blockingMove != null) {
            realizarJugada(blockingMove, game);
            return;
        }

        // 3. Jugada aleatoria válida
        for (TikiTakaCell cell : emptyCells) {
            String rowCrit = criteriaDao.findByAxisAndGameId("row", game.getId()).stream()
                    .filter(c -> c.getPositionGame() == cell.getRowGame())
                    .findFirst().get().getCode();

            String colCrit = criteriaDao.findByAxisAndGameId("column", game.getId()).stream()
                    .filter(c -> c.getPositionGame() == cell.getColumnGame())
                    .findFirst().get().getCode();

            List<String> pilotos = BotUtils.getValidPilots(rowCrit, colCrit, game.getSinceYear(), game.getEndYear());
            if (!pilotos.isEmpty()) {
                cell.setFilledBy("O");
                cell.setPiloto(pilotos.get(0));
                cell.setValid(true);
                cellDao.save(cell);
                break;
            }
        }

        // Check de victoria y cambio de turno
        game.setStatus(checkWinnerOrDraw(game));
        if ("IN_PROGRESS".equals(game.getStatus())) {
            game.setCurrentTurn("X");
        }
        gameDao.save(game);
    }



    private String checkWinnerOrDraw(TikiTakaGame game) {
        List<TikiTakaCell> cells = game.getCells();

        String[][] grid = new String[3][3];

        for (TikiTakaCell cell : cells) {
            grid[cell.getRowGame() - 1][cell.getColumnGame() - 1] = cell.getFilledBy();
        }

        String[] players = {"X", "O"};

        for (String player : players) {
            // Filas y columnas
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

        boolean draw = cells.stream().allMatch(c -> c.getFilledBy() != null);
        return draw ? "DRAW" : "IN_PROGRESS";
    }



}

