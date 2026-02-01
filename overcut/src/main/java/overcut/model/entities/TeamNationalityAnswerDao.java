package overcut.model.entities;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface TeamNationalityAnswerDao extends JpaRepository<TeamNationalityAnswer, Long> {
    List<TeamNationalityAnswer> findByGameIdOrderByAnswerOrderAsc(Long gameId);
}
