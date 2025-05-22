package overcut.rest.dtos;

import java.util.List;

public class F1WordleGameDto {
    private Long id;
    private boolean finished;
    private Boolean successful;
    private String surname;
    private List<F1WordleAttemptDto> attempts;

    public F1WordleGameDto() {
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public boolean isFinished() {
        return finished;
    }

    public void setFinished(boolean finished) {
        this.finished = finished;
    }

    public Boolean getSuccessful() {
        return successful;
    }

    public void setSuccessful(Boolean successful) {
        this.successful = successful;
    }

    public String getSurname() {
        return surname;
    }

    public void setSurname(String surname) {
        this.surname = surname;
    }

    public List<F1WordleAttemptDto> getAttempts() {
        return attempts;
    }

    public void setAttempts(List<F1WordleAttemptDto> attempts) {
        this.attempts = attempts;
    }
}
