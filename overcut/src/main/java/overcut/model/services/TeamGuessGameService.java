package overcut.model.services;

import overcut.model.entities.TeamGuessGame;

import java.util.List;

public interface TeamGuessGameService {
    TeamGuessGame startGame();
    TeamGuessGame guessTeam(Long gameId, String teamGuess);
    TeamGuessGame getGameStatus(Long gameId);
    List<String> autocompleteTeamNames(String partial);
}

