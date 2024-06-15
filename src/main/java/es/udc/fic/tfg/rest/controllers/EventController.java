package es.udc.fic.tfg.rest.controllers;

import es.udc.fic.tfg.model.common.exceptions.InstanceNotFoundException;
import es.udc.fic.tfg.model.entities.Event;
import es.udc.fic.tfg.model.entities.Notification;
import es.udc.fic.tfg.model.services.CommentService;
import es.udc.fic.tfg.model.services.EventService;
import es.udc.fic.tfg.model.services.NotificationService;
import es.udc.fic.tfg.model.services.PostService;
import es.udc.fic.tfg.rest.dtos.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/events")
public class EventController {

    /** The post service. */
    @Autowired
    private EventService eventService;

    @Autowired
    private NotificationService notificationService;

    @GetMapping("/")
    public List<EventDto> getAllEvents(){
        return EventConversor.toEventDtos(eventService.getAllEvents());
    }
    @PostMapping("/notifications/create")
    public Long saveNotification(@RequestBody NotificationParams params) {
        return notificationService.saveNotification(params.getMessage(),params.getCreatedAt(),params.getEventId());
    }

    @PutMapping("/{notificationId}/read/{userId}")
    public void markAsRead(@PathVariable Long notificationId, @PathVariable Long userId) throws InstanceNotFoundException {
        notificationService.markAsRead(notificationId, userId);
    }

    @GetMapping("/send/{userId}/notification/{eventId}")
    public NotificationDto sendNotificationToUser(@PathVariable Long userId, @PathVariable Long eventId) throws InstanceNotFoundException{
        return NotificationConversor.toNotificationDto(notificationService.sendNotificationToUser(userId, eventId));
    }
}
