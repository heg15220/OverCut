package overcutdebate.model.daos;

import overcutdebate.model.entities.DebateOpinion;
import overcutdebate.model.entities.DebateScope;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface DebateOpinionDao extends JpaRepository<DebateOpinion, Long> {

    boolean existsByDebateDayAndUserIdAndScope(LocalDate debateDay, Long userId, DebateScope scope);

    Optional<DebateOpinion> findByDebateDayAndUserIdAndScope(LocalDate debateDay, Long userId, DebateScope scope);

    long countByDebateDayAndScope(LocalDate debateDay, DebateScope scope);

    List<DebateOpinion> findByDebateDayAndScope(LocalDate debateDay, DebateScope scope);

    @Query(value = """
            SELECT *
            FROM debate_opinion
            WHERE debate_day = ?1 AND scope = ?2
            ORDER BY RAND()
            LIMIT ?3
            """, nativeQuery = true)
    List<DebateOpinion> pickRandomForDay(LocalDate debateDay, String scope, int limit);
}
