package overcut.rest.dtos;

import java.time.LocalDateTime;
import java.util.List;

public class TeamNationalityGameDto {
    private Long id;
    private LocalDateTime createdAt;
    private String teamName;
    private String nationality;
    private String countryCode;
    private boolean finished;
    private int correctAnswers;
    private int totalSubmitted;
    private int maxAnswers;
    private List<TeamNationalityAnswerDto> answers;
    // getters/setters...


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

    public String getTeamName() {
        return teamName;
    }

    public void setTeamName(String teamName) {
        this.teamName = teamName;
    }

    public String getNationality() {
        return nationality;
    }

    public void setNationality(String nationality) {
        this.nationality = nationality;
    }

    public String getCountryCode() {
        return countryCode;
    }

    public void setCountryCode(String countryCode) {
        this.countryCode = countryCode;
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

    public int getMaxAnswers() {
        return maxAnswers;
    }

    public void setMaxAnswers(int maxAnswers) {
        this.maxAnswers = maxAnswers;
    }

    public List<TeamNationalityAnswerDto> getAnswers() {
        return answers;
    }

    public void setAnswers(List<TeamNationalityAnswerDto> answers) {
        this.answers = answers;
    }
}
