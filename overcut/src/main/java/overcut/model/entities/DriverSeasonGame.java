package overcut.model.entities;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
public class DriverSeasonGame {

    private Long gameId;

    private Integer driverId;

    private Integer seasonYear;

    private String lang;

    private Integer maxPosition;

    private boolean revealed;

    private boolean completed;

    private Instant createdAt = Instant.now();

    private String driverName;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long getGameId() { return gameId; }

    public void setGameId(Long gameId) {
        this.gameId = gameId;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Integer getDriverId() { return driverId; }
    public void setDriverId(Integer driverId) { this.driverId = driverId; }
    public Integer getSeasonYear() { return seasonYear; }
    public void setSeasonYear(Integer seasonYear) { this.seasonYear = seasonYear; }
    public String getLang() { return lang; }
    public void setLang(String lang) { this.lang = lang; }
    public Integer getMaxPosition() { return maxPosition; }
    public void setMaxPosition(Integer maxPosition) { this.maxPosition = maxPosition; }
    public boolean isRevealed() { return revealed; }
    public void setRevealed(boolean revealed) { this.revealed = revealed; }
    public boolean isCompleted() { return completed; }
    public void setCompleted(boolean completed) { this.completed = completed; }
    public Instant getCreatedAt() { return createdAt; }


    public String getDriverName() { return driverName; }
    public void setDriverName(String driverName) { this.driverName = driverName; }
}
