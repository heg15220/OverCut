package es.udc.fic.tfg.model.entities;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.CrudRepository;
import org.springframework.data.repository.query.Param;

public interface CircuitDao extends CrudRepository<Circuit, Long> , CustomizedCircuitDao{
    @Query("SELECT c FROM Circuit c WHERE c.id = :id")
    Circuit findCircuitById(@Param("id") Long id);

}
