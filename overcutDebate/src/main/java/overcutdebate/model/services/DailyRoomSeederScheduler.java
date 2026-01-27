package overcutdebate.model.services;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import overcutdebate.model.daos.*;
import overcutdebate.model.entities.*;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

@Component
public class DailyRoomSeederScheduler {

    private final DebateOpinionDao opinionDao;
    private final DebateDailySeedDao seedDao;
    private final DebateRoomDao roomDao;
    private final DebateClock clock;

    private final int dailyRooms;   // max rooms per day (default 20)
    private final int joinSeconds;
    private final int liveMinutes;

    public DailyRoomSeederScheduler(DebateOpinionDao opinionDao,
                                    DebateDailySeedDao seedDao,
                                    DebateRoomDao roomDao,
                                    DebateClock clock,
                                    @Value("${debate.dailyRooms:20}") int dailyRooms,
                                    @Value("${debate.joinSeconds:120}") int joinSeconds,
                                    @Value("${debate.liveMinutes:10}") int liveMinutes) {
        this.opinionDao = opinionDao;
        this.seedDao = seedDao;
        this.roomDao = roomDao;
        this.clock = clock;
        this.dailyRooms = dailyRooms;
        this.joinSeconds = joinSeconds;
        this.liveMinutes = liveMinutes;
    }

    @Scheduled(fixedDelay = 3000)
    @Transactional
    public void tick() {
        seedForScope(DebateScope.ES);
        seedForScope(DebateScope.INT);
    }

    public int seedNow(DebateScope scope) {
        return seedForScope(scope);
    }

    private int seedForScope(DebateScope scope) {
        LocalDate day = clock.today();

        // ✅ idempotente: si ya se hizo seed para hoy+scope, no repetir
        if (seedDao.existsByDayAndScope(day, scope)) return 0;

        long available = opinionDao.countByDebateDayAndScope(day, scope);

        // ✅ NUEVA REGLA:
        // - si hay < 20 opiniones: crear salas con TODAS (available)
        // - si hay >= 20: crear 20 aleatorias
        int toPick = (int) Math.min(dailyRooms, available);
        if (toPick <= 0) return 0;

        // ✅ selecciona "toPick" aleatorias; si toPick == available (<20), en la práctica son todas
        List<DebateOpinion> picks = opinionDao.pickRandomForDay(day, scope.name(), toPick);
        if (picks == null || picks.isEmpty()) return 0;

        Instant now = clock.nowInstant();

        for (DebateOpinion o : picks) {
            DebateRoom r = new DebateRoom();
            r.setScope(scope);
            r.setDebateDay(day);
            r.setOpinionId(o.getId());
            r.setTopic(o.getText()); // topic = texto de opinion
            r.setStatus(RoomStatus.OPEN);
            r.setCreatedAt(now);
            r.setJoinDeadline(now.plusSeconds(joinSeconds));
            r.setPollDeadline(null);
            // OPEN (joinSeconds) + POLL (30s) + LIVE (liveMinutes)
            r.setLiveDeadline(now.plusSeconds(joinSeconds).plusSeconds(30).plusSeconds(liveMinutes * 60L));
            roomDao.save(r);
        }

        // ✅ marca el seed del día (solo si realmente se han creado salas)
        DebateDailySeed seed = new DebateDailySeed();
        seed.setScope(scope);
        seed.setDay(day);
        seed.setCreatedAt(now);
        seedDao.save(seed);

        return picks.size();
    }
}
