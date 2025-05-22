package overcut.rest.controllers;

import overcut.model.services.DriversLinkGameService;
import overcut.rest.dtos.DriversLinkGameConversor;
import overcut.rest.dtos.DriversLinkGameDto;
import overcut.rest.dtos.GuessDriverRequestDto;
import overcut.model.entities.DriversLinkGame;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/driversLink")
public class DriversLinkGameController {

    @Autowired
    private DriversLinkGameService driversLinkGameService;

    @PostMapping("/start")
    public DriversLinkGameDto startGame() {
        DriversLinkGame game = driversLinkGameService.startGame();
        return DriversLinkGameConversor.toDto(game);
    }

    @PostMapping("/guess")
    public DriversLinkGameDto guessDriver(@RequestBody GuessDriverRequestDto request) {
        DriversLinkGame game = driversLinkGameService.guessDriver(
                request.getGameId(), request.getDriverGuess()
        );
        return DriversLinkGameConversor.toDto(game);
    }

    @GetMapping("/status/{gameId}")
    public DriversLinkGameDto getGameStatus(@PathVariable Long gameId) {
        DriversLinkGame game = driversLinkGameService.getGameStatus(gameId);
        return DriversLinkGameConversor.toDto(game);
    }

    @GetMapping("/autocomplete")
    public List<String> autocompletePilotNames(@RequestParam String partial) {
        return driversLinkGameService.autocompletePilotNames(partial);
    }
    @PostMapping("/skip/{gameId}")
    public DriversLinkGameDto skipClue(@PathVariable Long gameId) {
        DriversLinkGame game = driversLinkGameService.skipClue(gameId);
        return DriversLinkGameConversor.toDto(game);
    }

}

