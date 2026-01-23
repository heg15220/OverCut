package overcut.model.services;

import overcut.rest.dtos.TowerAnswerRequest;
import overcut.rest.dtos.TowerGameDto;
import overcut.rest.dtos.TowerGuessRequest;
import overcut.rest.dtos.TowerHintResponse;

import java.util.List;

public interface TowerGameService {
    TowerGameDto startGame(String lang, String themeType, String themeKey, Long userId);
    Object getThemes();
    TowerGameDto guess(TowerGuessRequest req, Long userId);
    TowerHintResponse hint(Long gameId, Long userId);
    TowerGameDto getStatus(Long gameId, Long userId);
    List<String> autocompletePilots(Long gameId, String query, Long userId);
    TowerGameDto answer(TowerAnswerRequest req, Long userId);
}
