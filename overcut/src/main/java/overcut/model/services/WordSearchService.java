package overcut.model.services;

import overcut.model.entities.WordSearchGame;

import java.util.List;

public interface WordSearchService {
    WordSearchGame startGame(Long userId);

    WordSearchGame getGame(Long gameId);

    WordSearchGame submitSolution(Long gameId, List<String> foundSurnames); // opcional si hay validación final

    boolean validateWord(Long gameId, String attemptedSurname);

    WordSearchGame revealWords(Long gameId);
}
