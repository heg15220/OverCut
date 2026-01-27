package overcutdebate.rest.dtos;

import java.time.Instant;

public class ChatMessageHistoryDto {
    public Long id;
    public Long roomId;
    public Long userId;
    public String userName;
    public String text;
    public Instant createdAt;
}
