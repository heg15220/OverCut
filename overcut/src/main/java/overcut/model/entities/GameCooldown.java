package overcut.model.entities;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
public class GameCooldown {

    private Long id;

    private User user;

    @Column(nullable = false)
    private String gameType;

    @Column(nullable = false)
    private LocalDateTime lastPlayed;

    public GameCooldown() {}

    public GameCooldown(User user, String gameType) {
        this.user = user;
        this.gameType = gameType;
        this.lastPlayed = LocalDateTime.now();
    }

    // Getters y Setters

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    @ManyToOne(optional = false)
    @JoinColumn(name = "userId")
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public String getGameType() { return gameType; }
    public void setGameType(String gameType) { this.gameType = gameType; }

    public LocalDateTime getLastPlayed() { return lastPlayed; }
    public void setLastPlayed(LocalDateTime lastPlayed) { this.lastPlayed = lastPlayed; }
}
