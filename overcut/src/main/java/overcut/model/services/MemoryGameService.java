package overcut.model.services;

import overcut.rest.dtos.ValidateMemoryPairResponseDto;
import overcut.model.entities.MemoryGame;

public interface MemoryGameService {

    MemoryGame startGame(String lang, Long userId, int rows, int cols, String mode);

    ValidateMemoryPairResponseDto validatePair(Long gameId, Long firstCardId, Long secondCardId);
}
