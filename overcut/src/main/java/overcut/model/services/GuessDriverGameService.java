package overcut.model.services;

import overcut.model.entities.GuessDriverGame;
import overcut.model.entities.GuessDriverQuestion;

import java.util.List;

public interface GuessDriverGameService {

    GuessDriverGame startGame(Long userId);

    GuessDriverQuestion askQuestion(Long gameId, String category, String value, String lang);

    GuessDriverGame guessPilot(Long gameId, String guessedName);

    GuessDriverGame getGameStatus(Long gameId);

    List<String> getRecommendations(String category, String lang);

    List<String> autocompletePilotNames(String partial);
}
