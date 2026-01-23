package overcut.rest.controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import overcut.model.services.BingoGameService;
import overcut.rest.dtos.*;

@RestController
@RequestMapping("/api/bingo")
public class BingoGameController {

    @Autowired
    private BingoGameService service;

    @PostMapping("/start")
    public BingoGameDto start(@RequestParam(name="lang", defaultValue="es") String lang,
                              @RequestAttribute("userId") Long userId) {
        return BingoGameConversor.toDto(service.startGame(lang, userId));
    }


    @PostMapping("/select")
    public BingoSelectResponseDto select(@RequestBody BingoSelectRequestDto dto) {
        return service.selectCell(dto);
    }

    @PostMapping("/finish/{gameId}")
    public BingoGameDto finish(@PathVariable Long gameId) {
        return BingoGameConversor.toDto(service.finish(gameId));
    }
}
