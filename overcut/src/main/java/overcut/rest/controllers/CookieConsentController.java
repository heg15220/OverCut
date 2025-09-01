package overcut.rest.controllers;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import overcut.model.common.exceptions.InstanceNotFoundException;
import overcut.model.services.CookieConsentService;
import overcut.rest.common.CookieUtil;
import overcut.rest.dtos.CookieConsentDto;
import overcut.model.entities.CookieConsent;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@CrossOrigin(
        origins = {"http://localhost:3000", "http://127.0.0.1:3000"}, // ajusta según tu dev
        allowCredentials = "true"
)
@RestController
@RequestMapping("/api/consent")
public class CookieConsentController {

    private static final String CONSENT_COOKIE = "oc_consent"; // flags compactos
    private static final String CONSENT_ID_COOKIE = "oc_cid";  // UUID anónimo

    @Autowired
    private CookieConsentService consentService;

    /**
     * Lee el consentimiento actual (anónimo por oc_cid o del usuario si está autenticado con @RequestAttribute userId)
     */
    // CookieConsentController.java (GET)
    @GetMapping
    public CookieConsentDto getConsent(HttpServletRequest req,
                                       @RequestAttribute(required = false) Long userId)
            throws InstanceNotFoundException {
        CookieConsent c = null;

        if (userId != null) {
            c = consentService.findByUserId(userId).orElse(null);
        } else {
            String consentId = readCookie(req, CONSENT_ID_COOKIE);
            if (consentId != null && !consentId.isBlank()) {
                c = consentService.findByConsentId(consentId).orElse(null);
            }
        }

        CookieConsentDto dto = new CookieConsentDto();
        if (c != null) {
            dto.setPreferences(c.isPreferences());
            dto.setAnalytics(c.isAnalytics());
            dto.setAds(c.isAds());
            dto.setCountry(c.getCountry());
            dto.setDnt(c.getDnt());
        } else {
            // por defecto, todo en false
            dto.setPreferences(false);
            dto.setAnalytics(false);
            dto.setAds(false);
            dto.setDnt(false);
        }
        return dto;
    }


    /**
     * Guarda consentimiento (desde el banner/panel). Emite/actualiza oc_cid y oc_consent.
     */
    @PutMapping
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void saveConsent(@RequestBody CookieConsentDto dto,
                            HttpServletRequest req,
                            HttpServletResponse resp,
                            @RequestAttribute(required = false) Long userId) throws InstanceNotFoundException {

        String consentId = readCookie(req, CONSENT_ID_COOKIE);
        consentId = consentService.ensureConsentId(consentId);

        CookieConsent c;
        if (userId != null) {
            // vincular consentimiento anónimo si existe
            consentService.attachAnonymousConsentToUser(consentId, userId);
            c = consentService.getByUserId(userId);
        } else {
            c = consentService.getByConsentId(consentId);
        }

        consentService.saveFlags(c, dto.getPreferences(), dto.getAnalytics(), dto.getAds(),
                dto.getCountry(), dto.getDnt(), dto.getTcfString());

        // emitir cookies legibles por el front
        // oc_consent → string compacto: e.g. "P1|A0|ADS1"
        String compact = "P" + (c.isPreferences() ? "1" : "0") +
                "|A" + (c.isAnalytics()   ? "1" : "0") +
                "|ADS" + (c.isAds()      ? "1" : "0");
        // CookieConsentController.saveConsent(...)
        CookieUtil.addCookie(req, resp, CONSENT_COOKIE, compact, 31536000, false);
        CookieUtil.addCookie(req, resp, CONSENT_ID_COOKIE, consentId, 31536000, false);

    }

    private String readCookie(HttpServletRequest req, String name) {
        if (req.getCookies() == null) return null;
        for (var c : req.getCookies()) {
            if (name.equals(c.getName())) return c.getValue();
        }
        return null;
    }
}
