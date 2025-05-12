package es.udc.fic.tfg.model.services;

import es.udc.fic.tfg.model.entities.DriversLinkGame;

import java.util.List;

public interface DriversLinkGameService {
    DriversLinkGame startGame();
    DriversLinkGame guessDriver(Long gameId, String driverGuess);
    DriversLinkGame getGameStatus(Long gameId);
    List<String> autocompletePilotNames(String partial);
    DriversLinkGame skipClue(Long gameId);

}
