package overcutdebate.model.daos;

import overcutdebate.model.entities.DebateRoomParticipant;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface DebateRoomParticipantDao extends JpaRepository<DebateRoomParticipant, Long> {
    long countByRoomId(Long roomId);
    Optional<DebateRoomParticipant> findByRoomIdAndUserId(Long roomId, Long userId);
    List<DebateRoomParticipant> findByRoomId(Long roomId);
}
