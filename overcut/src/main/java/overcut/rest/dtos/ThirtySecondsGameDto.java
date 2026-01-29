package overcut.rest.dtos;

import java.time.LocalDateTime;
import java.util.List;

public class ThirtySecondsGameDto {
    private Long id;
    private LocalDateTime createdAt;
    private String themeType;
    private String themeValue;
    private boolean finished;
    private int correctAnswers;
    private int totalSubmitted;
    private List<ThirtySecondsAnswerDto> answers;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public String getThemeType() {
        return themeType;
    }

    public void setThemeType(String themeType) {
        this.themeType = themeType;
    }

    public String getThemeValue() {
        return themeValue;
    }

    public void setThemeValue(String themeValue) {
        this.themeValue = themeValue;
    }

    public boolean isFinished() {
        return finished;
    }

    public void setFinished(boolean finished) {
        this.finished = finished;
    }

    public int getCorrectAnswers() {
        return correctAnswers;
    }

    public void setCorrectAnswers(int correctAnswers) {
        this.correctAnswers = correctAnswers;
    }

    public int getTotalSubmitted() {
        return totalSubmitted;
    }

    public void setTotalSubmitted(int totalSubmitted) {
        this.totalSubmitted = totalSubmitted;
    }

    public List<ThirtySecondsAnswerDto> getAnswers() {
        return answers;
    }

    public void setAnswers(List<ThirtySecondsAnswerDto> answers) {
        this.answers = answers;
    }
}
