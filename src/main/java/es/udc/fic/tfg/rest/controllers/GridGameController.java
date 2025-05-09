package es.udc.fic.tfg.rest.controllers;

import es.udc.fic.tfg.model.common.exceptions.InstanceNotFoundException;
import es.udc.fic.tfg.model.entities.GridGame;
import es.udc.fic.tfg.model.entities.GridSlot;
import es.udc.fic.tfg.model.services.GridGameService;
import es.udc.fic.tfg.rest.dtos.*;
import es.udc.fic.tfg.rest.dtos.GridGameDtoConversor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/gridGame")
public class GridGameController {

    @Autowired
    private GridGameService gridGameService;

    @PostMapping("/start")
    public GridGameDto startGame() {
        GridGame game = gridGameService.createRandomGame();
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


}

