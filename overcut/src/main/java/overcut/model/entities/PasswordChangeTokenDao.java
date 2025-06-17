package overcut.model.entities;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PasswordChangeTokenDao extends JpaRepository<PasswordChangeToken, Long> {

    Optional<PasswordChangeToken> findByToken(String token);

    Optional<PasswordChangeToken> findByUserId(Long userId);
}
