package overcut.model.entities;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
public class HigherLowerGame {

    private Long id;
    private LocalDateTime createdAt = LocalDateTime.now();

    private String statCode;
    private String themeDescription;

    private boolean finished = false;
    private Boolean won;

    private int currentIndex = 0;
    private int score = 0;

    private List<HigherLowerEntry> entries = new ArrayList<>();

    public HigherLowerGame() {}

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public String getStatCode() { return statCode; }
    public void setStatCode(String statCode) { this.statCode = statCode; }

    public String getThemeDescription() { return themeDescription; }
    public void setThemeDescription(String themeDescription) { this.themeDescription = themeDescription; }

    public boolean isFinished() { return finished; }
    public void setFinished(boolean finished) { this.finished = finished; }

    public Boolean getWon() { return won; }
    public void setWon(Boolean won) { this.won = won; }

    public int getCurrentIndex() { return currentIndex; }
    public void setCurrentIndex(int currentIndex) { this.currentIndex = currentIndex; }

    public int getScore() { return score; }
    public void setScore(int score) { this.score = score; }

    @OneToMany(mappedBy = "game", cascade = CascadeType.ALL, orphanRemoval = true)
    public List<HigherLowerEntry> getEntries() { return entries; }
    public void setEntries(List<HigherLowerEntry> entries) { this.entries = entries; }
}
