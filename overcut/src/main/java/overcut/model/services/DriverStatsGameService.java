package overcut.model.services;

import overcut.rest.dtos.DriverStatsGameDto;
import overcut.rest.dtos.DriverStatsSubmitRequestDto;

public interface DriverStatsGameService {
    DriverStatsGameDto startGame(String lang, Long userId);
    DriverStatsGameDto submit(Long userId, DriverStatsSubmitRequestDto req);
    DriverStatsGameDto getGame(Long gameId);
}
