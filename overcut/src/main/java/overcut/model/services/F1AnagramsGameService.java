package overcut.model.services;

import overcut.model.entities.F1AnagramsGame;

public interface F1AnagramsGameService {
    F1AnagramsGame startGame(Long userId);
    F1AnagramsGame makeGuess(Long gameId, String guess);
    F1AnagramsGame getGameStatus(Long gameId);
}
