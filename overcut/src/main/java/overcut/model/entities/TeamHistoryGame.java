package overcut.model.entities;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
public class TeamHistoryGame {

    private Long gameId;
    private Integer constructorId;
    private String lang;
    private Integer maxPosition;
    private boolean revealed;
    private boolean completed;
    private Instant createdAt = Instant.now();
    private String constructorName;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long getGameId() { return gameId; }
    public void setGameId(Long gameId) { this.gameId = gameId; }

    public Integer getConstructorId() { return constructorId; }
    public void setConstructorId(Integer constructorId) { this.constructorId = constructorId; }

    public String getLang() { return lang; }
    public void setLang(String lang) { this.lang = lang; }

    public Integer getMaxPosition() { return maxPosition; }
    public void setMaxPosition(Integer maxPosition) { this.maxPosition = maxPosition; }

    public boolean isRevealed() { return revealed; }
    public void setRevealed(boolean revealed) { this.revealed = revealed; }

    public boolean isCompleted() { return completed; }
    public void setCompleted(boolean completed) { this.completed = completed; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public String getConstructorName() { return constructorName; }
    public void setConstructorName(String constructorName) { this.constructorName = constructorName; }
}
