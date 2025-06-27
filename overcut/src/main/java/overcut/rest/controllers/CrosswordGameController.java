package overcut.rest.controllers;

import overcut.model.entities.CrosswordCell;
import overcut.model.entities.CrosswordGame;
import overcut.model.entities.CrosswordWord;
import overcut.rest.dtos.*;
import overcut.model.services.CrosswordService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/crossword")
public class CrosswordGameController {

    @Autowired
    private CrosswordService crosswordService;

    // 1. Crear nueva partida de crucigrama
    @PostMapping("/create")
    public Long createGame(
            @RequestAttribute("userId") Long userId,
            @RequestBody CreateCrossWordGameRequest request
    ) {
        return crosswordService.createGame(
                userId,
                request.getRows(),
                request.getCols(),
                request.getLanguage()
        );
    }


    // 2. Obtener partida por id
    @GetMapping("/{gameId}")
    public CrosswordGameDto getGame(@PathVariable Long gameId) {
        CrosswordGame gameOpt = crosswordService.getGame(gameId);
        return CrosswordGameDtoConversor.toCrossWordGameDto(gameOpt);
    }

    // 3. Obtener celdas de una partida
    @GetMapping("/{gameId}/cells")
    public List<CrosswordCellDto> getCellsByGame(@PathVariable Long gameId) {
        List<CrosswordCell> cells = crosswordService.getCellsByGame(gameId);
        List<CrosswordCellDto> cellDtos = cells.stream()
                .map(CrosswordCellDtoConversor::toCrosswordCellDto)
                .collect(Collectors.toList());
        return cellDtos;
    }

    // 4. Obtener palabras de una partida
    @GetMapping("/{gameId}/words")
    public List<CrosswordWordDto> getWordsByGame(@PathVariable Long gameId) {
        List<CrosswordWord> words = crosswordService.getWordsByGame(gameId);
        List<CrosswordWordDto> wordDtos = words.stream()
                .map(CrosswordWordDtoConversor::toCrosswordWordDto)
                .collect(Collectors.toList());
        return wordDtos;
    }

    // 5. Actualizar input de usuario para una celda concreta
    @PutMapping("/cell/{cellId}/input")
    public CrosswordCellDto updateCellUserInput(@PathVariable Long cellId, @RequestBody UpdateCellUserInputRequest request) throws Exception {
        CrosswordCell cell = crosswordService.updateCellUserInput(cellId, request.getUserInput());
        return CrosswordCellDtoConversor.toCrosswordCellDto(cell);
    }


    // 6. Comprobar si una celda es correcta
    @PostMapping("/cell/{cellId}/check")
    public boolean checkCell(@PathVariable Long cellId, @RequestBody CheckCellRequest request) {
        return crosswordService.checkCell(cellId, request.getUserInput());
    }

    // 7. Comprobar si una palabra es correcta
    @PostMapping("/word/{wordId}/check")
    public Boolean checkWord(@PathVariable Long wordId, @RequestBody CheckWordRequest request) throws IOException {
        return crosswordService.checkWord(wordId, request.getUserInput(), request.getLanguage());
    }


    // 8. Comprobar si el juego está completado
    @GetMapping("/{gameId}/completed")
    public boolean checkGame(@PathVariable Long gameId) {
        return crosswordService.checkGame(gameId);
    }

    // 9. Reiniciar la partida (vacía todos los userInput)
    @PostMapping("/{gameId}/reset")
    public void resetGame(@PathVariable Long gameId) {
        crosswordService.resetGame(gameId);
    }
}
