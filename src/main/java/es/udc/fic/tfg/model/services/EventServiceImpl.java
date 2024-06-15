package es.udc.fic.tfg.model.services;

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
    private UserDao userDao;

    @Autowired
    private EventDao eventDao;

    @Autowired
    private NotificationService notificationService;

    public List<Event> findUpcomingEvents() {
        LocalDate today = LocalDate.now();
        return eventDao.findByDateGreaterThan(today);
    }
    @Override
    @Scheduled(cron = "0 0 12 * *?") // Ejemplo de programación cron para ejecutar diariamente a medianoche
    public void scheduleNotifications() {
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
            notificationService.saveNotification(notification);
        }
    }
}
