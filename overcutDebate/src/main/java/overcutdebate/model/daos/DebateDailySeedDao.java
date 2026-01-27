package overcutdebate.model.daos;

import overcutdebate.model.entities.DebateDailySeed;
import overcutdebate.model.entities.DebateScope;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;

public interface DebateDailySeedDao extends JpaRepository<DebateDailySeed, Long> {
    boolean existsByDayAndScope(LocalDate day, DebateScope scope);
}
