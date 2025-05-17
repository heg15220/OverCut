package es.udc.fic.tfg.rest.controllers;

import es.udc.fic.tfg.model.services.F1WordleGameService;
import es.udc.fic.tfg.rest.dtos.F1WordleGameConversor;
import es.udc.fic.tfg.rest.dtos.F1WordleGameDto;
import es.udc.fic.tfg.rest.dtos.GuessDriverRequestDto;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/wordle")
public class F1WordleGameController {

    @Autowired
    private F1WordleGameService gameService;

    @PostMapping("/start")
    public F1WordleGameDto startGame() {
        return F1WordleGameConversor.toDto(gameService.startGame());
    }

    @PostMapping("/guess")
    public F1WordleGameDto makeGuess(@RequestBody GuessDriverRequestDto request) {
        return F1WordleGameConversor.toDto(gameService.makeGuess(request.getGameId(), request.getDriverGuess()));
    }

    @GetMapping("/status/{gameId}")
    public F1WordleGameDto getStatus(@PathVariable Long gameId) {
        return F1WordleGameConversor.toDto(gameService.getGameStatus(gameId));
    }
}

