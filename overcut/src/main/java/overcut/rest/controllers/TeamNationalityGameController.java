package overcut.rest.controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import overcut.model.services.TeamNationalityGameService;
import overcut.rest.dtos.TeamNationalityGameConversor;
import overcut.rest.dtos.TeamNationalityGameDto;
import overcut.rest.dtos.TeamNationalityGuessRequestDto;

import java.util.List;

@RestController
@RequestMapping("/api/teamNationalityGame")
public class TeamNationalityGameController {

    @Autowired
    private TeamNationalityGameService service;

    @PostMapping("/start")
    public TeamNationalityGameDto start(@RequestAttribute("userId") Long userId,
                                        @RequestParam(defaultValue = "es") String lang) {
        return TeamNationalityGameConversor.toDto(service.startGame(userId, lang));
    }

    @PostMapping("/guess")
    public TeamNationalityGameDto guess(@RequestBody TeamNationalityGuessRequestDto req) {
        return TeamNationalityGameConversor.toDto(service.guessDriver(req.getGameId(), req.getDriverName()));
    }

    @GetMapping("/status/{gameId}")
    public TeamNationalityGameDto status(@PathVariable Long gameId) {
        return TeamNationalityGameConversor.toDto(service.getGameStatus(gameId));
    }

    @GetMapping("/autocomplete")
    public List<String> autocomplete(@RequestParam String partial) {
        return service.autocompletePilotNames(partial);
    }
}
