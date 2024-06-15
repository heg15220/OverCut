package es.udc.fic.tfg.rest.dtos;

import es.udc.fic.tfg.model.entities.Event;
import es.udc.fic.tfg.model.entities.Notification;

import java.util.List;
import java.util.stream.Collectors;

public class NotificationConversor {
    private NotificationConversor() {
    }

    public static final NotificationDto toNotificationDto(Notification notification) {
        return new NotificationDto(notification.getId(),notification.getMessage(),notification.getCreatedAt(),
                notification.getEvent().getId());
    }

    public static final List<NotificationDto> toNotificationDtos(List<Notification> notifications) {
        return notifications.stream().map(NotificationConversor::toNotificationDto).collect(Collectors.toList());
    }
}
