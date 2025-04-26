package es.udc.fic.tfg.model.services;

import es.udc.fic.tfg.model.entities.CrosswordGame;
import es.udc.fic.tfg.model.entities.CrosswordWord;
import es.udc.fic.tfg.model.entities.CrosswordCell;

import java.util.List;
import java.util.Optional;

public interface CrosswordService {

    Long createGame(int rows, int cols, String language);

    CrosswordGame getGame(Long gameId);

    List<CrosswordCell> getCellsByGame(Long gameId);

    List<CrosswordWord> getWordsByGame(Long gameId);

    void updateCellUserInput(Long cellId, Character userInput) throws Exception;

    boolean checkCell(Long cellId, Character userInput);

    boolean checkWord(Long wordId, String userInput);

    boolean checkGame(Long gameId);

    void resetGame(Long gameId);
}
