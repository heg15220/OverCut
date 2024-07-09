package es.udc.fic.tfg.model.entities;

import org.springframework.data.domain.Slice;

public interface CustomizedPodiumDao {
    Slice<Podium> findPodiumsByCircuit(Long circuitId, int page, int size);
}
