package overcut.model.entities;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
public class ThirtySecondsGame {

    private Long id;
    private LocalDateTime createdAt = LocalDateTime.now();

    private String themeType;
    private String themeValue;

    private boolean finished = false;
    private int correctAnswers = 0;
    private int totalSubmitted = 0;

    private List<ThirtySecondsAnswer> answers = new ArrayList<>();

    public ThirtySecondsGame() {}

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public String getThemeType() { return themeType; }
    public void setThemeType(String themeType) { this.themeType = themeType; }

    public String getThemeValue() { return themeValue; }
    public void setThemeValue(String themeValue) { this.themeValue = themeValue; }

    public boolean isFinished() { return finished; }
    public void setFinished(boolean finished) { this.finished = finished; }

    public int getCorrectAnswers() { return correctAnswers; }
    public void setCorrectAnswers(int correctAnswers) { this.correctAnswers = correctAnswers; }

    public int getTotalSubmitted() { return totalSubmitted; }
    public void setTotalSubmitted(int totalSubmitted) { this.totalSubmitted = totalSubmitted; }

    @OneToMany(mappedBy = "game", cascade = CascadeType.ALL, orphanRemoval = true)
    public List<ThirtySecondsAnswer> getAnswers() { return answers; }
    public void setAnswers(List<ThirtySecondsAnswer> answers) { this.answers = answers; }
}
