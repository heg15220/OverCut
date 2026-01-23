package overcut.model.entities;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface TowerAttemptDao extends JpaRepository<TowerAttempt, Long> {
    List<TowerAttempt> findByGame_IdOrderByCreatedAtAsc(Long gameId);
    boolean existsByGame_IdAndDriverNameIgnoreCase(Long gameId, String driverName);
}
