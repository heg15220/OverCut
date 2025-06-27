package overcut.rest.controllers;

import overcut.model.services.CategoryGameService;
import overcut.rest.dtos.CategoryGameConversor;
import overcut.rest.dtos.CategoryGameDto;
import overcut.model.entities.CategoryGame;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import overcut.rest.dtos.SubmitCategoryAnswersDto;

@RestController
@RequestMapping("/api/categoryGame")
public class CategoryGameController {

    @Autowired
    private CategoryGameService categoryGameService;

    @PostMapping("/start")
    public CategoryGameDto startGame(@RequestAttribute("userId") Long userId,
                                     @RequestParam(defaultValue = "es") String lang) {
        CategoryGame game = categoryGameService.startGame(lang, userId);
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
