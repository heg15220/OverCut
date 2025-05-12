package es.udc.fic.tfg.model.services;

import es.udc.fic.tfg.model.common.exceptions.InstanceNotFoundException;
import es.udc.fic.tfg.model.entities.RondoGame;
import es.udc.fic.tfg.model.entities.RondoLetter;

public interface RondoGameService {
    RondoGame createGame(String language);
    RondoGame getGame(Long gameId) throws InstanceNotFoundException;
    RondoLetter answerLetter(Long gameId, char letter, String answer) throws InstanceNotFoundException;
    void skipLetter(Long gameId, char letter) throws InstanceNotFoundException;
    void completeGame(Long gameId) throws InstanceNotFoundException;

}
