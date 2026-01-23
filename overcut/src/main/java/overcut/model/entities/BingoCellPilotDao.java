package overcut.model.entities;

import org.springframework.data.jpa.repository.JpaRepository;

public interface BingoCellPilotDao extends JpaRepository<BingoCellPilot, Long> {
    boolean existsByCellIdAndDriverId(Long cellId, Long driverId);
}
