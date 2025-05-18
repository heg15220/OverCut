package es.udc.fic.tfg.model.services;

import es.udc.fic.tfg.model.entities.TeamGuessGame;

import java.util.List;

public interface TeamGuessGameService {
    TeamGuessGame startGame();
    TeamGuessGame guessTeam(Long gameId, String teamGuess);
    TeamGuessGame getGameStatus(Long gameId);
    List<String> autocompleteTeamNames(String partial);
}

