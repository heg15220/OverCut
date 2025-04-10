package es.udc.fic.tfg.rest.controllers;

import es.udc.fic.tfg.model.entities.TikiTakaCriteria;
import es.udc.fic.tfg.model.entities.TikiTakaCriteriaDao;
import es.udc.fic.tfg.model.entities.TikiTakaGame;
import es.udc.fic.tfg.model.services.TikiTakaGameService;
import es.udc.fic.tfg.rest.dtos.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/ticktacktoe")
public class TikiTakaGameController {

    @Autowired
    private TikiTakaCriteriaDao criteriaDao;

    @Autowired
    private TikiTakaGameService gameService;

    @PostMapping("/create")
    public Long createGame(@RequestBody CreateGameRequest request) {
        return gameService.createGame(request);
    }

    @GetMapping("/{id}")
    public TikiTakaGameBoardDto getGame(@PathVariable Long id) {
        TikiTakaGame game = gameService.getGame(id);
        List<TikiTakaCriteria> rowCriteria = criteriaDao.findByAxis("row");
        List<TikiTakaCriteria> columnCriteria = criteriaDao.findByAxis("column");
        return TikiTakaGameBoardDtoConversor.toTikiTakaGameBoardDto(game, rowCriteria, columnCriteria);
    }




    @PostMapping("/{id}/move")
    public ValidationResponseTikTak playMove(@PathVariable Long id, @RequestBody MoveRequest request) {
        return gameService.playMove(id, request);
    }

    @GetMapping("/criteria")
    public List<TikiTakaCriteriaDto> getCriteria() {
        return TikiTakaCriteriaDtoConversor.toTikiTakaCriteriaDtos(gameService.getAllCriteria());
    }
}

