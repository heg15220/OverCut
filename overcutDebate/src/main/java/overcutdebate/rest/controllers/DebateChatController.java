package overcutdebate.rest.controllers;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.bind.annotation.*;
import overcutdebate.model.services.DebateRoomService;
import overcutdebate.rest.dtos.ChatMessageDto;
import overcutdebate.rest.dtos.SendMessageRequestDto;

@RestController
@RequestMapping("/api/debate")
public class DebateChatController {

    private final DebateRoomService roomService;

    public DebateChatController(DebateRoomService roomService) {
        this.roomService = roomService;
    }

    @PostMapping("/rooms/{roomId}/messages")
    public ChatMessageDto send(@PathVariable Long roomId,
                               @RequestBody SendMessageRequestDto req,
                               HttpServletRequest http) {
        Long userId = (Long) http.getAttribute("userId");
        return roomService.sendMessage(roomId, userId, req.text);
    }
}
