package overcut.model.entities;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface WhoIsWhoHintDao extends JpaRepository<WhoIsWhoHint, Long> {
    List<WhoIsWhoHint> findByGameIdOrderByHintOrderAsc(Long gameId);
}
