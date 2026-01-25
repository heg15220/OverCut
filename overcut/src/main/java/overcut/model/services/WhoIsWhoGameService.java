package overcut.model.services;

import overcut.model.entities.WhoIsWhoGame;
import overcut.rest.dtos.WhoIsWhoGuessResponseDto;

import java.util.List;
public interface WhoIsWhoGameService {

    WhoIsWhoGame startGame(String lang, Long userId);

    WhoIsWhoGame revealNextHint(Long gameId);

    WhoIsWhoGuessResponseDto guess(Long gameId, String guess);

    WhoIsWhoGame revealAnswer(Long gameId);

    List<String> autocomplete(String partial);

    WhoIsWhoGame getGame(Long gameId);


}
