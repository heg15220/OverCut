package overcutdebate.rest.controllers;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.bind.annotation.*;
import overcutdebate.model.services.DebateRoomService;
import overcutdebate.rest.dtos.*;

import java.util.List;

@RestController
@RequestMapping("/api/debate")
public class DebateRoomController {

    private final DebateRoomService service;

    public DebateRoomController(DebateRoomService service) {
        this.service = service;
    }

    @GetMapping("/health")
    public String health() { return "ok"; }

    @GetMapping("/rooms")
    public List<RoomSummaryDto> list(@RequestParam String scope) {
        return service.listTodayRooms(scope);
    }

    @GetMapping("/rooms/{id}")
    public RoomDetailDto detail(@PathVariable Long id) {
        return service.getRoom(id);
    }

    @PostMapping("/rooms/{id}/join")
    public JoinRoomResponseDto join(@PathVariable Long id, HttpServletRequest req) {
        Long userId = (Long) req.getAttribute("userId");
        String auth = req.getHeader("Authorization");
        return service.joinRoom(id, userId, auth);
    }

    @PostMapping("/rooms/{id}/poll")
    public void poll(@PathVariable Long id,
                     @RequestBody PollAnswerRequestDto body,
                     HttpServletRequest req) {
        Long userId = (Long) req.getAttribute("userId");
        service.answerPoll(id, userId, body.answer);
    }

    @GetMapping("/rooms/{id}/messages")
    public List<ChatMessageHistoryDto> messages(@PathVariable Long id,
                                                @RequestParam(defaultValue = "50") int limit,
                                                HttpServletRequest req) {
        Long userId = (Long) req.getAttribute("userId");
        return service.getRoomMessages(id, userId, limit);
    }

}
