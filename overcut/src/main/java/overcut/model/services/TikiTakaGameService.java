package overcut.model.services;

import overcut.model.entities.TikiTakaCriteria;
import overcut.model.entities.TikiTakaGame;
import overcut.rest.dtos.CreateGameRequest;
import overcut.rest.dtos.MoveRequest;
import overcut.rest.dtos.ValidationResponseTikTak;

import java.util.List;

public interface TikiTakaGameService {

    Long createGame(CreateGameRequest request);

    TikiTakaGame getGame(Long gameId);

    ValidationResponseTikTak playMove(Long gameId, MoveRequest request);

    List<TikiTakaCriteria> getAllCriteria();

    void skipTurn(Long gameId);

    void forceDraw(Long gameId);
}
