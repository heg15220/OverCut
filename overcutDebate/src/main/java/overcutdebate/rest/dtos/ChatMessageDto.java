package overcutdebate.rest.dtos;

import java.time.Instant;

public class ChatMessageDto {
    public Long id;
    public Long roomId;
    public Long userId;
    public String userName;
    public String text;
    public Instant createdAt;
}
