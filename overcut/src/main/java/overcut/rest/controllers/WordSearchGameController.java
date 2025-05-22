package overcut.rest.controllers;

import overcut.model.entities.WordSearchGame;
import overcut.rest.dtos.*;
import overcut.model.services.WordSearchService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/wordSearch")
public class WordSearchGameController {

    @Autowired
    private WordSearchService wordSearchService;

    @PostMapping("/start")
    public WordSearchGameDto startGame() {
        WordSearchGame game = wordSearchService.startGame();
        return WordSearchConversor.toDto(game);
    }

    @GetMapping("/{gameId}")
    public WordSearchGameDto getGame(@PathVariable Long gameId) {
        WordSearchGame game = wordSearchService.getGame(gameId);
        return WordSearchConversor.toDto(game);
    }

    @PostMapping("/validate")
    public WordSearchGameDto validateWord(@RequestBody WordSearchValidateRequestDto request) {
        wordSearchService.validateWord(request.getGameId(), request.getAttemptedSurname());
        WordSearchGame updatedGame = wordSearchService.getGame(request.getGameId());
        return WordSearchConversor.toDto(updatedGame);
    }

    @PostMapping("/submit")
    public WordSearchGameDto submitSolution(@RequestBody WordSearchSubmitRequestDto request) {
        WordSearchGame game = wordSearchService.submitSolution(
                request.getGameId(),
                request.getFoundSurnames()
        );
        return WordSearchConversor.toDto(game);
    }

    @PostMapping("/reveal")
    public WordSearchGameDto revealWords(@RequestBody WordSearchRevealRequestDto request) {
        WordSearchGame game = wordSearchService.revealWords(request.getGameId());
        return WordSearchConversor.toDto(game);
    }

}
