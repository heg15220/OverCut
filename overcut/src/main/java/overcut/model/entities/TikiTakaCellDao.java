package overcut.model.entities;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TikiTakaCellDao extends JpaRepository<TikiTakaCell, Long> {
    List<TikiTakaCell> findByGameId(Long gameId);

}
