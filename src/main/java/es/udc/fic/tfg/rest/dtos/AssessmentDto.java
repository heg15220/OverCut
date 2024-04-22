package es.udc.fic.tfg.rest.dtos;


public class AssessmentDto {
    private Long id;

    private int points;
    private Long userId;

    private Long quizId;

    public AssessmentDto(Long id, int points, Long userId, Long quizId) {
        this.id = id;
        this.points = points;
        this.userId = userId;
        this.quizId = quizId;
    }


    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public int getPoints() {
        return points;
    }

    public void setPoints(int points) {
        this.points = points;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public Long getQuizId() {
        return quizId;
    }

    public void setQuizId(Long quizId) {
        this.quizId = quizId;
    }
}
