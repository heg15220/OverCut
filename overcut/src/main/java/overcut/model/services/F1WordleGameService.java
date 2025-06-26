package overcut.model.services;

import overcut.model.entities.F1WordleGame;

public interface F1WordleGameService {
    F1WordleGame startGame(Long userId);
    F1WordleGame makeGuess(Long gameId, String guess);
    F1WordleGame getGameStatus(Long gameId);
}

