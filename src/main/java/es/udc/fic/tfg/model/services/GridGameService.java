package es.udc.fic.tfg.model.services;

import es.udc.fic.tfg.model.common.exceptions.InstanceNotFoundException;
import es.udc.fic.tfg.model.entities.GridGame;
import es.udc.fic.tfg.model.entities.GridSlot;
import es.udc.fic.tfg.rest.dtos.DriverInfo;
import es.udc.fic.tfg.rest.dtos.GridSlotReveal;
import es.udc.fic.tfg.rest.dtos.GridValidationResultDto;

import java.util.List;
import java.util.Map;

public interface GridGameService {
    GridGame createRandomGame();
    List<GridSlot> getGrid(Long gameId);
    GridValidationResultDto validatePilotAcrossGrid(Long gameId, String pilotName);
    List<String> autocompletePilots(Long gameId, String partial) throws InstanceNotFoundException;
    List<GridSlotReveal> revealAllAnswers(Long gameId);
}
