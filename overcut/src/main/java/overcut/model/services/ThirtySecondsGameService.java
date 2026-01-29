package overcut.model.services;

import overcut.model.entities.ThirtySecondsGame;
import java.util.List;

public interface ThirtySecondsGameService {
    ThirtySecondsGame startGame(Long userId, String lang);
    ThirtySecondsGame submitAnswers(Long gameId, List<String> answers);
    ThirtySecondsGame getGameStatus(Long gameId);
    List<String> autocompletePilotNames(String partial);
}
