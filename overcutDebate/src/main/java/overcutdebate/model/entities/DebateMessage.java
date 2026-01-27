package overcutdebate.model.entities;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "debate_message",
        indexes = {
                @Index(name="ix_msg_room_created", columnList="room_id, created_at"),
                @Index(name="ix_msg_created", columnList="created_at")
        })
public class DebateMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name="room_id", nullable=false)
    private Long roomId;

    @Column(name="user_id", nullable=false)
    private Long userId;

    @Column(name="user_name", nullable=false, length=60)
    private String userName;

    @Column(nullable=false, length=400)
    private String text;

    @Column(name="created_at", nullable=false)
    private Instant createdAt;

    public DebateMessage() {}

    public Long getId() { return id; }
    public Long getRoomId() { return roomId; }
    public void setRoomId(Long roomId) { this.roomId = roomId; }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public String getUserName() { return userName; }
    public void setUserName(String userName) { this.userName = userName; }

    public String getText() { return text; }
    public void setText(String text) { this.text = text; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
