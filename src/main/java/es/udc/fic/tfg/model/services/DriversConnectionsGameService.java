package es.udc.fic.tfg.model.services;


import es.udc.fic.tfg.model.entities.DriversConnectionsGame;

import java.util.List;

public interface DriversConnectionsGameService {

    DriversConnectionsGame startGame();

    boolean validateGroup(Long gameId, List<String> selectedDriverNames);

    DriversConnectionsGame revealAnswers(Long gameId);

}

