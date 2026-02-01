package overcut.model.entities;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
public class AbbreviationsGame {

    private Long id;
    private LocalDateTime createdAt = LocalDateTime.now();

    private boolean finished = false;
    private int correctAnswers = 0;
    private int totalSubmitted = 0;

    private List<AbbreviationsAnswer> answers = new ArrayList<>();

    public AbbreviationsGame() {}

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public boolean isFinished() { return finished; }
    public void setFinished(boolean finished) { this.finished = finished; }

    public int getCorrectAnswers() { return correctAnswers; }
    public void setCorrectAnswers(int correctAnswers) { this.correctAnswers = correctAnswers; }

    public int getTotalSubmitted() { return totalSubmitted; }
    public void setTotalSubmitted(int totalSubmitted) { this.totalSubmitted = totalSubmitted; }

    @OneToMany(mappedBy = "game", cascade = CascadeType.ALL, orphanRemoval = true)
    public List<AbbreviationsAnswer> getAnswers() { return answers; }
    public void setAnswers(List<AbbreviationsAnswer> answers) { this.answers = answers; }
}
