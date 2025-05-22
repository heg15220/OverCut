package overcut.model.services;

import overcut.model.entities.F1ImpostorGame;

import java.util.List;

public interface F1ImpostorGameService {
    F1ImpostorGame startGame(String lang);
    F1ImpostorGame validateSelection(Long gameId, List<String> selectedPilotNames);
    F1ImpostorGame getGameStatus(Long gameId);
}
