package overcut.model.services;

import overcut.model.entities.CategoryGame;

import java.util.Map;

public interface CategoryGameService {
    CategoryGame startGame(String lang);
    CategoryGame submitAnswers(Long gameId, Map<String, String> answers, String lang);
    CategoryGame getGameStatus(Long gameId);
}
