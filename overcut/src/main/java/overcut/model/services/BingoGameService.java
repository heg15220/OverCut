package overcut.model.services;

import overcut.model.entities.BingoGame;
import overcut.rest.dtos.BingoSelectRequestDto;
import overcut.rest.dtos.BingoSelectResponseDto;

public interface BingoGameService {
    BingoGame startGame(String lang, Long userId);
    BingoSelectResponseDto selectCell(BingoSelectRequestDto dto);
    BingoGame finish(Long gameId);
}
