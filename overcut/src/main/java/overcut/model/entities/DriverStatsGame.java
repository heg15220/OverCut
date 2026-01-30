package overcut.model.entities;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "driver_stats_game")
public class DriverStatsGame {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name="user_id", nullable = false)
    private Long userId;

    @Column(name="driver_id", nullable = false)
    private Long driverId;

    @Column(name="driver_name", nullable = false, length = 120)
    private String driverName;

    @Column(nullable = false)
    private boolean finished = false;

    @Column(name="correct_count")
    private Integer correctCount;

    // respuestas usuario (guardadas)
    @Column(name="user_wins")
    private Integer userWins;

    @Column(name="user_podiums")
    private Integer userPodiums;

    @Column(name="user_teams")
    private Integer userTeams;

    @Column(name="user_titles")
    private Integer userTitles;

    @Column(name="user_seasons")
    private Integer userSeasons;

    @Column(name="user_races_bin", length = 20)
    private String userRacesBin;

    @Column(name="user_points_bin", length = 20)
    private String userPointsBin;

    @Column(name="created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name="finished_at")
    private LocalDateTime finishedAt;

    @PrePersist
    public void prePersist() {
        if (createdAt == null) createdAt = LocalDateTime.now();
    }

    // getters/setters
    public Long getId() { return id; }
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public Long getDriverId() { return driverId; }
    public void setDriverId(Long driverId) { this.driverId = driverId; }

    public String getDriverName() { return driverName; }
    public void setDriverName(String driverName) { this.driverName = driverName; }

    public boolean isFinished() { return finished; }
    public void setFinished(boolean finished) { this.finished = finished; }

    public Integer getCorrectCount() { return correctCount; }
    public void setCorrectCount(Integer correctCount) { this.correctCount = correctCount; }

    public Integer getUserWins() { return userWins; }
    public void setUserWins(Integer userWins) { this.userWins = userWins; }

    public Integer getUserPodiums() { return userPodiums; }
    public void setUserPodiums(Integer userPodiums) { this.userPodiums = userPodiums; }

    public Integer getUserTeams() { return userTeams; }
    public void setUserTeams(Integer userTeams) { this.userTeams = userTeams; }

    public Integer getUserTitles() { return userTitles; }
    public void setUserTitles(Integer userTitles) { this.userTitles = userTitles; }

    public Integer getUserSeasons() { return userSeasons; }
    public void setUserSeasons(Integer userSeasons) { this.userSeasons = userSeasons; }

    public String getUserRacesBin() { return userRacesBin; }
    public void setUserRacesBin(String userRacesBin) { this.userRacesBin = userRacesBin; }

    public String getUserPointsBin() { return userPointsBin; }
    public void setUserPointsBin(String userPointsBin) { this.userPointsBin = userPointsBin; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getFinishedAt() { return finishedAt; }
    public void setFinishedAt(LocalDateTime finishedAt) { this.finishedAt = finishedAt; }
}
