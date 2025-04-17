package es.udc.fic.tfg.model.services;

import es.udc.fic.tfg.model.entities.TikiTakaCriteria;
import es.udc.fic.tfg.model.entities.TikiTakaGame;
import es.udc.fic.tfg.rest.dtos.CreateGameRequest;
import es.udc.fic.tfg.rest.dtos.MoveRequest;
import es.udc.fic.tfg.rest.dtos.ValidationResponse;
import es.udc.fic.tfg.rest.dtos.ValidationResponseTikTak;

import java.util.List;

public interface TikiTakaGameService {

    Long createGame(CreateGameRequest request);

    TikiTakaGame getGame(Long gameId);

    ValidationResponseTikTak playMove(Long gameId, MoveRequest request);

    List<TikiTakaCriteria> getAllCriteria();

    void skipTurn(Long gameId);

    void forceDraw(Long gameId);
}
