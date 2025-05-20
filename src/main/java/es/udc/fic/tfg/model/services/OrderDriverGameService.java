package es.udc.fic.tfg.model.services;

import es.udc.fic.tfg.model.entities.OrderDriverGame;
import es.udc.fic.tfg.rest.dtos.OrderSubmissionDto;

public interface OrderDriverGameService {
    OrderDriverGame startGame(String lang);
    OrderDriverGame validateSubmission(OrderSubmissionDto submission);
    OrderDriverGame getGame(Long gameId);
}
