package overcut.rest.controllers;


import overcut.model.services.F1ImpostorGameService;
import overcut.rest.dtos.F1ImpostorGameDto;
import overcut.rest.dtos.ValidateImpostorRequestDto;
import overcut.rest.dtos.F1ImpostorGameConversor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/f1Impostor")
public class F1ImpostorGameController {

    @Autowired
    private F1ImpostorGameService service;

    @PostMapping("/start")
    public F1ImpostorGameDto startGame(@RequestParam(defaultValue = "es") String lang,
                                       @RequestAttribute("userId") Long userId) {
        return F1ImpostorGameConversor.toDto(service.startGame(lang, userId));
    }



    @PostMapping("/validate")
    public F1ImpostorGameDto validateSelection(@RequestBody ValidateImpostorRequestDto request) {
        return F1ImpostorGameConversor.toDto(
                service.validateSelection(request.getGameId(), request.getSelectedPilotNames())
        );
    }

    @GetMapping("/status/{gameId}")
    public F1ImpostorGameDto getGameStatus(@PathVariable Long gameId) {
        return F1ImpostorGameConversor.toDto(service.getGameStatus(gameId));
    }
}

