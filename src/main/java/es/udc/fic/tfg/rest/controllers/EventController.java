package es.udc.fic.tfg.rest.controllers;

import es.udc.fic.tfg.model.common.exceptions.InstanceNotFoundException;
import es.udc.fic.tfg.model.entities.Notification;
import es.udc.fic.tfg.model.entities.Post;
import es.udc.fic.tfg.model.entities.User;
import es.udc.fic.tfg.model.entities.UserNotification;
import es.udc.fic.tfg.model.services.Block;
import es.udc.fic.tfg.model.services.EventService;
import es.udc.fic.tfg.model.services.NotificationService;
import es.udc.fic.tfg.rest.dtos.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.validation.annotation.Validated;
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

    @GetMapping("/{userId}/notifications")
    public BlockDto<UserNotificationDto> getNotificationsForUser(@PathVariable Long userId,@RequestParam(defaultValue = "0") int page)
            throws InstanceNotFoundException{
        Block<UserNotification> userNotificationBlock = notificationService.getNotificationsForUser(userId,page,2);

        return new BlockDto<>(UserNotificationConversor.toUserNotificationDtos(userNotificationBlock.getItems())
                ,userNotificationBlock.getExistMoreItems());
    }
}
