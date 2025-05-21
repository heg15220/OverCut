package es.udc.fic.tfg.rest.controllers;

import es.udc.fic.tfg.model.services.CategoryGameService;
import es.udc.fic.tfg.model.entities.CategoryGame;
import es.udc.fic.tfg.rest.dtos.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/categoryGame")
public class CategoryGameController {

    @Autowired
    private CategoryGameService categoryGameService;

    @PostMapping("/start")
    public CategoryGameDto startGame(@RequestParam(defaultValue = "es") String lang) {
        CategoryGame game = categoryGameService.startGame(lang);
        return CategoryGameConversor.toDto(game);
    }


    @PostMapping("/submit")
    public CategoryGameDto submitAnswers(@RequestBody SubmitCategoryAnswersDto request) {
        CategoryGame game = categoryGameService.submitAnswers(
                request.getGameId(), request.getAnswers(), request.getLang()
        );
        return CategoryGameConversor.toDto(game);
    }


    @GetMapping("/status/{gameId}")
    public CategoryGameDto getGameStatus(@PathVariable Long gameId) {
        CategoryGame game = categoryGameService.getGameStatus(gameId);
        return CategoryGameConversor.toDto(game);
    }
}
