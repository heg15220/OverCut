package overcut.model.services;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import overcut.model.entities.*;
import overcut.model.services.exceptions.CooldownException;

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
    private CrosswordCellWordLinkDao cellWordLinkDao;


    @Autowired
    private CrosswordGeneratorPythonAdapter crosswordGenerator;

    @Autowired
    private CooldownService cooldownService;



    // 1. Crear partida (llama al script Python, parsea, guarda entidades)
    @Override
    public Long createGame(Long userId, int rows, int cols, String language) {
        if (!language.equals("es") && !language.equals("en")) {
            throw new IllegalArgumentException("Unsupported language: " + language);
        }
     /*   if (!cooldownService.canPlay("Crossword", userId)) {
            long wait = cooldownService.secondsUntilNextPlay("Crossword", userId);
            throw new CooldownException("WAIT", wait);
        }
*/

        CrosswordGame game = new CrosswordGame();
        game.setRows(rows);
        game.setCols(cols);
        game = gameDao.save(game);

        List<CrosswordGeneratorPythonAdapter.CrosswordWordData> wordsData =
                crosswordGenerator.generateCrossword(rows, cols, language);

        Map<String, CrosswordCell> cellMap = new HashMap<>(); // clave: "row-col"
        List<CrosswordWord> words = new ArrayList<>();
        List<CrosswordCell> allCells = new ArrayList<>();
        List<CrosswordCellWordLink> allLinks = new ArrayList<>();

        for (CrosswordGeneratorPythonAdapter.CrosswordWordData data : wordsData) {
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

            List<CrosswordCellWordLink> cellLinks = new ArrayList<>();

            for (int i = 0; i < data.word.length(); i++) {
                int row = data.row + (directionValue.equals("VERTICAL") ? i : 0);
                int col = data.col + (directionValue.equals("HORIZONTAL") ? i : 0);
                String key = row + "-" + col;

                CrosswordCell cell;
                if (cellMap.containsKey(key)) {
                    cell = cellMap.get(key);
                } else {
                    cell = new CrosswordCell();
                    cell.setLetter(data.word.charAt(i));
                    cell.setFilled(false);
                    cell.setUserInput(null);
                    cell.setModifiedByUser(false);
                    cellMap.put(key, cell);
                    allCells.add(cell);
                }

                // ⚠️ Por ahora no añadimos los links aquí
                // Ya los haremos después de guardar las celdas
            }

            words.add(word);
        }

        game.setWords(words);
        gameDao.save(game); // guarda game y palabras

        // 🟢 Ahora sí: guardamos las celdas y ya tienen IDs válidos
        cellDao.saveAll(allCells);

        // 🔄 Crear los links ahora, usando celdas y palabras ya persistidas
        for (CrosswordWord word : words) {
            String directionValue = word.getDirection().name();
            List<CrosswordCellWordLink> cellLinks = new ArrayList<>();

            for (int i = 0; i < word.getWord().length(); i++) {
                int row = word.getRowIndex() + (directionValue.equals("VERTICAL") ? i : 0);
                int col = word.getCol() + (directionValue.equals("HORIZONTAL") ? i : 0);
                String key = row + "-" + col;

                CrosswordCell cell = cellMap.get(key); // ya guardada
                CrosswordCellWordLink link = new CrosswordCellWordLink(cell, word, i);
                cellLinks.add(link);
                allLinks.add(link);
            }

            word.setCellLinks(cellLinks);
        }

        // 🔐 Guardar los links ahora que todo tiene ID
        cellWordLinkDao.saveAll(allLinks);

        //cooldownService.registerPlay("Crossword", userId);
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
        return cellDao.findCellsWithLinksByGameId(gameId);
    }


    // 4. Obtener todas las palabras de la partida
    @Override
    public List<CrosswordWord> getWordsByGame(Long gameId) {
        Optional<CrosswordGame> gameOpt = gameDao.findById(gameId);
        return gameOpt.map(CrosswordGame::getWords).orElse(Collections.emptyList());
    }

    // 5. Actualizar input del usuario para una celda concreta
    @Override
    public CrosswordCell updateCellUserInput(Long cellId, Character userInput) throws Exception {
        CrosswordCell cell = cellDao.findCellWithLinksById(cellId)
                .orElseThrow(() -> new Exception("Cell not found"));

        cell.setUserInput(userInput);
        cell.setFilled(userInput != null && userInput.equals(cell.getLetter()));
        cell.setModifiedByUser(true);
        cellDao.save(cell);
        return cell;
    }





    private boolean validatePartialWord(CrosswordWord word) {
        List<CrosswordCell> cells = word.getCrosswordCellsFromLinks(); // 🟢 Cambiado
        if (cells == null || cells.isEmpty()) return false;

        for (CrosswordCell cell : cells) {
            if (cell.getUserInput() != null) {
                Character expected = Character.toUpperCase(cell.getLetter());
                Character current = Character.toUpperCase(cell.getUserInput());
                if (!expected.equals(current)) {
                    return false;
                }
            }
        }
        return true;
    }

    private String sanitize(String input) {
        if (input == null) return "";
        return input.trim().toUpperCase().replaceAll("\\s+", "");
    }
    // 6. Comprobar si una celda es correcta

    @Override
    public boolean checkCell(Long cellId, Character userInput) {
        CrosswordCell cell = cellDao.findById(cellId)
                .orElseThrow(() -> new NoSuchElementException("Cell not found"));

        Character expectedLetter = Character.toUpperCase(cell.getLetter());
        Character userChar = (userInput != null) ? Character.toUpperCase(userInput) : null;

        if (userChar == null || !expectedLetter.equals(userChar)) {
            return false;
        }

        // Si pertenece a más de una palabra, validar también las otras palabras
        List<CrosswordWord> relatedWords = wordDao.findAllByCrosswordCellId(cellId);

        for (CrosswordWord word : relatedWords) {
            if (!validatePartialWord(word)) {
                return false;
            }
        }

        return true;
    }

    // 7. Comprobar si una palabra es correcta
    @Override
    public Boolean checkWord(Long wordId, String userInput, String language) throws IOException {
        CrosswordWord word = wordDao.findById(wordId)
                .orElseThrow(() -> new NoSuchElementException("Word not found"));

        boolean wasModified = word.getCrosswordCellsFromLinks().stream() // 🟢 Cambiado
                .anyMatch(CrosswordCell::isModifiedByUser);
        if (!wasModified) {
            return null;
        }

        for (CrosswordCell cell : word.getCrosswordCellsFromLinks()) { // 🟢 Cambiado
            if (!cell.isModifiedByUser() ||
                    cell.getUserInput() == null ||
                    Character.toUpperCase(cell.getUserInput()) != Character.toUpperCase(cell.getLetter())) {
                return false;
            }
        }

        for (CrosswordCell cell : word.getCrosswordCellsFromLinks()) { // 🟢 Cambiado
            cell.setFilled(true);
            cellDao.save(cell);
        }

        return crosswordGenerator.validateUserAnswer(userInput, word.getClue(), language);
    }






    // 8. Comprobar si la partida está completada
    @Override
    public boolean checkGame(Long gameId) {
        Optional<CrosswordGame> gameOpt = gameDao.findById(gameId);
        if (gameOpt.isEmpty()) return false;
        for (CrosswordWord word : gameOpt.get().getWords()) {
            for (CrosswordCell cell : word.getCrosswordCellsFromLinks()) { // 🟢 Cambiado
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
            for (CrosswordCell cell : word.getCrosswordCellsFromLinks()) { // 🟢 Cambiado
                cell.setUserInput(null);
                cell.setFilled(false);
                cell.setModifiedByUser(false);
                cellDao.save(cell);
            }
        }
    }
}
