package overcut.model.entities;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
public class TowerGame {

    private Long id;
    private LocalDateTime createdAt = LocalDateTime.now();

    private String lang;
    private String themeKey;     // oculta
    private String themeType;    // pista: team/nationality/...

    private boolean hintUsed = false;
    private int attempts = 0;
    private boolean finished = false;

    private boolean solved = false;

    private List<TowerAttempt> attemptList = new ArrayList<>();

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public String getLang() { return lang; }
    public void setLang(String lang) { this.lang = lang; }

    public String getThemeKey() { return themeKey; }
    public void setThemeKey(String themeKey) { this.themeKey = themeKey; }

    public String getThemeType() { return themeType; }
    public void setThemeType(String themeType) { this.themeType = themeType; }

    public boolean isHintUsed() { return hintUsed; }
    public void setHintUsed(boolean hintUsed) { this.hintUsed = hintUsed; }

    public int getAttempts() { return attempts; }
    public void setAttempts(int attempts) { this.attempts = attempts; }

    public boolean isFinished() { return finished; }
    public void setFinished(boolean finished) { this.finished = finished; }

    public boolean isSolved() {
        return solved;
    }

    public void setSolved(boolean solved) {
        this.solved = solved;
    }

    @OneToMany(mappedBy = "game", cascade = CascadeType.ALL, orphanRemoval = true)
    public List<TowerAttempt> getAttemptList() { return attemptList; }
    public void setAttemptList(List<TowerAttempt> attemptList) { this.attemptList = attemptList; }
}
