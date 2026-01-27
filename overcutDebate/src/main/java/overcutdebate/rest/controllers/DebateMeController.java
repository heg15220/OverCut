package overcutdebate.rest.controllers;

import jakarta.servlet.http.HttpServletRequest;
import overcutdebate.rest.overcut.OvercutUserClient;
import org.springframework.http.HttpHeaders;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/debate")
public class DebateMeController {

    private final OvercutUserClient overcutUserClient;

    public DebateMeController(OvercutUserClient overcutUserClient) {
        this.overcutUserClient = overcutUserClient;
    }

    @GetMapping("/health")
    public Map<String, Object> health() {
        return Map.of("status", "ok");
    }


    @GetMapping("/me")
    public Map<String, Object> me(HttpServletRequest request) {
        Long userId = (Long) request.getAttribute("userId");
        Boolean isAdmin = (Boolean) request.getAttribute("isAdmin");
        Boolean isJournalist = (Boolean) request.getAttribute("isJournalist");

        String auth = request.getHeader(HttpHeaders.AUTHORIZATION);
        String userName = overcutUserClient.fetchUserNameFromServiceToken(auth);

        Map<String, Object> res = new LinkedHashMap<>();
        res.put("userId", userId);
        res.put("userName", userName);
        res.put("admin", isAdmin != null && isAdmin);
        res.put("journalist", isJournalist != null && isJournalist);
        return res;
    }
}
