package overcut.rest.controllers;

import overcut.model.services.HigherLowerGameService;
import overcut.rest.dtos.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/higherLower")
public class HigherLowerGameController {

    @Autowired private HigherLowerGameService service;

    @PostMapping("/start")
    public HigherLowerGameDto start(@RequestParam(defaultValue = "es") String lang,
                                    @RequestAttribute("userId") Long userId) {
        return HigherLowerConversor.toDto(service.startGame(lang, userId));
    }

    @PostMapping("/guess")
    public HigherLowerGameDto guess(@RequestBody HigherLowerGuessRequestDto req) {
        return HigherLowerConversor.toDto(service.guess(req.getGameId(), req.getDirection()));
    }

    @GetMapping("/status/{gameId}")
    public HigherLowerGameDto status(@PathVariable Long gameId) {
        return HigherLowerConversor.toDto(service.getGameStatus(gameId));
    }
}
