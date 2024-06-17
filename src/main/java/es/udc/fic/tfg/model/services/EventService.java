package es.udc.fic.tfg.model.services;

import es.udc.fic.tfg.model.common.exceptions.InstanceNotFoundException;
import es.udc.fic.tfg.model.entities.Event;

import java.util.List;

public interface EventService {
    void scheduleNotifications() throws InstanceNotFoundException;

    List<Event> getAllEvents();
    Event getEventDetails(Long eventId);
}
