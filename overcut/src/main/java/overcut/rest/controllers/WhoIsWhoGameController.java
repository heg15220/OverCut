package overcut.rest.controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import overcut.model.services.WhoIsWhoGameService;
import overcut.rest.dtos.*;
import java.util.List;

@RestController
@RequestMapping("/api/whoIsWho")
public class WhoIsWhoGameController {

    @Autowired private WhoIsWhoGameService service;

    @PostMapping("/start")
    public WhoIsWhoGameDto start(@RequestParam(name = "lang", defaultValue = "es") String lang,
                                 @RequestAttribute("userId") Long userId) {
        return WhoIsWhoGameConversor.toDto(service.startGame(lang, userId), false);
    }

    @PostMapping("/next-hint/{gameId}")
    public WhoIsWhoGameDto nextHint(@PathVariable Long gameId) {
        return WhoIsWhoGameConversor.toDto(service.revealNextHint(gameId), false);
    }

    @PostMapping("/guess")
    public WhoIsWhoGuessResponseDto guess(@RequestBody GuessWhoIsWhoRequestDto dto) {
        return service.guess(dto.getGameId(), dto.getGuess());
    }

    @PostMapping("/reveal/{gameId}")
    public WhoIsWhoGameDto reveal(@PathVariable Long gameId) {
        return WhoIsWhoGameConversor.toDto(service.revealAnswer(gameId), true);
    }

    @GetMapping("/state/{gameId}")
    public WhoIsWhoGameDto state(@PathVariable Long gameId) {
        // por defecto, no incluimos answer hasta finished=true
        return WhoIsWhoGameConversor.toDto(
                service.revealNextHint(gameId) /* NO cambia si finished o sin hints restantes */,
                true
        );
    }

    @GetMapping("/autocomplete")
    public List<String> autocomplete(@RequestParam String partial) {
    return service.autocomplete(partial);
}

}
