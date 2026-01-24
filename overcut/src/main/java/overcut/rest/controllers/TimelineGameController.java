package overcut.rest.controllers;

import overcut.model.services.TimelineGameService;
import overcut.rest.dtos.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/timeline")
public class TimelineGameController {

    @Autowired
    private TimelineGameService service;

    @PostMapping("/start")
    public TimelineGameDto start(@RequestParam(name="lang", defaultValue="es") String lang,
                                 @RequestAttribute("userId") Long userId) {
        return TimelineGameConversor.toDto(service.startGame(lang, userId));
    }

    @PostMapping("/validate")
    public ValidateTimelineResultDto validate(@RequestBody ValidateTimelineRequestDto dto) {
        return service.validateOrder(dto.getGameId(), dto.getOrderedEventIds());
    }

    @PostMapping("/reveal/{gameId}")
    public TimelineGameRevealDto reveal(@PathVariable Long gameId) {
        return TimelineGameConversor.toRevealDto(service.reveal(gameId));
    }

}
