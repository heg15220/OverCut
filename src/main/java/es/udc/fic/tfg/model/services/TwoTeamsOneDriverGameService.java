package es.udc.fic.tfg.model.services;

import es.udc.fic.tfg.model.entities.TwoTeamsOneDriverGame;

import java.util.List;

public interface TwoTeamsOneDriverGameService {
    TwoTeamsOneDriverGame startGame();
    TwoTeamsOneDriverGame guessDriver(Long gameId, String driverGuess);
    TwoTeamsOneDriverGame skipPair(Long gameId);
    TwoTeamsOneDriverGame getGameStatus(Long gameId);
    List<String> autocompletePilotNames(String partial);
}

