package overcut.rest.controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import overcut.model.services.ThirtySecondsGameService;
import overcut.rest.dtos.*;

import java.util.List;

@RestController
@RequestMapping("/api/thirtySecondsGame")
public class ThirtySecondsGameController {

    @Autowired
    private ThirtySecondsGameService service;

    @PostMapping("/start")
    public ThirtySecondsGameDto start(@RequestAttribute("userId") Long userId,
                                      @RequestParam(defaultValue = "es") String lang) {
        return ThirtySecondsGameConversor.toDto(service.startGame(userId, lang));
    }

    @PostMapping("/submit")
    public ThirtySecondsGameDto submit(@RequestBody ThirtySecondsSubmitRequestDto req) {
        return ThirtySecondsGameConversor.toDto(service.submitAnswers(req.getGameId(), req.getAnswers()));
    }

    @GetMapping("/status/{gameId}")
    public ThirtySecondsGameDto status(@PathVariable Long gameId) {
        return ThirtySecondsGameConversor.toDto(service.getGameStatus(gameId));
    }

    @GetMapping("/autocomplete")
    public List<String> autocomplete(@RequestParam String partial) {
        return service.autocompletePilotNames(partial);
    }
}
