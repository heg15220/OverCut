package overcut.model.services;


import overcut.model.entities.DriversConnectionsGame;

import java.util.List;

public interface DriversConnectionsGameService {

    DriversConnectionsGame startGame(String lang, Long userId);

    boolean validateGroup(Long gameId, List<String> selectedDriverNames);

    DriversConnectionsGame revealAnswers(Long gameId);

}

