package overcut.model.entities;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface Top10QualiSlotDao extends JpaRepository<Top10QualiSlot, Long> {
    List<Top10QualiSlot> findByGameId(Long gameId);
}
