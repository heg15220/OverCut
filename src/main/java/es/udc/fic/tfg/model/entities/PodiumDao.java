package es.udc.fic.tfg.model.entities;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.CrudRepository;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface PodiumDao extends CrudRepository<Podium, Long>, CustomizedPodiumDao {
    @Query("SELECT p FROM Podium p WHERE p.id = :id")
    Podium findPodiumById(@Param("id") Long id);

    @Query("SELECT DISTINCT p.teamWinner FROM Podium p")
    List<String> getDistinctTeamWinners();

    @Query("SELECT COUNT(p) FROM Podium p WHERE p.teamWinner = :teamWinner")
    int countVictoriesByTeam(@Param("teamWinner") String teamWinner);
    @Query("SELECT p.circuit.id FROM Podium p GROUP BY p.circuit.id")
    List<Long> getDistinctCircuitIds();

    // En PodiumDao.java
    @Query("SELECT p FROM Podium p WHERE p.circuit.id = :circuitId")
    List<Podium> findByCircuitId(@Param("circuitId") Long circuitId);

    // En PodiumDao.java
    @Query("SELECT p FROM Podium p")
    List<Podium> findAllPodiums();


    @Query("SELECT p FROM Podium p WHERE LOWER(p.circuit.name) LIKE LOWER(:circuitName)")
    List<Podium> findByCircuitNameIgnoreCase(@Param("circuitName") String circuitName);



}
