package overcut.rest.controllers;

import overcut.model.entities.GridGame;
import overcut.model.entities.GridSlot;
import overcut.model.services.GridGameService;
import overcut.rest.dtos.*;
import overcut.model.common.exceptions.InstanceNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import overcut.rest.dtos.GridGameDtoConversor;

import java.util.List;

@RestController
@RequestMapping("/api/gridGame")
public class GridGameController {

    @Autowired
    private GridGameService gridGameService;

    @PostMapping("/start")
    public GridGameDto startGame(@RequestAttribute("userId") Long userId) {
        GridGame game = gridGameService.createRandomGame(userId);
        return GridGameDtoConversor.toGridGameDto(game);
    }


    @GetMapping("/{gameId}/grid")
    public GridGameBoardDto getGrid(@PathVariable Long gameId) {
        List<GridSlot> slots = gridGameService.getGrid(gameId);

        GridGame game = slots.get(0).getGame();
        return GridGameDtoConversor.toGridGameBoardDto(game, slots);
    }

    @PostMapping("/{gameId}/validate")
    public GridValidationResultDto validatePilotInGrid(
            @PathVariable Long gameId,
            @RequestBody GridPilotValidationRequestDto request) {

        return gridGameService.validatePilotAcrossGrid(gameId, request.getPilotName());
    }





    @GetMapping("/{gameId}/autocomplete")
    public List<String> autocompletePilots(
            @PathVariable Long gameId,
            @RequestParam String q) throws InstanceNotFoundException {

        return gridGameService.autocompletePilots(gameId, q);

    }

    @GetMapping("/{gameId}/reveal-all")
    public List<GridSlotReveal> revealAllAnswers(@PathVariable Long gameId) {
        return gridGameService.revealAllAnswers(gameId);
    }
}

