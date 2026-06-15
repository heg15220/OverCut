package overcut.model.entities;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface CareerModeSaveDao extends JpaRepository<CareerModeSave, Long> {
    Optional<CareerModeSave> findByExportCode(String exportCode);
    boolean existsByExportCode(String exportCode);
}
