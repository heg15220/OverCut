package overcut.model.services;

import overcut.model.entities.CrosswordCell;
import overcut.model.entities.CrosswordGame;
import overcut.model.entities.CrosswordWord;

import java.io.IOException;
import java.util.List;

public interface CrosswordService {

    Long createGame(Long userId, int rows, int cols, String language);

    CrosswordGame getGame(Long gameId);

    List<CrosswordCell> getCellsByGame(Long gameId);

    List<CrosswordWord> getWordsByGame(Long gameId);

    CrosswordCell updateCellUserInput(Long cellId, Character userInput) throws Exception;

    boolean checkCell(Long cellId, Character userInput);

    Boolean checkWord(Long wordId, String userInput, String language) throws IOException;


    boolean checkGame(Long gameId);

    void resetGame(Long gameId);
}
