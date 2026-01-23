package overcut.model.entities;

import org.springframework.data.jpa.repository.JpaRepository;

public interface BingoSelectionDao extends JpaRepository<BingoSelection, Long> {
    boolean existsByGameIdAndCellId(Long gameId, Long cellId);
    boolean existsByGameIdAndDriverId(Long gameId, Long driverId);
    long countByGameId(Long gameId);
}
