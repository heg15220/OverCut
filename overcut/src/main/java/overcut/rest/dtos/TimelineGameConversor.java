package overcut.rest.dtos;

import overcut.model.entities.TimelineEvent;
import overcut.model.entities.TimelineGame;

import java.util.stream.Collectors;

public class TimelineGameConversor {

    public static TimelineGameDto toDto(TimelineGame game) {
        return new TimelineGameDto(
                game.getId(),
                game.getCreatedAt(),
                game.isFinished(),
                game.getAttempts(),
                game.getEvents().stream()
                        .map(TimelineGameConversor::toEventDto)
                        .collect(Collectors.toList())
        );
    }

    public static TimelineGameRevealDto toRevealDto(TimelineGame game) {
        return new TimelineGameRevealDto(
                game.getId(),
                game.getCreatedAt(),
                game.isFinished(),
                game.getAttempts(),
                game.getEvents().stream()
                        .map(TimelineGameConversor::toEventRevealDto)
                        .collect(Collectors.toList())
        );
    }

    private static TimelineEventDto toEventDto(TimelineEvent e) {
        return new TimelineEventDto(
                e.getId(),
                e.getEventCode(),
                e.getEventText(),
                e.getHintYear()
        );
    }

    private static TimelineEventRevealDto toEventRevealDto(TimelineEvent e) {
        return new TimelineEventRevealDto(
                e.getId(),
                e.getEventCode(),
                e.getEventText(),
                e.getHintYear(),
                e.getEventDate() // 👈 aquí sale la fecha
        );
    }
}
