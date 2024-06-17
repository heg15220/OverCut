package es.udc.fic.tfg.model.services;

import es.udc.fic.tfg.model.common.exceptions.InstanceNotFoundException;
import es.udc.fic.tfg.model.entities.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Calendar;
import java.util.List;

@Service
public class EventServiceImpl implements EventService{

    @Autowired
    private NotificationDao notificationDao;
    @Autowired
    private EventDao eventDao;

    @Autowired
    private NotificationService notificationService;

    public List<Event> findUpcomingEvents() {
        LocalDate today = LocalDate.now();
        return eventDao.findByDateGreaterThan(today);
    }

    @Override
    public List<Event> getAllEvents(){
        return eventDao.findAllEvents();
    }
    @Override
    @Scheduled(cron = "0 0 12 * *?") // Ejemplo de programación cron para ejecutar diariamente a medianoche
    public void scheduleNotifications() throws InstanceNotFoundException {
        Calendar calendar = Calendar.getInstance();
        calendar.add(Calendar.DAY_OF_YEAR, 7); // Marcar eventos para la próxima semana
        LocalDate nextWeek = calendar.getTime().toInstant().atZone(ZoneId.systemDefault()).toLocalDate();

        // Obtener eventos futuros
        List<Event> futureEvents = eventDao.findAllByDateAfter(nextWeek);

        for (Event event : futureEvents) {
            Notification notification = new Notification();
            notification.setMessage("Evento próximo: " + event.getName());
            notification.setCreatedAt(LocalDateTime.now());
            notification.setEvent(event);
            notificationDao.save(notification);

            // Enviar notificación a usuarios interesados en el evento
            for (Event event2 : futureEvents) {
                List<UserNotification> userNotifications = eventDao.findByEvent(event2);
                for (UserNotification userNotification : userNotifications) {
                    try {
                        notificationService.sendNotificationToUser(userNotification.getUser().getId(), notification.getId());
                    } catch (InstanceNotFoundException e) {
                        System.err.println("Error enviando notificación a usuario: " + e.getMessage());
                    }
                }
            }

        }
    }

    @Override
    public Event getEventDetails(Long eventId){
        return eventDao.findEventById(eventId);
    }
}
