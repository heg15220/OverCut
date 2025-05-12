package es.udc.fic.tfg.rest.controllers;

import es.udc.fic.tfg.model.common.exceptions.InstanceNotFoundException;
import es.udc.fic.tfg.model.entities.RondoGame;
import es.udc.fic.tfg.model.entities.RondoLetter;
import es.udc.fic.tfg.model.services.RondoGameService;
import es.udc.fic.tfg.rest.dtos.RondoGameDto;
import es.udc.fic.tfg.rest.dtos.RondoLetterDto;
import es.udc.fic.tfg.rest.dtos.RondoLetterDtoConversor;
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