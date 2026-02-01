package overcut.rest.controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import overcut.model.services.AbbreviationsGameService;
import overcut.rest.dtos.*;

import java.util.List;

@RestController
@RequestMapping("/api/abbreviationsGame")
public class AbbreviationsGameController {

    @Autowired
    private AbbreviationsGameService service;

    @PostMapping("/start")
    public AbbreviationsGameDto start(@RequestAttribute("userId") Long userId,
                                      @RequestParam(defaultValue = "es") String lang) {
        return AbbreviationsGameConversor.toDto(service.startGame(userId, lang));
    }

    @PostMapping("/guess")
    public AbbreviationsGameDto guess(@RequestBody AbbreviationsGuessRequestDto req) {
        return AbbreviationsGameConversor.toDto(service.guess(req.getGameId(), req.getGuessText()));
    }

    @GetMapping("/status/{gameId}")
    public AbbreviationsGameDto status(@PathVariable Long gameId) {
        return AbbreviationsGameConversor.toDto(service.getGameStatus(gameId));
    }

    @GetMapping("/autocomplete")
    public List<String> autocomplete(@RequestParam String partial) {
        return service.autocompletePilotNames(partial);
    }
}
