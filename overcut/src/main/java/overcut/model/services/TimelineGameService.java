package overcut.model.services;

import overcut.model.entities.TimelineGame;
import overcut.rest.dtos.ValidateTimelineResultDto;

import java.util.List;

public interface TimelineGameService {

    TimelineGame startGame(String lang, Long userId);

    ValidateTimelineResultDto validateOrder(Long gameId, List<Long> orderedEventIds);

    TimelineGame reveal(Long gameId);
}
