package overcut.rest.controllers;

import org.springframework.web.bind.annotation.*;
import overcut.model.services.DriverSeasonGameService;
import overcut.rest.dtos.DriverSeasonGameDto;
import overcut.rest.dtos.ValidateDriverSeasonGuessRequest;
import overcut.rest.dtos.ValidateDriverSeasonGuessResponse;

@RestController
@RequestMapping("/api/driverSeason")
public class DriverSeasonGameController {

    private final DriverSeasonGameService service;

    public DriverSeasonGameController(DriverSeasonGameService service) {
        this.service = service;
    }

    // ✅ Igual que Rondo: userId viene en RequestAttribute
    @PostMapping("/start")
    public DriverSeasonGameDto start(
            @RequestAttribute("userId") Long userId,
            @RequestParam(defaultValue = "es") String lang
    ) {
        return service.startGame(lang, userId);
    }

    @GetMapping("/game/{gameId}")
    public DriverSeasonGameDto get(@PathVariable Long gameId) {
        return service.getGame(gameId);
    }

    @PostMapping("/validate")
    public ValidateDriverSeasonGuessResponse validate(@RequestBody ValidateDriverSeasonGuessRequest req) {
        return service.validateGuess(req);
    }

    @PostMapping("/reveal/{gameId}")
    public DriverSeasonGameDto reveal(@PathVariable Long gameId) {
        return service.reveal(gameId);
    }
}
