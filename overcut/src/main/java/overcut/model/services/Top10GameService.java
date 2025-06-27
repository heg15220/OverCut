package overcut.model.services;

import overcut.model.entities.Top10Game;
import overcut.model.entities.Top10Slot;
import overcut.rest.dtos.GridSlotReveal;
import overcut.rest.dtos.GridValidationResultDto;

import java.util.List;

public interface Top10GameService {
    Top10Game createGame(Long userId, String lang);
    List<Top10Slot> getGrid(Long gameId);
    GridValidationResultDto validatePilot(Long gameId, String pilotName);
    List<GridSlotReveal> revealAllAnswers(Long gameId);
    List<String> autocompletePilots(Long gameId, String query);
}
