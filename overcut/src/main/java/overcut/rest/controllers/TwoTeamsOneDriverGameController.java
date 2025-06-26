package overcut.rest.controllers;

import overcut.rest.dtos.GuessDriverRequestDto;
import overcut.model.services.TwoTeamsOneDriverGameService;
import overcut.rest.dtos.TwoTeamsOneDriverGameConversor;
import overcut.rest.dtos.TwoTeamsOneDriverGameDto;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/twoTeamsGame")
public class TwoTeamsOneDriverGameController {

    @Autowired
    private TwoTeamsOneDriverGameService service;

    @PostMapping("/start")
    public TwoTeamsOneDriverGameDto startGame(@RequestAttribute("userId") Long userId) {
        return TwoTeamsOneDriverGameConversor.toDto(service.startGame(userId));
    }

    @PostMapping("/guess")
    public TwoTeamsOneDriverGameDto guessDriver(@RequestBody GuessDriverRequestDto request) {
        return TwoTeamsOneDriverGameConversor.toDto(service.guessDriver(request.getGameId(), request.getDriverGuess()));
    }

    @PostMapping("/skip/{gameId}")
    public TwoTeamsOneDriverGameDto skipPair(@PathVariable Long gameId) {
        return TwoTeamsOneDriverGameConversor.toDto(service.skipPair(gameId));
    }

    @GetMapping("/status/{gameId}")
    public TwoTeamsOneDriverGameDto getStatus(@PathVariable Long gameId) {
        return TwoTeamsOneDriverGameConversor.toDto(service.getGameStatus(gameId));
    }

    @GetMapping("/autocomplete")
    public List<String> autocomplete(@RequestParam String partial) {
        return service.autocompletePilotNames(partial);
    }
}
