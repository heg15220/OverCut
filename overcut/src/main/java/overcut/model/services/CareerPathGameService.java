package overcut.model.services;

import overcut.model.entities.CareerPathGame;

import java.util.List;

public interface CareerPathGameService {
    CareerPathGame startGame(Long userId);
    CareerPathGame guessDriver(Long gameId, String driverGuess);
    CareerPathGame getGameStatus(Long gameId);
    CareerPathGame skipClue(Long gameId);
    List<String> autocompletePilotNames(String partial);
}
