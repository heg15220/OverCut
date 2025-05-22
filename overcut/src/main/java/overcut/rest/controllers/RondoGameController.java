package overcut.rest.controllers;

import overcut.model.entities.RondoGame;
import overcut.model.entities.RondoLetter;
import overcut.model.services.RondoGameService;
import overcut.rest.dtos.RondoGameDto;
import overcut.model.common.exceptions.InstanceNotFoundException;
import overcut.rest.dtos.RondoLetterDto;
import overcut.rest.dtos.RondoLetterDtoConversor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/rondo")
public class RondoGameController {

    @Autowired
    private RondoGameService gameService;

    @PostMapping("/start")
    public RondoGameDto startGame(@RequestParam String language) {
        RondoGame game = gameService.createGame(language);
        return RondoLetterDtoConversor.toDto(game);
    }

    @GetMapping("/{gameId}")
    public RondoGameDto getGame(@PathVariable Long gameId) throws InstanceNotFoundException {
        RondoGame game = gameService.getGame(gameId);
        return RondoLetterDtoConversor.toDto(game);
    }

    @PostMapping("/{gameId}/answer")
    public RondoLetterDto answer(@PathVariable Long gameId, @RequestParam char letter, @RequestParam String answer) throws InstanceNotFoundException {
        RondoLetter letterEntity = gameService.answerLetter(gameId, letter, answer);
        return RondoLetterDtoConversor.toDto(letterEntity);
    }

    @PostMapping("/{gameId}/skip")
    public void skip(@PathVariable Long gameId, @RequestParam char letter) throws InstanceNotFoundException {
        gameService.skipLetter(gameId, letter);
    }

    @PostMapping("/{gameId}/complete")
    public void complete(@PathVariable Long gameId) throws InstanceNotFoundException {
        gameService.completeGame(gameId);
    }
}