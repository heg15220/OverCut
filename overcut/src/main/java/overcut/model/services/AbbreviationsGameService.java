package overcut.model.services;

import overcut.model.entities.AbbreviationsGame;
import java.util.List;

public interface AbbreviationsGameService {
    AbbreviationsGame startGame(Long userId, String lang);
    AbbreviationsGame guess(Long gameId, String guessText);
    AbbreviationsGame getGameStatus(Long gameId);
    List<String> autocompletePilotNames(String partial);
}
