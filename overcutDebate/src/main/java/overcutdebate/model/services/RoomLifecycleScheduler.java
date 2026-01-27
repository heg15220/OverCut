package overcutdebate.model.services;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import overcutdebate.model.daos.DebateRoomDao;
import overcutdebate.model.daos.DebateRoomParticipantDao;
import overcutdebate.model.entities.DebateRoom;
import overcutdebate.model.entities.RoomStatus;

import java.time.Instant;
import java.util.List;

@Component
public class RoomLifecycleScheduler {

    private final DebateRoomDao roomDao;
    private final DebateRoomParticipantDao participantDao;
    private final int pollSeconds;

    public RoomLifecycleScheduler(DebateRoomDao roomDao,
                                  DebateRoomParticipantDao participantDao,
                                  @Value("${debate.pollSeconds:30}") int pollSeconds) {
        this.roomDao = roomDao;
        this.participantDao = participantDao;
        this.pollSeconds = pollSeconds;
    }

    @Scheduled(fixedDelay = 1000)
    @Transactional
    public void tick() {
        Instant now = Instant.now();

        // OPEN -> POLL (si se acabó join, y hay participantes; si no, CLOSED)
        List<DebateRoom> openRooms = roomDao.findByStatus(RoomStatus.OPEN);
        for (DebateRoom r : openRooms) {
            if (!now.isBefore(r.getJoinDeadline())) {
                long participants = participantDao.countByRoomId(r.getId());
                if (participants <= 0) {
                    r.setStatus(RoomStatus.CLOSED);
                    roomDao.save(r);
                } else {
                    r.setStatus(RoomStatus.POLL);
                    r.setPollDeadline(now.plusSeconds(pollSeconds));
                    roomDao.save(r);
                }
            }
        }

        // POLL -> LIVE
        List<DebateRoom> pollRooms = roomDao.findByStatus(RoomStatus.POLL);
        for (DebateRoom r : pollRooms) {
            if (r.getPollDeadline() != null && !now.isBefore(r.getPollDeadline())) {
                r.setStatus(RoomStatus.LIVE);
                roomDao.save(r);
            }
        }

        // LIVE -> CLOSED (por deadline)
        List<DebateRoom> liveRooms = roomDao.findByStatus(RoomStatus.LIVE);
        for (DebateRoom r : liveRooms) {
            if (r.getLiveDeadline() != null && !now.isBefore(r.getLiveDeadline())) {
                r.setStatus(RoomStatus.CLOSED);
                roomDao.save(r);
            }
        }
    }
}
