package es.udc.fic.tfg.rest.controllers;

import es.udc.fic.tfg.model.entities.WordSearchGame;
import es.udc.fic.tfg.model.services.WordSearchService;
import es.udc.fic.tfg.rest.dtos.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

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
    public WordSearchValidateResultDto validateWord(@RequestBody WordSearchValidateRequestDto request) {
        boolean result = wordSearchService.validateWord(
                request.getGameId(),
                request.getAttemptedSurname()
        );
        return new WordSearchValidateResultDto(result);
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
