package overcut.model.services;

import overcut.model.common.exceptions.InstanceNotFoundException;
import overcut.model.entities.GridGame;
import overcut.model.entities.GridSlot;
import overcut.rest.dtos.GridSlotReveal;
import overcut.rest.dtos.GridValidationResultDto;

import java.util.List;

public interface GridGameService {
    GridGame createRandomGame(Long userId);
    List<GridSlot> getGrid(Long gameId);
    GridValidationResultDto validatePilotAcrossGrid(Long gameId, String pilotName);
    List<String> autocompletePilots(Long gameId, String partial) throws InstanceNotFoundException;
    List<GridSlotReveal> revealAllAnswers(Long gameId);
}
