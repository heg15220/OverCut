package es.udc.fic.tfg.model.entities;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.Query;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Slice;
import org.springframework.data.domain.SliceImpl;

import java.util.List;

public class CustomizedEventDaoImpl implements CustomizedEventDao{

    @PersistenceContext
    private EntityManager entityManager;


    @SuppressWarnings("unchecked")
    @Override
    public Slice<Event> findAllEventsOrderedByInsertion(int page, int size) {
        String query = "SELECT e FROM Event e ORDER BY e.id";
        Query querySentence = entityManager.createQuery(query).setFirstResult(page * size).setMaxResults(size + 1);

        List<Event> events = querySentence.getResultList();
        boolean hasNextEvent = events.size() == (size + 1);

        if (hasNextEvent) {
            events.remove(events.size() - 1);
        }

        return new SliceImpl<>(events, PageRequest.of(page, size), hasNextEvent);
    }
}
