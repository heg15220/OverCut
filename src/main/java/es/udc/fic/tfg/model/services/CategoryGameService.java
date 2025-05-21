package es.udc.fic.tfg.model.services;

import es.udc.fic.tfg.model.entities.CategoryGame;

import java.util.Map;

public interface CategoryGameService {
    CategoryGame startGame(String lang);
    CategoryGame submitAnswers(Long gameId, Map<String, String> answers);
    CategoryGame getGameStatus(Long gameId);
}
