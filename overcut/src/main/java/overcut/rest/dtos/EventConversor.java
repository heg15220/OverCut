package overcut.rest.dtos;

import overcut.model.entities.Event;

import java.util.List;
import java.util.stream.Collectors;

public class EventConversor {
    private EventConversor() {
    }

    public static final EventDto toEventDto(Event event) {
        return new EventDto(event.getId(), event.getName(), event.getDescription(), event.getDate(),event.getLocation(),
                event.getImageUrl());
    }

    public static final List<EventDto> toEventDtos(List<Event> events) {
        return events.stream().map(EventConversor::toEventDto).collect(Collectors.toList());
    }
}
