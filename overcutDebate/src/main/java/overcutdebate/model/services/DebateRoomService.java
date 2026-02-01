package overcutdebate.model.services;

import overcutdebate.rest.dtos.ChatMessageDto;
import overcutdebate.rest.dtos.ChatMessageHistoryDto;
import overcutdebate.rest.dtos.JoinRoomResponseDto;
import overcutdebate.rest.dtos.RoomDetailDto;
import overcutdebate.rest.dtos.RoomSummaryDto;

import java.util.List;

public interface DebateRoomService {

    RoomDetailDto getRoom(Long roomId);

    List<RoomSummaryDto> listTodayRooms(String scopeStr);

    JoinRoomResponseDto joinRoom(Long roomId, Long userId, String authHeader);

    void answerPoll(Long roomId, Long userId, String answerStr);

    boolean isRoomLive(Long roomId);

    boolean isUserJoined(Long roomId, Long userId);

    List<ChatMessageHistoryDto> getRoomMessages(Long roomId, Long userId, int limit);

    // ✅ NUEVO
    ChatMessageDto sendMessage(Long roomId, Long userId, String text);
}
