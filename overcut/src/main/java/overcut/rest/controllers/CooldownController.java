package overcut.rest.controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import overcut.model.services.CooldownService;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/cooldown")
public class CooldownController {

    @Autowired
    private CooldownService cooldownService;

    @GetMapping("/{gameType}")
    public Map<String, Object> checkCooldown(
            @PathVariable String gameType,
            @RequestAttribute("userId") Long userId // o desde seguridad/JWT
    ) {
        Map<String, Object> response = new HashMap<>();
        boolean canPlay = cooldownService.canPlay(gameType, userId);
        long secondsRemaining = cooldownService.secondsUntilNextPlay(gameType, userId);

        response.put("canPlay", canPlay);
        response.put("secondsRemaining", secondsRemaining);
        return response;
    }
}
