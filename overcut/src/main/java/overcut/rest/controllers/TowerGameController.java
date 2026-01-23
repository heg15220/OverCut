package overcut.rest.controllers;

import org.springframework.web.bind.annotation.*;
import overcut.model.services.TowerGameService;
import overcut.rest.dtos.*;

import java.util.List;

@RestController
@RequestMapping("/api/tower")
public class TowerGameController {

    private final TowerGameService service;

    public TowerGameController(TowerGameService service) {
        this.service = service;
    }

    @PostMapping("/start")
    public TowerGameDto start(@RequestParam(defaultValue = "es") String lang,
                              @RequestParam(required = false) String themeType,
                              @RequestParam(required = false) String themeKey,
                              @RequestAttribute("userId") Long userId) {
        return service.startGame(lang, themeType, themeKey, userId);
    }

    @GetMapping("/themes")
    public Object themes() {
        return service.getThemes();
    }


    @PostMapping("/guess")
    public TowerGameDto guess(@RequestBody TowerGuessRequest req,
                              @RequestAttribute("userId") Long userId) {
        return service.guess(req, userId);
    }

    @PostMapping("/hint/{gameId}")
    public TowerHintResponse hint(@PathVariable Long gameId,
                                  @RequestAttribute("userId") Long userId) {
        return service.hint(gameId, userId);
    }

    @GetMapping("/status/{gameId}")
    public TowerGameDto status(@PathVariable Long gameId,
                               @RequestAttribute("userId") Long userId) {
        return service.getStatus(gameId, userId);
    }

    @GetMapping("/{gameId}/autocomplete")
    public List<String> autocomplete(@PathVariable Long gameId,
                                     @RequestParam("q") String q,
                                     @RequestAttribute("userId") Long userId) {
        return service.autocompletePilots(gameId, q, userId);
    }

    @PostMapping("/answer")
    public TowerGameDto answer(@RequestBody TowerAnswerRequest req,
                               @RequestAttribute("userId") Long userId) {
        return service.answer(req, userId);
    }

}
