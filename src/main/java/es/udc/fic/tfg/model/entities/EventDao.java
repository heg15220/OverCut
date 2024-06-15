package es.udc.fic.tfg.model.entities;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.CrudRepository;
import org.springframework.data.repository.query.Param;
import es.udc.fic.tfg.model.entities.Event;


import java.time.LocalDate;
import java.util.List;

public interface EventDao extends CrudRepository<Event, Long> {
    @Query("SELECT e FROM Event e WHERE e.date > :date")
    List<Event> findByDateGreaterThan(@Param("date") LocalDate date);


    @Query("SELECT e FROM Event e WHERE e.date > :nextWeek")
    List<Event> findAllByDateAfter(@Param("nextWeek") LocalDate nextWeek);

    @Query("SELECT unn FROM UserNotification unn WHERE unn.event = :event")
    List<UserNotification> findByEvent(@Param("event") Event event);
    @Query("SELECT e FROM Event e WHERE e.id = :id")
    Event findEventById(@Param("id") Long id);
    @Query("SELECT e FROM Event e")
    List<Event> findAllEvents();


}
