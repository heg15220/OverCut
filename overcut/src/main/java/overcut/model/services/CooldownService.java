package overcut.model.services;

public interface CooldownService {
    boolean canPlay(String gameType, Long userId);
    void registerPlay(String gameType, Long userId);
    long secondsUntilNextPlay(String gameType, Long userId);
}
