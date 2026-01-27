package overcutdebate.model.entities;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(
        name="debate_room_participant",
        uniqueConstraints=@UniqueConstraint(name="uq_room_user", columnNames={"room_id","user_id"})
)
public class DebateRoomParticipant {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "room_id", nullable = false)
    private Long roomId;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "user_name", nullable = false, length = 60)
    private String userName;

    @Column(name = "joined_at", nullable = false)
    private Instant joinedAt;

    @Enumerated(EnumType.STRING)
    @Column(name = "poll_answer")
    private PollAnswer pollAnswer;

    @Column(name = "poll_answered_at")
    private Instant pollAnsweredAt;

    public DebateRoomParticipant() {}

    // getters/setters
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
