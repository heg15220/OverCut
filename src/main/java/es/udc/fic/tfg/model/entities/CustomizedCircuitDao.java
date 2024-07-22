package es.udc.fic.tfg.model.entities;

import org.springframework.data.domain.Slice;

import java.util.Optional;

public interface CustomizedCircuitDao {
    Slice<Circuit> findAllCircuitsOrderedByInsertion(int page, int size);

}
