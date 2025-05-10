package es.udc.fic.tfg.model.services;

import es.udc.fic.tfg.model.entities.GuessDriverGame;
import es.udc.fic.tfg.model.entities.GuessDriverQuestion;

import java.util.List;

public interface GuessDriverGameService {

    GuessDriverGame startGame();

    GuessDriverQuestion askQuestion(Long gameId, String category, String value, String lang);

    GuessDriverGame guessPilot(Long gameId, String guessedName);

    GuessDriverGame getGameStatus(Long gameId);

    List<String> getRecommendations(String category);
}
