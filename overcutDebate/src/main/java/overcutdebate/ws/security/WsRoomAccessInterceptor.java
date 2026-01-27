package overcutdebate.ws.security;

import org.springframework.messaging.*;
import org.springframework.messaging.simp.stomp.*;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.stereotype.Component;
import overcutdebate.model.services.DebateRoomService;

import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import static overcutdebate.ws.security.WsAuthChannelInterceptor.SESSION_USER_ID;

@Component
public class WsRoomAccessInterceptor implements ChannelInterceptor {

    private static final Pattern TOPIC_ROOM = Pattern.compile("^/topic/rooms/(\\d+)$");
    private static final Pattern APP_ROOM_SEND = Pattern.compile("^/app/rooms/(\\d+)/message$");

    private final DebateRoomService roomService;

    public WsRoomAccessInterceptor(DebateRoomService roomService) {
        this.roomService = roomService;
    }

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {

        StompHeaderAccessor acc = StompHeaderAccessor.wrap(message);
        StompCommand cmd = acc.getCommand();
        if (cmd == null) return message;

        Map<String, Object> session = acc.getSessionAttributes();
        Long userId = session != null ? (Long) session.get(SESSION_USER_ID) : null;

        // Si no hay userId, es que no se autenticó en CONNECT
        if ((cmd == StompCommand.SUBSCRIBE || cmd == StompCommand.SEND) && userId == null) {
            throw new MessagingException("Unauthenticated WS session");
        }

        if (cmd == StompCommand.SUBSCRIBE) {
            String dest = acc.getDestination();
            Long roomId = extractRoomId(dest, TOPIC_ROOM);
            if (roomId != null) {
                // ✅ solo si está unido
                if (!roomService.isUserJoined(roomId, userId)) {
                    throw new MessagingException("Forbidden: not joined in room " + roomId);
                }
            }
        }

        if (cmd == StompCommand.SEND) {
            String dest = acc.getDestination();
            Long roomId = extractRoomId(dest, APP_ROOM_SEND);
            if (roomId != null) {
                // ✅ unido + sala LIVE
                if (!roomService.isUserJoined(roomId, userId)) {
                    throw new MessagingException("Forbidden: not joined in room " + roomId);
                }
                if (!roomService.isRoomLive(roomId)) {
                    throw new MessagingException("Room is not LIVE: " + roomId);
                }
            }
        }

        return message;
    }

    private Long extractRoomId(String destination, Pattern pattern) {
        if (destination == null) return null;
        Matcher m = pattern.matcher(destination);
        if (!m.matches()) return null;
        return Long.parseLong(m.group(1));
    }
}
