package overcut.rest.dtos;

import overcut.model.entities.Notification;

import java.util.Date;
import java.util.List;
import java.util.stream.Collectors;

public class NotificationConversor {
    private NotificationConversor() {
    }

    public static final NotificationDto toNotificationDto(Notification notification) {
        String message;
        if (notification.getEvent().getName().length() > 25) {
                message = notification.getEvent().getName().substring(0, 22) + "...";
            } else {
                message = notification.getEvent().getName();
            }

        Date createdat = notification.getEvent().getDate();

            return new NotificationDto(notification.getId(), message,createdat,notification.getEvent().getId());
    }

    public static final List<NotificationDto> toNotificationDtos(List<Notification> notifications) {
        return notifications.stream().map(NotificationConversor::toNotificationDto).collect(Collectors.toList());
    }
}
