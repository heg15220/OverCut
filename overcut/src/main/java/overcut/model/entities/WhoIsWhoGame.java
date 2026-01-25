package overcut.model.entities;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
public class WhoIsWhoGame {

    private Long id;
    private LocalDateTime createdAt = LocalDateTime.now();

    private boolean finished;
    private boolean won;

    private String lang;

    private Long secretDriverId;
    private String secretDriverName;

    private int hintsShown;
    private int maxHints = 15;

    private int attemptsUsed;
    private int maxAttempts = 3;

    private List<WhoIsWhoHint> hints = new ArrayList<>();

    public WhoIsWhoGame() {}

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public boolean isFinished() { return finished; }
    public void setFinished(boolean finished) { this.finished = finished; }

    public boolean isWon() { return won; }
    public void setWon(boolean won) { this.won = won; }

    public String getLang() { return lang; }
    public void setLang(String lang) { this.lang = lang; }

    public Long getSecretDriverId() { return secretDriverId; }
    public void setSecretDriverId(Long secretDriverId) { this.secretDriverId = secretDriverId; }

    public String getSecretDriverName() { return secretDriverName; }
    public void setSecretDriverName(String secretDriverName) { this.secretDriverName = secretDriverName; }

    public int getHintsShown() { return hintsShown; }
    public void setHintsShown(int hintsShown) { this.hintsShown = hintsShown; }

    public int getMaxHints() { return maxHints; }
    public void setMaxHints(int maxHints) { this.maxHints = maxHints; }

    public int getAttemptsUsed() { return attemptsUsed; }
    public void setAttemptsUsed(int attemptsUsed) { this.attemptsUsed = attemptsUsed; }

    public int getMaxAttempts() { return maxAttempts; }
    public void setMaxAttempts(int maxAttempts) { this.maxAttempts = maxAttempts; }

    @OneToMany(mappedBy = "game", cascade = CascadeType.ALL, orphanRemoval = true)
    public List<WhoIsWhoHint> getHints() { return hints; }
    public void setHints(List<WhoIsWhoHint> hints) { this.hints = hints; }
}
