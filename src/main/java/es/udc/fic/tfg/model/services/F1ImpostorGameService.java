package es.udc.fic.tfg.model.services;

import es.udc.fic.tfg.model.entities.F1ImpostorGame;

import java.util.List;

public interface F1ImpostorGameService {
    F1ImpostorGame startGame(String lang);
    F1ImpostorGame validateSelection(Long gameId, List<String> selectedPilotNames);
    F1ImpostorGame getGameStatus(Long gameId);
}
