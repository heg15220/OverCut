package overcut.model.entities;

import org.springframework.data.domain.Slice;

public interface CustomizedCircuitDao {
    Slice<Circuit> findAllCircuitsOrderedByInsertion(int page, int size);

}
