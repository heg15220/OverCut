package es.udc.fic.tfg.rest.controllers;

import es.udc.fic.tfg.model.entities.DriversLinkGame;
import es.udc.fic.tfg.model.services.DriversLinkGameService;
import es.udc.fic.tfg.rest.dtos.DriversLinkGameConversor;
import es.udc.fic.tfg.rest.dtos.DriversLinkGameDto;
import es.udc.fic.tfg.rest.dtos.GuessDriverRequestDto;
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
}

