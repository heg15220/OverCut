package overcutdebate.model.services;

import overcutdebate.model.entities.DebateScope;
import overcutdebate.rest.dtos.*;

import java.util.List;

public interface DebateRoomService {
    RoomDetailDto getRoom(Long roomId);
    List<RoomSummaryDto> listRooms(DebateScope scope);

    RoomDetailDto createRoom(String scope, String topic, Integer joinSeconds);

    JoinRoomResponseDto joinRoom(Long roomId, Long userId, String authHeader);

    void answerPoll(Long roomId, Long userId, String answer);
}
