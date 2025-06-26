package overcut.model.entities;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface GameCooldownDao extends JpaRepository<GameCooldown, Long> {
    Optional<GameCooldown> findByUserIdAndGameType(Long userId, String gameType);

    @Query("SELECT gc FROM GameCooldown gc WHERE gc.user.id = :userId AND gc.gameType = :gameType ORDER BY gc.lastPlayed DESC")
    List<GameCooldown> findByUserIdAndGameTypeOrderByLastPlayedDesc(Long userId, String gameType);

}
