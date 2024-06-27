package es.udc.fic.tfg.rest.dtos;


import java.time.LocalDateTime;

public class QuizDto {
    private Long id;

    private int maxLength = 10;

    private LocalDateTime date;

    private int knowledgeLevel;

    private Long assessmentId;

    private int points;

    public QuizDto(Long id, int maxLength, LocalDateTime date, int knowledgeLevel, Long assessmentId, int points) {
        this.id = id;
        this.maxLength = maxLength;
        this.date = date;
        this.knowledgeLevel = knowledgeLevel;
        this.assessmentId = assessmentId;
        this.points = points;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public int getMaxLength() {
        return maxLength;
    }

    public void setMaxLength(int maxLength) {
        this.maxLength = maxLength;
    }

    public LocalDateTime getDate() {
        return date;
    }

    public void setDate(LocalDateTime date) {
        this.date = date;
    }

    public int getKnowledgeLevel() {
        return knowledgeLevel;
    }

    public void setKnowledgeLevel(int knowledgeLevel) {
        this.knowledgeLevel = knowledgeLevel;
    }

    public Long getAssessmentId() {
        return assessmentId;
    }

    public void setAssessmentId(Long assessmentId) {
        this.assessmentId = assessmentId;
    }

    public int getPoints() {
        return points;
    }

    public void setPoints(int points) {
        this.points = points;
    }
}
