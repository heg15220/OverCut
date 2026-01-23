package overcut.model.entities;

import overcut.model.entities.DriverSeasonRound;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface DriverSeasonRoundDao extends JpaRepository<DriverSeasonRound, Long> {
    List<DriverSeasonRound> findByGame_GameIdOrderByRoundNumberAsc(Long gameId);
    Optional<DriverSeasonRound> findByGame_GameIdAndRaceId(Long gameId, Integer raceId);
    long countByGame_GameIdAndIsCorrectTrue(Long gameId);
    long countByGame_GameId(Long gameId);
}
