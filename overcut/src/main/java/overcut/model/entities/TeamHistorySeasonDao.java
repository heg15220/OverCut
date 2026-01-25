package overcut.model.entities;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface TeamHistorySeasonDao extends JpaRepository<TeamHistorySeason, Long> {
    List<TeamHistorySeason> findByGame_GameIdOrderBySeasonYearAsc(Long gameId);
    Optional<TeamHistorySeason> findByGame_GameIdAndSeasonYear(Long gameId, Integer seasonYear);
    long countByGame_GameId(Long gameId);
    long countByGame_GameIdAndIsCorrectTrue(Long gameId);
}
