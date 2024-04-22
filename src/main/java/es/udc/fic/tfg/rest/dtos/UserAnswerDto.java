package es.udc.fic.tfg.rest.dtos;


import java.time.LocalDateTime;

public class UserAnswerDto {
    private Long id;
    private Long userId;
    private Long questionId;
    private Long answerId;
    private Long quizId;
    private LocalDateTime answerDate;

    public UserAnswerDto(Long id, Long userId, Long questionId, Long answerId, Long quizId, LocalDateTime answerDate) {
        this.id = id;
        this.userId = userId;
        this.questionId = questionId;
        this.answerId = answerId;
        this.quizId = quizId;
        this.answerDate = answerDate;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public Long getQuestionId() {
        return questionId;
    }

    public void setQuestionId(Long questionId) {
        this.questionId = questionId;
    }

    public Long getAnswerId() {
        return answerId;
    }

    public void setAnswerId(Long answerId) {
        this.answerId = answerId;
    }

    public Long getQuizId() {
        return quizId;
    }

    public void setQuizId(Long quizId) {
        this.quizId = quizId;
    }

    public LocalDateTime getAnswerDate() {
        return answerDate;
    }

    public void setAnswerDate(LocalDateTime answerDate) {
        this.answerDate = answerDate;
    }
}
