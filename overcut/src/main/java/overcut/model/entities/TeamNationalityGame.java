package overcut.model.entities;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
public class TeamNationalityGame {

    private Long id;
    private LocalDateTime createdAt = LocalDateTime.now();

    private String teamName;
    private String nationality;
    private String countryCode;

    private boolean finished = false;
    private int correctAnswers = 0;
    private int totalSubmitted = 0;
    private int maxAnswers = 30;

    private List<TeamNationalityAnswer> answers = new ArrayList<>();

    public TeamNationalityGame() {}

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public String getTeamName() { return teamName; }
    public void setTeamName(String teamName) { this.teamName = teamName; }

    public String getNationality() { return nationality; }
    public void setNationality(String nationality) { this.nationality = nationality; }

    public String getCountryCode() { return countryCode; }
    public void setCountryCode(String countryCode) { this.countryCode = countryCode; }

    public boolean isFinished() { return finished; }
    public void setFinished(boolean finished) { this.finished = finished; }

    public int getCorrectAnswers() { return correctAnswers; }
    public void setCorrectAnswers(int correctAnswers) { this.correctAnswers = correctAnswers; }

    public int getTotalSubmitted() { return totalSubmitted; }
    public void setTotalSubmitted(int totalSubmitted) { this.totalSubmitted = totalSubmitted; }

    public int getMaxAnswers() { return maxAnswers; }
    public void setMaxAnswers(int maxAnswers) { this.maxAnswers = maxAnswers; }

    @OneToMany(mappedBy = "game", cascade = CascadeType.ALL, orphanRemoval = true)
    public List<TeamNationalityAnswer> getAnswers() { return answers; }
    public void setAnswers(List<TeamNationalityAnswer> answers) { this.answers = answers; }
}
