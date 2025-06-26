package overcut.rest.controllers;

import overcut.rest.dtos.F1WordleGameConversor;
import overcut.rest.dtos.GuessDriverRequestDto;
import overcut.model.services.F1WordleGameService;
import overcut.rest.dtos.F1WordleGameDto;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/wordle")
public class F1WordleGameController {

    @Autowired
    private F1WordleGameService gameService;

    @PostMapping("/start")
    public F1WordleGameDto startGame(@RequestAttribute("userId") Long userId) {
        return F1WordleGameConversor.toDto(gameService.startGame(userId));
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

