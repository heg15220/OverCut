package overcut.rest.dtos;

public class BingoSelectResponseDto {
    private boolean correct;
    private boolean finished;
    private String message;

    public BingoSelectResponseDto() {}

    public BingoSelectResponseDto(boolean correct, boolean finished, String message) {
        this.correct = correct;
        this.finished = finished;
        this.message = message;
    }

    public boolean isCorrect() { return correct; }
    public void setCorrect(boolean correct) { this.correct = correct; }

    public boolean isFinished() { return finished; }
    public void setFinished(boolean finished) { this.finished = finished; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
}
