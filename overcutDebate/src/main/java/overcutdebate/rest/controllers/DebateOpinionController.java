package overcutdebate.rest.controllers;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.bind.annotation.*;
import overcutdebate.model.services.DebateOpinionService;
import overcutdebate.rest.dtos.CreateOpinionRequestDto;
import overcutdebate.rest.dtos.OpinionDto;

@RestController
@RequestMapping("/api/debate")
public class DebateOpinionController {

    private final DebateOpinionService service;

    public DebateOpinionController(DebateOpinionService service) {
        this.service = service;
    }

    @PostMapping("/opinions")
    public OpinionDto submit(@RequestBody CreateOpinionRequestDto req, HttpServletRequest http) {
        Long userId = (Long) http.getAttribute("userId");
        Boolean isAdminAttr = (Boolean) http.getAttribute("isAdmin");
        boolean isAdmin = isAdminAttr != null && isAdminAttr;

        String auth = http.getHeader("Authorization");

        // ✅ admin puede re-escribir (update) su opinión del día
        return service.submitOpinion(userId, auth, isAdmin, req);
    }

    @GetMapping("/opinions/me")
    public OpinionDto myToday(@RequestParam String scope, HttpServletRequest http) {
        Long userId = (Long) http.getAttribute("userId");
        return service.getMyTodayOpinion(userId, scope);
    }
}
