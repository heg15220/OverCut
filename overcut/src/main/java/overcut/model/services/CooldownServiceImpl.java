package overcut.model.services;

import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import overcut.model.entities.GameCooldown;
import overcut.model.entities.GameCooldownDao;
import overcut.model.entities.User;
import overcut.model.entities.UserDao;

import java.time.Duration;
import java.time.LocalDateTime;

@Service
@Transactional
public class CooldownServiceImpl implements CooldownService {

    private static final Duration COOLDOWN = Duration.ofHours(1);

    @Autowired private GameCooldownDao cooldownDao;
    @Autowired private UserDao userDao;

    @Override
    public boolean canPlay(String gameType, Long userId) {
        return cooldownDao.findByUserIdAndGameType(userId, gameType)
                .map(cd -> Duration.between(cd.getLastPlayed(), LocalDateTime.now()).compareTo(COOLDOWN) >= 0)
                .orElse(true);
    }

    @Override
    public void registerPlay(String gameType, Long userId) {
        GameCooldown cooldown = cooldownDao.findByUserIdAndGameType(userId, gameType)
                .orElseGet(() -> {
                    User user = userDao.findById(userId).orElseThrow();
                    return new GameCooldown(user, gameType);
                });
        cooldown.setLastPlayed(LocalDateTime.now());
        cooldownDao.save(cooldown);
    }

    @Override
    public long secondsUntilNextPlay(String gameType, Long userId) {
        return cooldownDao.findByUserIdAndGameType(userId, gameType)
                .map(cd -> {
                    long passed = Duration.between(cd.getLastPlayed(), LocalDateTime.now()).getSeconds();
                    return Math.max(0, COOLDOWN.getSeconds() - passed);
                }).orElse(0L);
    }
}
