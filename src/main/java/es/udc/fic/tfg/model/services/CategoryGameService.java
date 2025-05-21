package es.udc.fic.tfg.model.services;

import es.udc.fic.tfg.model.entities.CategoryGame;

import java.util.Map;

public interface CategoryGameService {
    CategoryGame startGame(String lang);
    CategoryGame submitAnswers(Long gameId, Map<String, String> answers, String lang);
    CategoryGame getGameStatus(Long gameId);
}
