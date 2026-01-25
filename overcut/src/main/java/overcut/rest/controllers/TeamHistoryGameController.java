package overcut.rest.controllers;

import org.springframework.web.bind.annotation.*;
import overcut.model.services.TeamHistoryGameService;
import overcut.rest.dtos.TeamHistoryGameDto;
import overcut.rest.dtos.ValidateTeamHistoryGuessRequest;
import overcut.rest.dtos.ValidateTeamHistoryGuessResponse;

@RestController
@RequestMapping("/api/teamHistory")
public class TeamHistoryGameController {

    private final TeamHistoryGameService service;

    public TeamHistoryGameController(TeamHistoryGameService service) {
        this.service = service;
    }

    @PostMapping("/start")
    public TeamHistoryGameDto start(
            @RequestAttribute("userId") Long userId,
            @RequestParam(defaultValue = "es") String lang
    ) {
        return service.startGame(lang, userId);
    }

    @GetMapping("/game/{gameId}")
    public TeamHistoryGameDto get(@PathVariable Long gameId) {
        return service.getGame(gameId);
    }

    @PostMapping("/validate")
    public ValidateTeamHistoryGuessResponse validate(@RequestBody ValidateTeamHistoryGuessRequest req) {
        return service.validateGuess(req);
    }

    @PostMapping("/reveal/{gameId}")
    public TeamHistoryGameDto reveal(@PathVariable Long gameId) {
        return service.reveal(gameId);
    }
}
