package overcut.model.services;

import overcut.model.entities.HigherLowerGame;

public interface HigherLowerGameService {
    HigherLowerGame startGame(String lang, Long userId);
    HigherLowerGame guess(Long gameId, String direction); // "higher" | "lower"
    HigherLowerGame getGameStatus(Long gameId);
}
