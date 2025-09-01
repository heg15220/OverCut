package overcut.model.services;

import overcut.model.common.exceptions.InstanceNotFoundException;
import overcut.model.entities.CookieConsent;
import overcut.model.entities.CookieConsentDao;
import overcut.model.entities.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import overcut.model.services.PermissionChecker;

import java.util.UUID;

@Service
@Transactional
public class CookieConsentService {

    @Autowired
    private CookieConsentDao consentDao;

    @Autowired
    private PermissionChecker permissionChecker;

    // overcut.model.services.CookieConsentService
    public CookieConsent getByUserId(Long userId) throws InstanceNotFoundException {
        User u = permissionChecker.checkUser(userId);
        return consentDao.findByUser(u).orElseGet(() -> {
            CookieConsent c = new CookieConsent();
            c.setUser(u);
            c.setPreferences(false);
            c.setAnalytics(false);
            c.setAds(false);
            c.setDnt(false);                        // <-- AÑADIDO
            return consentDao.save(c);
        });
    }

    public CookieConsent getByConsentId(String consentId) {
        return consentDao.findByConsentId(consentId).orElseGet(() -> {
            CookieConsent c = new CookieConsent();
            c.setConsentId(consentId);
            c.setPreferences(false);
            c.setAnalytics(false);
            c.setAds(false);
            c.setDnt(false);                        // <-- AÑADIDO
            return consentDao.save(c);
        });
    }


    public CookieConsent saveFlags(CookieConsent c, Boolean pref, Boolean ana, Boolean ads,
                                   String country, Boolean dnt, String tcf) {
        if (pref != null) c.setPreferences(pref);
        if (ana  != null) c.setAnalytics(ana);
        if (ads  != null) c.setAds(ads);
        if (country != null) c.setCountry(country);
        c.setDnt(dnt != null ? dnt : false);       // <-- AÑADIDO (evita null)
        if (tcf  != null) c.setTcfString(tcf);
        return consentDao.save(c);
    }


    /** Vincula consentimiento anónimo al usuario tras login */
    public void attachAnonymousConsentToUser(String consentId, Long userId) throws InstanceNotFoundException {
        if (consentId == null || consentId.isBlank()) return;
        User u = permissionChecker.checkUser(userId);
        consentDao.findByConsentId(consentId).ifPresent(c -> {
            c.setUser(u);
            consentDao.save(c);
        });
    }

    /** Crear un consentId nuevo para anónimo */
    public String ensureConsentId(String consentId) {
        return (consentId == null || consentId.isBlank()) ? UUID.randomUUID().toString() : consentId;
    }
}
