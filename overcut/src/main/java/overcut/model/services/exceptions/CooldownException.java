package overcut.model.services.exceptions;

public class CooldownException extends RuntimeException {
    private final long secondsRemaining;

    public CooldownException(String message, long secondsRemaining) {
        super(message);
        this.secondsRemaining = secondsRemaining;
    }

    public long getSecondsRemaining() {
        return secondsRemaining;
    }
}
