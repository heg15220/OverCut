package overcut.rest.controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import overcut.model.services.MemoryGameService;
import overcut.rest.dtos.*;

@RestController
@RequestMapping("/api/memory")
public class MemoryGameController {

    @Autowired
    private MemoryGameService service;

    @PostMapping("/start")
    public MemoryGameDto startGame(
            @RequestParam(name = "lang", defaultValue = "es") String lang,
            @RequestParam(name = "rows", defaultValue = "4") int rows,
            @RequestParam(name = "cols", defaultValue = "4") int cols,
            @RequestParam(name = "mode", defaultValue = "classic") String mode,
            @RequestAttribute("userId") Long userId
    ) {
        return MemoryGameConversor.toDto(service.startGame(lang, userId, rows, cols, mode));
    }

    @PostMapping("/validate")
    public ValidateMemoryPairResponseDto validatePair(@RequestBody ValidateMemoryPairRequestDto dto) {
        return service.validatePair(dto.getGameId(), dto.getFirstCardId(), dto.getSecondCardId());
    }
}
