package overcutdebate.ws.dtos;

import java.time.Instant;

public class ChatMessageDto {
    public Long roomId;
    public Long userId;
    public String userName;
    public String text;
    public Instant timestamp;

    public ChatMessageDto(Long roomId, Long userId, String userName, String text, Instant timestamp) {
        this.roomId = roomId;
        this.userId = userId;
        this.userName = userName;
        this.text = text;
        this.timestamp = timestamp;
    }
}
