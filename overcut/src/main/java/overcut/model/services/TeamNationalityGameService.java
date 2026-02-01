package overcut.model.services;

import overcut.model.entities.TeamNationalityGame;
import java.util.List;

public interface TeamNationalityGameService {
    TeamNationalityGame startGame(Long userId, String lang);
    TeamNationalityGame guessDriver(Long gameId, String driverName); // incremental
    TeamNationalityGame getGameStatus(Long gameId);
    List<String> autocompletePilotNames(String partial);
}
