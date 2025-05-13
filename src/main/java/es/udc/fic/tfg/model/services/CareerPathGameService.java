package es.udc.fic.tfg.model.services;

import es.udc.fic.tfg.model.entities.CareerPathGame;

import java.util.List;

public interface CareerPathGameService {
    CareerPathGame startGame();
    CareerPathGame guessDriver(Long gameId, String driverGuess);
    CareerPathGame getGameStatus(Long gameId);
    CareerPathGame skipClue(Long gameId);
    List<String> autocompletePilotNames(String partial);
}
