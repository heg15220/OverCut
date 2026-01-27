package overcutdebate.ws.controllers;

import org.springframework.messaging.handler.annotation.*;
import org.springframework.stereotype.Controller;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;

import overcutdebate.ws.dtos.ChatMessageSendDto;
import overcutdebate.ws.services.DebateChatService;

import java.util.Map;

import static overcutdebate.ws.security.WsAuthChannelInterceptor.SESSION_BEARER;
import static overcutdebate.ws.security.WsAuthChannelInterceptor.SESSION_USER_ID;

@Controller
public class DebateChatWsController {

    private final DebateChatService chatService;

    public DebateChatWsController(DebateChatService chatService) {
        this.chatService = chatService;
    }

    @MessageMapping("/rooms/{roomId}/message")
    public void send(@DestinationVariable Long roomId,
                     @Payload ChatMessageSendDto payload,
                     @Header("simpSessionAttributes") Map<String, Object> session) {

        Long userId = (Long) session.get(SESSION_USER_ID);
        String bearer = (String) session.get(SESSION_BEARER);

        chatService.sendToRoom(roomId, userId, bearer, payload.text);
    }
}
