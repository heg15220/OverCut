package overcut.rest.controllers;

import overcut.model.entities.TikiTakaCriteria;
import overcut.model.entities.TikiTakaGame;
import overcut.model.entities.TikiTakaCriteriaDao;
import overcut.model.services.TikiTakaGameService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import overcut.rest.dtos.*;

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
        List<TikiTakaCriteria> rowCriteria = criteriaDao.findByAxisAndGameId("row", id);
        List<TikiTakaCriteria> columnCriteria = criteriaDao.findByAxisAndGameId("column", id);
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

    @PostMapping("/{id}/skip")
    public void skipTurn(@PathVariable Long id) {
        gameService.skipTurn(id);
    }

    @PostMapping("/{id}/draw")
    public void forceDraw(@PathVariable Long id) {
        gameService.forceDraw(id);
    }

}

