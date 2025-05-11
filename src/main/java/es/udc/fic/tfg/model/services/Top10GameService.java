package es.udc.fic.tfg.model.services;

import es.udc.fic.tfg.model.entities.Top10Game;
import es.udc.fic.tfg.model.entities.Top10Slot;
import es.udc.fic.tfg.rest.dtos.GridSlotReveal;
import es.udc.fic.tfg.rest.dtos.GridValidationResultDto;

import java.util.List;

public interface Top10GameService {
    Top10Game createGame(String lang);
    List<Top10Slot> getGrid(Long gameId);
    GridValidationResultDto validatePilot(Long gameId, String pilotName);
    List<GridSlotReveal> revealAllAnswers(Long gameId);
    List<String> autocompletePilots(Long gameId, String query);
}
