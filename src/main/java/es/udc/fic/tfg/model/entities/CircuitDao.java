package es.udc.fic.tfg.model.entities;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.CrudRepository;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface CircuitDao extends CrudRepository<Circuit, Long> , CustomizedCircuitDao{
    @Query("SELECT c FROM Circuit c WHERE c.id = :id")
    Circuit findCircuitById(@Param("id") Long id);

    @Query("SELECT c.id AS circuitId, c.name AS circuitName, p.teamWinner, COUNT(p) AS victories FROM Podium p JOIN p.circuit c GROUP BY c.id, c.name, p.teamWinner")
    List<Object[]> getVictoriesPerCircuitAndTeam();

}
