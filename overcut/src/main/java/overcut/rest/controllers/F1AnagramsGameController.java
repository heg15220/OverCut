package overcut.rest.controllers;

import overcut.model.services.F1AnagramsGameService;
import overcut.rest.dtos.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/anagrams")
public class F1AnagramsGameController {

    @Autowired
    private F1AnagramsGameService gameService;

    @PostMapping("/start")
    public F1AnagramsGameDto startGame(@RequestAttribute("userId") Long userId) {
        return F1AnagramsGameConversor.toDto(gameService.startGame(userId));
    }

    @PostMapping("/guess")
    public F1AnagramsGameDto makeGuess(@RequestBody AnagramsGuessRequestDto request) {
        return F1AnagramsGameConversor.toDto(
                gameService.makeGuess(request.getGameId(), request.getGuess())
        );
    }

    @GetMapping("/status/{gameId}")
    public F1AnagramsGameDto getStatus(@PathVariable Long gameId) {
        return F1AnagramsGameConversor.toDto(gameService.getGameStatus(gameId));
    }
}
