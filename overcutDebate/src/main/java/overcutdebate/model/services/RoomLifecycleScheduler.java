package overcutdebate.model.services;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import overcutdebate.model.daos.DebateRoomDao;
import overcutdebate.model.entities.DebateRoom;
import overcutdebate.model.entities.RoomStatus;

import java.time.Instant;
import java.util.List;

@Component
public class RoomLifecycleScheduler {

    private final DebateRoomDao roomDao;

    public RoomLifecycleScheduler(DebateRoomDao roomDao) {
        this.roomDao = roomDao;
    }

    @Scheduled(fixedDelay = 1000)
    @Transactional
    public void tick() {
        Instant now = Instant.now();

        // OPEN -> POLL
        List<DebateRoom> openRooms = roomDao.findByStatus(RoomStatus.OPEN);
        for (DebateRoom r : openRooms) {
            if (!now.isBefore(r.getJoinDeadline())) {
                r.setStatus(RoomStatus.POLL);
                r.setPollDeadline(now.plusSeconds(30));
                roomDao.save(r);
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
    }
}
