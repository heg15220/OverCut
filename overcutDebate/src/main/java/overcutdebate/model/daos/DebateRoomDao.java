package overcutdebate.model.daos;

import overcutdebate.model.entities.*;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface DebateRoomDao extends JpaRepository<DebateRoom, Long> {
    List<DebateRoom> findByDebateDayAndScopeOrderByJoinDeadlineAsc(LocalDate debateDay, DebateScope scope);
    List<DebateRoom> findByStatus(RoomStatus status);
}
