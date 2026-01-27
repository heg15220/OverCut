package overcutdebate.model.daos;

import overcutdebate.model.entities.DebateRoom;
import overcutdebate.model.entities.DebateScope;
import overcutdebate.model.entities.RoomStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DebateRoomDao extends JpaRepository<DebateRoom, Long> {
    List<DebateRoom> findByScopeOrderByJoinDeadlineAsc(DebateScope scope);
    List<DebateRoom> findByStatus(RoomStatus status);
}
