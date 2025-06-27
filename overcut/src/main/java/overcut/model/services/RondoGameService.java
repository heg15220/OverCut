package overcut.model.services;

import overcut.model.common.exceptions.InstanceNotFoundException;
import overcut.model.entities.RondoGame;
import overcut.model.entities.RondoLetter;

public interface RondoGameService {
    RondoGame createGame(Long userId, String language);
    RondoGame getGame(Long gameId) throws InstanceNotFoundException;
    RondoLetter answerLetter(Long gameId, char letter, String answer) throws InstanceNotFoundException;
    void skipLetter(Long gameId, char letter) throws InstanceNotFoundException;
    void completeGame(Long gameId) throws InstanceNotFoundException;

}
