package overcutdebate.model.services;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.time.*;

@Component
public class DebateClock {

    private final ZoneId zoneId;

    public DebateClock(@Value("${debate.timezone:Europe/Madrid}") String tz) {
        this.zoneId = ZoneId.of(tz);
    }

    public ZoneId zone() {
        return zoneId;
    }

    public LocalDate today() {
        return LocalDate.now(zoneId);
    }

    public Instant nowInstant() {
        return Instant.now();
    }
}
