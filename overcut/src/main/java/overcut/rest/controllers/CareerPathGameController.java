package overcut.rest.controllers;

import overcut.model.entities.CareerPathGame;
import overcut.rest.dtos.CareerPathGameConversor;
import overcut.rest.dtos.GuessDriverRequestDto;
import overcut.model.services.CareerPathGameService;
import overcut.rest.dtos.CareerPathGameDto;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/careerPath")
public class CareerPathGameController {

    @Autowired
    private CareerPathGameService careerPathGameService;

    @PostMapping("/start")
    public CareerPathGameDto startGame() {
        CareerPathGame game = careerPathGameService.startGame();
        return CareerPathGameConversor.toDto(game);
    }

    @PostMapping("/guess")
    public CareerPathGameDto guessDriver(@RequestBody GuessDriverRequestDto request) {
        CareerPathGame game = careerPathGameService.guessDriver(
                request.getGameId(), request.getDriverGuess()
        );
        return CareerPathGameConversor.toDto(game);
    }

    @GetMapping("/status/{gameId}")
    public CareerPathGameDto getGameStatus(@PathVariable Long gameId) {
        CareerPathGame game = careerPathGameService.getGameStatus(gameId);
        return CareerPathGameConversor.toDto(game);
    }

    @GetMapping("/autocomplete")
    public List<String> autocompletePilotNames(@RequestParam String partial) {
        return careerPathGameService.autocompletePilotNames(partial);
    }

    @PostMapping("/skip/{gameId}")
    public CareerPathGameDto skipClue(@PathVariable Long gameId) {
        CareerPathGame game = careerPathGameService.skipClue(gameId);
        return CareerPathGameConversor.toDto(game);
    }
}
