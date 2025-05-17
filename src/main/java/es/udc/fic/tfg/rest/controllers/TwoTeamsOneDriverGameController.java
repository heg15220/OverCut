package es.udc.fic.tfg.rest.controllers;

import es.udc.fic.tfg.model.services.TwoTeamsOneDriverGameService;
import es.udc.fic.tfg.rest.dtos.GuessDriverRequestDto;
import es.udc.fic.tfg.rest.dtos.TwoTeamsOneDriverGameConversor;
import es.udc.fic.tfg.rest.dtos.TwoTeamsOneDriverGameDto;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/twoTeamsGame")
public class TwoTeamsOneDriverGameController {

    @Autowired
    private TwoTeamsOneDriverGameService service;

    @PostMapping("/start")
    public TwoTeamsOneDriverGameDto startGame() {
        return TwoTeamsOneDriverGameConversor.toDto(service.startGame());
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
