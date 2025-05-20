package es.udc.fic.tfg.rest.controllers;


import es.udc.fic.tfg.model.services.DriversConnectionsGameService;
import es.udc.fic.tfg.rest.dtos.DriversConnectionsGameConversor;
import es.udc.fic.tfg.rest.dtos.DriversConnectionsGameDto;
import es.udc.fic.tfg.rest.dtos.ValidateGroupRequestDto;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/driversConnections")
public class DriversConnectionsGameController {

    @Autowired
    private DriversConnectionsGameService service;

    @PostMapping("/start")
    public DriversConnectionsGameDto startGame() {
        return DriversConnectionsGameConversor.toDto(service.startGame());
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

