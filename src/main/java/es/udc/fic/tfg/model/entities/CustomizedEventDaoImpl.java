package es.udc.fic.tfg.model.entities;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.Query;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Slice;
import org.springframework.data.domain.SliceImpl;

import java.time.Instant;
import java.time.LocalDate;
import java.util.Date;
import java.util.List;

public class CustomizedEventDaoImpl implements CustomizedEventDao {

    @PersistenceContext
    private EntityManager entityManager;

    @SuppressWarnings("unchecked")
    @Override
    public Slice<Event> findAllEventsOrderedByInsertion(int page, int size) {
        LocalDate today = LocalDate.now(); // Obtiene la fecha actual
        String query = "SELECT e FROM Event e WHERE e.date >= :today ORDER BY e.id";
        Query querySentence = entityManager.createQuery(query)
                .setParameter("today", Date.from(Instant.now())) // Asigna LocalDate a Date para la consulta
                .setFirstResult(page * size)
                .setMaxResults(size + 1);

        List<Event> events = querySentence.getResultList();
        boolean hasNextEvent = events.size() == (size + 1);

        if (hasNextEvent) {
            events.remove(events.size() - 1); // Elimina el último elemento si hay una próxima página
        }

        return new SliceImpl<>(events, PageRequest.of(page, size), hasNextEvent);
    }
}
