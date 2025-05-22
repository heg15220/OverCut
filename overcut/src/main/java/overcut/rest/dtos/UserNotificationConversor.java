package overcut.rest.dtos;

import overcut.model.entities.Event;
import overcut.model.entities.UserNotification;

import java.util.Date;
import java.util.List;
import java.util.stream.Collectors;

public class UserNotificationConversor {
    private UserNotificationConversor() {
    }

    public static final UserNotificationDto toUserNotificationDto(UserNotification notification) {
        Event event = notification.getEvent();

        EventDto eventDto = EventConversor.toEventDto(event);

        Date date = eventDto.getDate();
        return new UserNotificationDto(notification.getId(),notification.getNotification().getId(),notification.getUser().getId(),
                notification.getRead(),notification.getEvent().getId(),date,notification.getNotification().getMessage());
    }

    public static final List<UserNotificationDto> toUserNotificationDtos(List<UserNotification> notifications) {
        return notifications.stream().map(UserNotificationConversor::toUserNotificationDto).collect(Collectors.toList());
    }
}
