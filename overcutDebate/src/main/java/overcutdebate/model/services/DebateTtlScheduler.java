package overcutdebate.model.services;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import overcutdebate.model.daos.DebateMessageDao;
import overcutdebate.model.daos.DebateRoomDao;

import java.time.Instant;
import java.time.Duration;

@Component
public class DebateTtlScheduler {

    private static final Duration TTL = Duration.ofHours(28);

    private final DebateMessageDao messageDao;
    private final DebateRoomDao roomDao;
    private final DebateClock clock;

    public DebateTtlScheduler(DebateMessageDao messageDao, DebateRoomDao roomDao, DebateClock clock) {
        this.messageDao = messageDao;
        this.roomDao = roomDao;
        this.clock = clock;
    }

    @Scheduled(fixedDelay = 60_000) // 1 minuto
    @Transactional
    public void tick() {
        Instant cutoff = clock.nowInstant().minus(TTL);

        // ✅ borra mensajes viejos
        messageDao.deleteByCreatedAtBefore(cutoff);

        // ✅ borra salas viejas (FK cascade -> participants + messages)
        roomDao.deleteByCreatedAtBefore(cutoff);
    }
}
