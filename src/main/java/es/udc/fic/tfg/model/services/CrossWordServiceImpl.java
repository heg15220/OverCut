package es.udc.fic.tfg.model.services;

import es.udc.fic.tfg.model.entities.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.expression.ExpressionException;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.util.*;

@Service
public class CrossWordServiceImpl implements CrosswordService{

    @Autowired
    private CrosswordGameDao gameDao;

    @Autowired
    private CrosswordWordDao wordDao;

    @Autowired
    private CrosswordCellDao cellDao;

    @Autowired
    private CrosswordGeneratorPythonAdapter crosswordGenerator;



    // 1. Crear partida (llama al script Python, parsea, guarda entidades)
    @Override
    public Long createGame(int rows, int cols, String language) {
        CrosswordGame game = new CrosswordGame();
        game.setRows(rows);
        game.setCols(cols);
        game = gameDao.save(game);

        try {
            List<CrosswordGeneratorPythonAdapter.CrosswordWordData> wordsData =
                    crosswordGenerator.generateCrossword(rows, cols, language);

            List<CrosswordWord> words = new ArrayList<>();
            for (CrosswordGeneratorPythonAdapter.CrosswordWordData data : wordsData) {
                // VALIDACIÓN
                if (data.direction == null || data.direction.trim().isEmpty()) {
                    throw new IllegalArgumentException("Direction nulo o vacío para palabra: " + data.word);
                }
                String directionValue = data.direction.trim().toUpperCase();
                if (!directionValue.equals("HORIZONTAL") && !directionValue.equals("VERTICAL")) {
                    throw new IllegalArgumentException("Valor inválido de direction: " + data.direction + " para palabra: " + data.word);
                }

                CrosswordWord word = new CrosswordWord();
                word.setGame(game);
                word.setWord(data.word);
                word.setClue(data.clue);
                word.setRowIndex(data.row);
                word.setCol(data.col);
                word.setDirection(Direction.valueOf(directionValue));
                // Resto igual
                List<CrosswordCell> cells = new ArrayList<>();
                for (int i = 0; i < data.word.length(); i++) {
                    CrosswordCell cell = new CrosswordCell();
                    cell.setWord(word);
                    cell.setLetter(data.word.charAt(i));
                    cell.setPositionCell(i);
                    cell.setFilled(false);
                    cell.setUserInput(null);
                    cells.add(cell);
                }
                word.setCrosswordCellList(cells);
                words.add(word);
            }
            game.setWords(words);
            game = gameDao.save(game);


        } catch (IOException e) {
            // Manejo de error: puedes lanzar excepción custom
            throw new RuntimeException("No se pudo generar el crucigrama: " + e.getMessage(), e);
        }

        return game.getId();
    }


    // 2. Obtener partida por id
    @Override
    public CrosswordGame getGame(Long gameId) {
        return gameDao.findGameById(gameId);
    }

    // 3. Obtener todas las celdas de la partida
    @Override
    public List<CrosswordCell> getCellsByGame(Long gameId) {
        Optional<CrosswordGame> gameOpt = gameDao.findById(gameId);
        if (gameOpt.isEmpty()) return Collections.emptyList();
        List<CrosswordCell> cells = new ArrayList<>();
        for (CrosswordWord word : gameOpt.get().getWords()) {
            cells.addAll(word.getCrosswordCellList()); // Necesita método getCells() en CrosswordWord
        }
        return cells;
    }

    // 4. Obtener todas las palabras de la partida
    @Override
    public List<CrosswordWord> getWordsByGame(Long gameId) {
        Optional<CrosswordGame> gameOpt = gameDao.findById(gameId);
        return gameOpt.map(CrosswordGame::getWords).orElse(Collections.emptyList());
    }

    // 5. Actualizar input del usuario para una celda concreta
    @Override
    public void updateCellUserInput(Long cellId, Character userInput) throws Exception{
        CrosswordCell cell = cellDao.findById(cellId)
                .orElseThrow(() -> new Exception("Cell not found"));
        cell.setUserInput(userInput);
        cell.setFilled(userInput != null && userInput.equals(cell.getLetter()));
        cellDao.save(cell);
    }

    // 6. Comprobar si una celda es correcta
    @Override
    public boolean checkCell(Long cellId, Character userInput) {
        CrosswordCell cell = cellDao.findById(cellId)
                .orElseThrow(() -> new NoSuchElementException("Cell not found"));
        return cell.getLetter() == Character.toUpperCase(userInput);
    }

    // 7. Comprobar si una palabra es correcta
    @Override
    public boolean checkWord(Long wordId, String userInput) {
        CrosswordWord word = wordDao.findById(wordId)
                .orElseThrow(() -> new NoSuchElementException("Word not found"));
        String solution = word.getWord().toUpperCase();
        return solution.equalsIgnoreCase(userInput.trim());
    }

    // 8. Comprobar si la partida está completada
    @Override
    public boolean checkGame(Long gameId) {
        Optional<CrosswordGame> gameOpt = gameDao.findById(gameId);
        if (gameOpt.isEmpty()) return false;
        for (CrosswordWord word : gameOpt.get().getWords()) {
            for (CrosswordCell cell : word.getCrosswordCellList()) {
                if (!cell.isFilled()) return false;
            }
        }
        return true;
    }

    // 9. Reiniciar la partida (vacía todos los userInput)
    @Override
    public void resetGame(Long gameId) {
        Optional<CrosswordGame> gameOpt = gameDao.findById(gameId);
        if (gameOpt.isEmpty()) return;
        for (CrosswordWord word : gameOpt.get().getWords()) {
            for (CrosswordCell cell : word.getCrosswordCellList()) {
                cell.setUserInput(null);
                cell.setFilled(false);
                cellDao.save(cell);
            }
        }
    }
}
