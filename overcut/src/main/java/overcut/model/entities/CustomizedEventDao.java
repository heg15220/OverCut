package overcut.model.entities;

import org.springframework.data.domain.Slice;

public interface CustomizedEventDao {
    Slice<Event> findAllEventsOrderedByInsertion(int page, int size);
}
