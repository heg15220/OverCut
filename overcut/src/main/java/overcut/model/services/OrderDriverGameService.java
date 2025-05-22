package overcut.model.services;

import overcut.rest.dtos.OrderSubmissionDto;
import overcut.model.entities.OrderDriverGame;

public interface OrderDriverGameService {
    OrderDriverGame startGame(String lang);
    OrderDriverGame validateSubmission(OrderSubmissionDto submission);
    OrderDriverGame getGame(Long gameId);
}
