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


}
