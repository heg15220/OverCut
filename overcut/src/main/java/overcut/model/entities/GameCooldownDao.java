package overcut.model.entities;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface GameCooldownDao extends JpaRepository<GameCooldown, Long> {
    Optional<GameCooldown> findByUserIdAndGameType(Long userId, String gameType);
}
