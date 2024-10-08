package es.udc.fic.tfg.rest.controllers;

import es.udc.fic.tfg.model.common.exceptions.InstanceNotFoundException;
import es.udc.fic.tfg.model.entities.*;
import es.udc.fic.tfg.model.services.Block;
import es.udc.fic.tfg.model.services.EventService;
import es.udc.fic.tfg.model.services.NotificationService;
import es.udc.fic.tfg.model.services.exceptions.PostException;
import es.udc.fic.tfg.rest.dtos.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.time.*;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.Date;
import java.util.List;
import java.util.Locale;

@RestController
@RequestMapping("/api/events")
public class EventController {

    /** The post service. */
    @Autowired
    private EventService eventService;

    @Autowired
    private NotificationService notificationService;

    public static Date convertStringToDate(String dateString) throws IllegalArgumentException {
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy"); // Ajustado al formato correcto
        LocalDate localDate = LocalDate.parse(dateString, formatter);
        return Date.from(localDate.atStartOfDay(ZoneId.systemDefault()).toInstant());
    }

    public static LocalDateTime stringToLocalDateTime(String dateString) {
        // Intenta parsear con el formato ISO 8601 por defecto
        try {
            return LocalDateTime.parse(dateString);
        } catch (DateTimeParseException e) {
            // Si falla, intenta con un formato personalizado
            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss");
            return LocalDateTime.parse(dateString, formatter);
        }
    }

    public static OffsetDateTime stringToOffsetDateTime(String dateString) {
        // Adjusted to parse dates in the format "dd MMM yyyy"
        DateTimeFormatter inputFormatter = DateTimeFormatter.ofPattern("d MMM uuuu", Locale.getDefault());
        LocalDate localDate = LocalDate.parse(dateString, inputFormatter);
        return localDate.atStartOfDay(ZoneOffset.UTC).toOffsetDateTime();
    }

    public static LocalDateTime offsetDateTimeToLocalDateTime(OffsetDateTime offsetDateTime) {
        return offsetDateTime.toLocalDateTime();
    }

    public static Date offsetDateTimeToDate(OffsetDateTime offsetDateTime) {
        // Convierte OffsetDateTime a Instant manteniendo el ZoneOffset original
        Instant instant = offsetDateTime.toInstant();

        // Crea un objeto Date a partir del Instant
        Date date = Date.from(instant);

        return date;
    }


    @PostMapping("/create")
    public Long createEvent(@Validated @RequestBody EventParamsDto params){
        String date = params.getDate();
        Date date2 = convertStringToDate(date);
        return eventService.createEvent(params.getName(),params.getDescription(),date2,params.getLocation(),
                params.getImageUrl()).getId();
    }

    @GetMapping("/events")
    public BlockDto<EventDto> getEvents(@RequestParam(defaultValue = "0") int page) {
        Block<Event> foundEvents = eventService.getEvents(page, 2);
        return new BlockDto<>(EventConversor.toEventDtos(foundEvents.getItems()), foundEvents.getExistMoreItems());
    }
    @PostMapping("/notifications/create")
    public Long saveNotification(@RequestBody NotificationParams params) throws InstanceNotFoundException {
        OffsetDateTime createdAt = stringToOffsetDateTime(params.getCreatedAt());
        Date date = offsetDateTimeToDate(createdAt);
        return notificationService.saveNotification(params.getUserId(),params.getMessage(), date, params.getEventId()).getId();
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
        Block<UserNotification> userNotificationBlock = notificationService.getNotificationsForUser(userId,page,25);

        return new BlockDto<>(UserNotificationConversor.toUserNotificationDtos(userNotificationBlock.getItems())
                ,userNotificationBlock.getExistMoreItems());
    }

    @GetMapping("/{eventId}")
    public EventDto getEventDetails(@PathVariable Long eventId){
        return EventConversor.toEventDto(eventService.getEventDetails(eventId));
    }
}
