package es.udc.fic.tfg.rest.dtos;

import es.udc.fic.tfg.model.entities.Notification;
import es.udc.fic.tfg.model.entities.User;
import es.udc.fic.tfg.model.entities.UserNotification;

import java.util.List;
import java.util.stream.Collectors;

public class UserNotificationConversor {
    private UserNotificationConversor() {
    }

    public static final UserNotificationDto toUserNotificationDto(UserNotification notification) {
        return new UserNotificationDto(notification.getId(),notification.getNotification().getId(),
                notification.getUser().getId(),notification.getRead(),notification.getEvent().getId());
    }

    public static final List<UserNotificationDto> toUserNotificationDtos(List<UserNotification> notifications) {
        return notifications.stream().map(UserNotificationConversor::toUserNotificationDto).collect(Collectors.toList());
    }
}
