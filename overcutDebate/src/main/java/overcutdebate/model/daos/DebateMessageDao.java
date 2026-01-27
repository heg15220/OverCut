package overcutdebate.model.daos;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import overcutdebate.model.entities.DebateMessage;

import java.time.Instant;
import java.util.List;

public interface DebateMessageDao extends JpaRepository<DebateMessage, Long> {

    @Query("SELECT m FROM DebateMessage m WHERE m.roomId = :roomId ORDER BY m.createdAt DESC")
    List<DebateMessage> findLatestByRoomId(@Param("roomId") Long roomId, Pageable pageable);

    long deleteByCreatedAtBefore(Instant cutoff);
}
