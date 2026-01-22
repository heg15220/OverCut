package overcut.rest.controllers;

import overcut.model.entities.Top10QualiSlot;
import overcut.model.services.Top10QualiGameService;
import overcut.rest.dtos.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/top10quali")
public class Top10QualiGameController {

    @Autowired
    private Top10QualiGameService service;

    @PostMapping("/start")
    public Top10QualiGameDto start(
            @RequestAttribute("userId") Long userId,
            @RequestParam(defaultValue = "es") String lang
    ) {
        var game = service.createGame(userId, lang);
        return new Top10QualiGameDto(game.getId(), game.getSeasonYear(), game.getRaceName(), game.getSessionUsed());
    }

    @GetMapping("/{gameId}/grid")
    public Top10QualiGameBoardDto grid(@PathVariable Long gameId) {
        List<Top10QualiSlot> slots = service.getGrid(gameId);
        var game = slots.get(0).getGame();
        return Top10QualiGameDtoConversor.toBoard(game, slots);
    }

    @PostMapping("/{gameId}/validate")
    public GridValidationResultDto validate(@PathVariable Long gameId,
                                            @RequestBody GridPilotValidationRequestDto request) {
        return service.validatePilot(gameId, request.getPilotName());
    }

    @GetMapping("/{gameId}/autocomplete")
    public List<String> autocomplete(@PathVariable Long gameId, @RequestParam String q) {
        return service.autocompletePilots(gameId, q);
    }

    @GetMapping("/{gameId}/reveal-all")
    public List<GridSlotReveal> reveal(@PathVariable Long gameId) {
        return service.revealAllAnswers(gameId);
    }
}
