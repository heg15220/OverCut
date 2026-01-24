package overcut.model.entities;

import org.springframework.data.jpa.repository.JpaRepository;

public interface TimelineEventDao extends JpaRepository<TimelineEvent, Long> {}
