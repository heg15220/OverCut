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
import java.util.List;

@Service
@Transactional
public class CooldownServiceImpl implements CooldownService {

    private static final Duration COOLDOWN = Duration.ofHours(12);

    @Autowired private GameCooldownDao cooldownDao;
    @Autowired private UserDao userDao;

    @Override
    public boolean canPlay(String gameType, Long userId) {
        List<GameCooldown> cooldowns = cooldownDao.findByUserIdAndGameTypeOrderByLastPlayedDesc(userId, gameType);
        if (cooldowns.isEmpty()) return true;

        GameCooldown last = cooldowns.get(0);
        Duration elapsed = Duration.between(last.getLastPlayed(), LocalDateTime.now());
        return elapsed.compareTo(COOLDOWN) >= 0;
    }

    @Override
    public void registerPlay(String gameType, Long userId) {
        User user = userDao.findById(userId).orElseThrow();
        GameCooldown cooldown = new GameCooldown(user, gameType);
        cooldown.setLastPlayed(LocalDateTime.now());
        cooldownDao.save(cooldown);
    }

    @Override
    public long secondsUntilNextPlay(String gameType, Long userId) {
        List<GameCooldown> cooldowns = cooldownDao.findByUserIdAndGameTypeOrderByLastPlayedDesc(userId, gameType);
        if (cooldowns.isEmpty()) return 0L;

        GameCooldown last = cooldowns.get(0);
        long passed = Duration.between(last.getLastPlayed(), LocalDateTime.now()).getSeconds();
        return Math.max(0, COOLDOWN.getSeconds() - passed);
    }

}
