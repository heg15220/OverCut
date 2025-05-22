package overcut.model.services;

import overcut.model.common.exceptions.InstanceNotFoundException;
import overcut.model.entities.Event;

import java.util.Date;

public interface EventService {
    void scheduleNotifications() throws InstanceNotFoundException;

    Block<Event> getEvents(int page, int size);
    Event createEvent(String name, String description, Date date, String location, String imageUrl);
    Event getEventDetails(Long eventId);
    void deleteEvent(Long eventId);
}
