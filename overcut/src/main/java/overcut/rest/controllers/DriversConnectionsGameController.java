package overcut.rest.controllers;


import overcut.rest.dtos.DriversConnectionsGameConversor;
import overcut.model.services.DriversConnectionsGameService;
import overcut.rest.dtos.DriversConnectionsGameDto;
import overcut.rest.dtos.ValidateGroupRequestDto;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/driversConnections")
public class DriversConnectionsGameController {

    @Autowired
    private DriversConnectionsGameService service;

    @PostMapping("/start")
    public DriversConnectionsGameDto startGame(@RequestParam(name = "lang", defaultValue = "es") String language,
                                               @RequestAttribute("userId") Long userId) {
        return DriversConnectionsGameConversor.toDto(service.startGame(language, userId));
    }



    @PostMapping("/validate")
    public Boolean validateGroup(@RequestBody ValidateGroupRequestDto dto) {
        return service.validateGroup(dto.getGameId(), dto.getSelectedDriverNames());
    }

    @PostMapping("/reveal/{gameId}")
    public DriversConnectionsGameDto revealAnswers(@PathVariable Long gameId) {
        return DriversConnectionsGameConversor.toDto(service.revealAnswers(gameId));
    }
}

