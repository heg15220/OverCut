package es.udc.fic.tfg.model.entities;

import org.springframework.data.domain.Slice;

public interface CustomizedEventDao {
    Slice<Event> findAllEventsOrderedByInsertion(int page, int size);
}
