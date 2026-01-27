package overcutdebate.model.entities;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "debate_room_participant",
        uniqueConstraints = @UniqueConstraint(name="uq_room_user", columnNames = {"roomId", "userId"}))
public class DebateRoomParticipant {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long roomId;
    private Long userId;
    private String userName;

    private Instant joinedAt;

    @Enumerated(EnumType.STRING)
    private PollAnswer pollAnswer;

    private Instant pollAnsweredAt;

    public DebateRoomParticipant() {}

    public Long getId() { return id; }

    public Long getRoomId() { return roomId; }
    public void setRoomId(Long roomId) { this.roomId = roomId; }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public String getUserName() { return userName; }
    public void setUserName(String userName) { this.userName = userName; }

    public Instant getJoinedAt() { return joinedAt; }
    public void setJoinedAt(Instant joinedAt) { this.joinedAt = joinedAt; }

    public PollAnswer getPollAnswer() { return pollAnswer; }
    public void setPollAnswer(PollAnswer pollAnswer) { this.pollAnswer = pollAnswer; }

    public Instant getPollAnsweredAt() { return pollAnsweredAt; }
    public void setPollAnsweredAt(Instant pollAnsweredAt) { this.pollAnsweredAt = pollAnsweredAt; }
}
