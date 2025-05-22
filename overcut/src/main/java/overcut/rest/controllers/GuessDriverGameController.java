package overcut.rest.controllers;

import overcut.model.entities.GuessDriverGame;
import overcut.model.entities.GuessDriverQuestion;
import overcut.model.services.GuessDriverGameService;
import overcut.rest.dtos.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/guessDriver")
public class GuessDriverGameController {

    @Autowired
    private GuessDriverGameService guessDriverGameService;

    @PostMapping("/start")
    public GuessDriverGameDto startGame() {
        GuessDriverGame game = guessDriverGameService.startGame();
        return GuessDriverGameConversor.toDto(game);
    }

    @PostMapping("/ask")
    public GuessDriverQuestionDto askQuestion(@RequestBody AskQuestionRequestDto request) {
        GuessDriverQuestion question = guessDriverGameService.askQuestion(
                request.getGameId(),
                request.getCategory(),
                request.getValue(),
                request.getLang()
        );
        return GuessDriverQuestionConversor.toDto(question);
    }

    @PostMapping("/guess")
    public GuessDriverGameDto guessPilot(@RequestBody GuessPilotRequestDto request) {
        GuessDriverGame game = guessDriverGameService.guessPilot(
                request.getGameId(),
                request.getGuess()
        );
        return GuessDriverGameConversor.toDto(game);
    }

    @GetMapping("/status/{gameId}")
    public GuessDriverGameDto getGameStatus(@PathVariable Long gameId) {
        GuessDriverGame game = guessDriverGameService.getGameStatus(gameId);
        return GuessDriverGameConversor.toDto(game);
    }

    @GetMapping("/recommendations")
    public List<String> getRecommendations(@RequestParam String category, @RequestParam(defaultValue = "es") String lang) {
        return guessDriverGameService.getRecommendations(category, lang);
    }


    @GetMapping("/autocomplete")
    public List<String> autocompleteGuessDriverPilot(@RequestParam String partial) {
        return guessDriverGameService.autocompletePilotNames(partial);
    }

}
