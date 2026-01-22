package overcut.model.services;

import overcut.model.entities.Top10QualiGame;
import overcut.model.entities.Top10QualiSlot;
import overcut.rest.dtos.GridSlotReveal;
import overcut.rest.dtos.GridValidationResultDto;

import java.util.List;

public interface Top10QualiGameService {
    Top10QualiGame createGame(Long userId, String lang);
    List<Top10QualiSlot> getGrid(Long gameId);
    GridValidationResultDto validatePilot(Long gameId, String pilotName);
    List<GridSlotReveal> revealAllAnswers(Long gameId);
    List<String> autocompletePilots(Long gameId, String query);
}
