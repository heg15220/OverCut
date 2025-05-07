package es.udc.fic.tfg.model.services;

import es.udc.fic.tfg.model.common.exceptions.InstanceNotFoundException;
import es.udc.fic.tfg.model.entities.GridGame;
import es.udc.fic.tfg.model.entities.GridSlot;
import es.udc.fic.tfg.rest.dtos.DriverInfo;

import java.util.List;

public interface GridGameService {
    GridGame createRandomGame();
    List<GridSlot> getGrid(Long gameId);
    boolean validateSlot(Long gameId, int position, String pilotName);
    List<String> autocompletePilots(Long gameId, String partial) throws InstanceNotFoundException;
}
