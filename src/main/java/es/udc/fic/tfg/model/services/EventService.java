package es.udc.fic.tfg.model.services;

import es.udc.fic.tfg.model.common.exceptions.InstanceNotFoundException;
import es.udc.fic.tfg.model.entities.Event;

import java.util.Date;
import java.util.List;

public interface EventService {
    void scheduleNotifications() throws InstanceNotFoundException;

    Block<Event> getEvents(int page, int size);
    Event createEvent(String name, String description, Date date, String location, String imageUrl);
    Event getEventDetails(Long eventId);
}
