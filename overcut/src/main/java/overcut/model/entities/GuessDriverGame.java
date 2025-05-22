package overcut.model.entities;


import jakarta.persistence.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
public class GuessDriverGame {


    private Long id;

    private Long driverId;

    private LocalDateTime createdAt = LocalDateTime.now();

    private int questionCount = 0;

    private boolean isFinished = false;

    private Boolean isSuccessful;

    private String driverName;

    private List<GuessDriverQuestion> questions = new ArrayList<>();


    public GuessDriverGame() {
    }

    public GuessDriverGame(Long driverId, LocalDateTime createdAt, int questionCount, boolean isFinished,
                           Boolean isSuccessful, String driverName, List<GuessDriverQuestion> questions) {
        this.driverId = driverId;
        this.createdAt = createdAt;
        this.questionCount = questionCount;
        this.isFinished = isFinished;
        this.isSuccessful = isSuccessful;
        this.driverName = driverName;
        this.questions = questions;
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getDriverId() {
        return driverId;
    }

    public void setDriverId(Long driverId) {
        this.driverId = driverId;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public int getQuestionCount() {
        return questionCount;
    }

    public void setQuestionCount(int questionCount) {
        this.questionCount = questionCount;
    }

    @Column(name = "finished", nullable = false)
    public boolean isFinished() {
        return isFinished;
    }

    public void setFinished(boolean finished) {
        isFinished = finished;
    }

    @Column(name = "successful")
    public Boolean getSuccessful() {
        return isSuccessful;
    }

    public void setSuccessful(Boolean successful) {
        isSuccessful = successful;
    }

    public String getDriverName() {
        return driverName;
    }

    public void setDriverName(String driverName) {
        this.driverName = driverName;
    }

    @OneToMany(mappedBy = "game", cascade = CascadeType.ALL, orphanRemoval = true)
    public List<GuessDriverQuestion> getQuestions() {
        return questions;
    }

    public void setQuestions(List<GuessDriverQuestion> questions) {
        this.questions = questions;
    }
}
