package overcut.rest.controllers;


import overcut.model.entities.TeamGuessGame;
import overcut.model.services.TeamGuessGameService;
import overcut.rest.dtos.TeamGuessGameConversor;
import overcut.rest.dtos.TeamGuessGameDto;
import overcut.rest.dtos.GuessTeamRequestDto;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/teamGuess")
public class TeamGuessGameController {

    @Autowired
    private TeamGuessGameService teamGuessGameService;

    @PostMapping("/start")
    public TeamGuessGameDto startGame() {
        TeamGuessGame game = teamGuessGameService.startGame();
        return TeamGuessGameConversor.toDto(game);
    }

    @PostMapping("/guess")
    public TeamGuessGameDto guessTeam(@RequestBody GuessTeamRequestDto request) {
        TeamGuessGame game = teamGuessGameService.guessTeam(
                request.getGameId(), request.getTeamGuess()
        );
        return TeamGuessGameConversor.toDto(game);
    }

    @GetMapping("/status/{gameId}")
    public TeamGuessGameDto getGameStatus(@PathVariable Long gameId) {
        TeamGuessGame game = teamGuessGameService.getGameStatus(gameId);
        return TeamGuessGameConversor.toDto(game);
    }

    @GetMapping("/autocomplete")
    public List<String> autocompleteTeamNames(@RequestParam String partial) {
        return teamGuessGameService.autocompleteTeamNames(partial);
    }
}

