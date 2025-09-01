package overcut.model.entities;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface CookieConsentDao extends JpaRepository<CookieConsent, Long> {
    Optional<CookieConsent> findByUser(User user);
    Optional<CookieConsent> findByConsentId(String consentId);
}

