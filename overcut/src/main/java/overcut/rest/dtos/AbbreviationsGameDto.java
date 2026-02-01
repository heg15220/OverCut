package overcut.rest.dtos;

import java.time.LocalDateTime;
import java.util.List;

public class AbbreviationsGameDto {
    private Long id;
    private LocalDateTime createdAt;
    private boolean finished;
    private int correctAnswers;
    private int totalSubmitted;
    private List<AbbreviationsAnswerDto> answers;

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

    public List<AbbreviationsAnswerDto> getAnswers() { return answers; }
    public void setAnswers(List<AbbreviationsAnswerDto> answers) { this.answers = answers; }
}
