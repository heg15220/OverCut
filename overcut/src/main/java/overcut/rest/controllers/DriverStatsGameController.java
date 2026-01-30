package overcut.rest.controllers;

import org.springframework.web.bind.annotation.*;
import overcut.model.services.DriverStatsGameService;
import overcut.rest.dtos.DriverStatsGameDto;
import overcut.rest.dtos.DriverStatsSubmitRequestDto;

@RestController
@RequestMapping("/api/driverStatsGame")
public class DriverStatsGameController {

    private final DriverStatsGameService service;

    public DriverStatsGameController(DriverStatsGameService service) {
        this.service = service;
    }

    @PostMapping("/start")
    public DriverStatsGameDto start(
            @RequestAttribute("userId") Long userId,
            @RequestParam(defaultValue = "es") String lang
    ) {
        return service.startGame(lang, userId);
    }

    @PostMapping("/submit")
    public DriverStatsGameDto submit(
            @RequestAttribute("userId") Long userId,
            @RequestBody DriverStatsSubmitRequestDto req
    ) {
        return service.submit(userId, req);
    }

    @GetMapping("/status/{gameId}")
    public DriverStatsGameDto status(@PathVariable Long gameId) {
        return service.getGame(gameId);
    }
}
