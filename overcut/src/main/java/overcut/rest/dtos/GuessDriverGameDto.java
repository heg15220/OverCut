package overcut.rest.dtos;

import java.time.LocalDateTime;
import java.util.List;

public class GuessDriverGameDto {
    private Long id;
    private Long driverId;
    private String driverName;
    private LocalDateTime createdAt;
    private int questionCount;
    private boolean isFinished;
    private Boolean isSuccessful;
    private List<GuessDriverQuestionDto> questions;

    public GuessDriverGameDto() {
    }

    public GuessDriverGameDto(Long id, Long driverId, String driverName, LocalDateTime createdAt, int questionCount,
                              boolean isFinished, Boolean isSuccessful, List<GuessDriverQuestionDto> questions) {
        this.id = id;
        this.driverId = driverId;
        this.driverName = driverName;
        this.createdAt = createdAt;
        this.questionCount = questionCount;
        this.isFinished = isFinished;
        this.isSuccessful = isSuccessful;
        this.questions = questions;
    }

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

    public String getDriverName() {
        return driverName;
    }

    public void setDriverName(String driverName) {
        this.driverName = driverName;
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

    public boolean isFinished() {
        return isFinished;
    }

    public void setFinished(boolean finished) {
        isFinished = finished;
    }

    public Boolean getSuccessful() {
        return isSuccessful;
    }

    public void setSuccessful(Boolean successful) {
        isSuccessful = successful;
    }

    public List<GuessDriverQuestionDto> getQuestions() {
        return questions;
    }

    public void setQuestions(List<GuessDriverQuestionDto> questions) {
        this.questions = questions;
    }
}
