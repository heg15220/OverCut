package overcutdebate.model.services;

import overcutdebate.rest.dtos.*;

import java.util.List;

public interface DebateRoomService {
    RoomDetailDto getRoom(Long roomId);
    List<RoomSummaryDto> listTodayRooms(String scope);

    JoinRoomResponseDto joinRoom(Long roomId, Long userId, String authHeader);
    void answerPoll(Long roomId, Long userId, String answer);
    boolean isRoomLive(Long roomId);
    boolean isUserJoined(Long roomId, Long userId);

    List<ChatMessageHistoryDto> getRoomMessages(Long roomId, Long userId, int limit);


}
