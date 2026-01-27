package overcutdebate.rest.controllers;

import org.springframework.web.bind.annotation.*;
import overcutdebate.model.entities.DebateScope;
import overcutdebate.model.services.DailyRoomSeederScheduler;
import overcutdebate.model.services.DebateClock;
import overcutdebate.model.daos.DebateOpinionDao;
import overcutdebate.rest.dtos.SeedResultDto;

@RestController
@RequestMapping("/api/debate/admin")
public class DebateAdminSeedController {

    private final DailyRoomSeederScheduler seeder;
    private final DebateClock clock;
    private final DebateOpinionDao opinionDao;

    public DebateAdminSeedController(DailyRoomSeederScheduler seeder, DebateClock clock, DebateOpinionDao opinionDao) {
        this.seeder = seeder;
        this.clock = clock;
        this.opinionDao = opinionDao;
    }

    @PostMapping("/seedToday")
    public SeedResultDto seedToday(@RequestParam String scope) {
        DebateScope sc = DebateScope.valueOf(scope);
        long available = opinionDao.countByDebateDayAndScope(clock.today(), sc);

        int created = seeder.seedNow(sc);

        SeedResultDto dto = new SeedResultDto();
        dto.scope = sc.name();
        dto.day = clock.today().toString();
        dto.opinionsAvailable = available;
        dto.roomsCreated = created;
        dto.seeded = created > 0;
        return dto;
    }
}
