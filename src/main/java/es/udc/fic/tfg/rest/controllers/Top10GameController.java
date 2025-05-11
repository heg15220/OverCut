package es.udc.fic.tfg.rest.controllers;

import es.udc.fic.tfg.model.entities.Top10Game;
import es.udc.fic.tfg.model.entities.Top10Slot;
import es.udc.fic.tfg.model.services.Top10GameService;
import es.udc.fic.tfg.rest.dtos.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/top10")
public class Top10GameController {

    @Autowired
    private Top10GameService top10GameService;

    @PostMapping("/start")
    public Top10GameDto startGame(@RequestParam(defaultValue = "es") String lang) {
        Top10Game game = top10GameService.createGame(lang);
        return new Top10GameDto(game.getId(), game.getSeasonYear(), game.getRaceName());
    }



    @GetMapping("/{gameId}/grid")
    public Top10GameBoardDto getGrid(@PathVariable Long gameId) {
        List<Top10Slot> slots = top10GameService.getGrid(gameId);
        Top10Game game = slots.get(0).getGame();
        return Top10GameDtoConversor.toTop10GameBoardDto(game, slots);
    }


    @PostMapping("/{gameId}/validate")
    public GridValidationResultDto validate(
            @PathVariable Long gameId,
            @RequestBody GridPilotValidationRequestDto request) {
        return top10GameService.validatePilot(gameId, request.getPilotName());
    }

    @GetMapping("/{gameId}/autocomplete")
    public List<String> autocomplete(@PathVariable Long gameId, @RequestParam String q) {
        return top10GameService.autocompletePilots(gameId, q);
    }

    @GetMapping("/{gameId}/reveal-all")
    public List<GridSlotReveal> revealAll(@PathVariable Long gameId) {
        return top10GameService.revealAllAnswers(gameId);
    }
}
