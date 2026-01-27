package overcutdebate.ws.services;

import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import overcutdebate.model.daos.DebateMessageDao;
import overcutdebate.model.entities.DebateMessage;
import overcutdebate.model.services.DebateClock;
import overcutdebate.model.services.DebateRoomService;
import overcutdebate.rest.overcut.OvercutUserClient;
import overcutdebate.ws.dtos.ChatMessageDto;

import java.time.Instant;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class DebateChatService {

    private final DebateRoomService roomService;
    private final OvercutUserClient overcutUserClient;
    private final SimpMessagingTemplate messagingTemplate;
    private final DebateMessageDao messageDao;
    private final DebateClock clock;

    // ✅ cache simple (luego puedes meter TTL si quieres)
    private final ConcurrentHashMap<Long, String> userNameCache = new ConcurrentHashMap<>();

    public DebateChatService(
            DebateRoomService roomService,
            OvercutUserClient overcutUserClient,
            SimpMessagingTemplate messagingTemplate,
            DebateMessageDao messageDao,
            DebateClock clock
    ) {
        this.roomService = roomService;
        this.overcutUserClient = overcutUserClient;
        this.messagingTemplate = messagingTemplate;
        this.messageDao = messageDao;
        this.clock = clock;
    }

    @Transactional
    public void sendToRoom(Long roomId, Long userId, String bearerAuth, String text) {

        // ✅ (aunque lo controle el interceptor, lo mantenemos)
        if (!roomService.isRoomLive(roomId)) {
            throw new IllegalStateException("Room is not LIVE");
        }
        if (!roomService.isUserJoined(roomId, userId)) {
            throw new SecurityException("User not joined in this room");
        }

        String cleaned = sanitize(text);
        if (cleaned.isBlank()) {
            return; // o lanza ApiException(400, ...) si prefieres
        }

        // ✅ username desde cache
        String userName = resolveUserName(userId, bearerAuth);
        if (userName == null || userName.isBlank()) userName = "user" + userId;

        Instant now = clock.nowInstant();

        // ✅ 1) persistimos en BD
        DebateMessage m = new DebateMessage();
        m.setRoomId(roomId);
        m.setUserId(userId);
        m.setUserName(userName);
        m.setText(cleaned);
        m.setCreatedAt(now);
        m = messageDao.save(m);

        // ✅ 2) emitimos por WS
        // (si quieres incluir m.getId() en el ws dto, amplía ChatMessageDto)
        ChatMessageDto dto = new ChatMessageDto(
                roomId,
                userId,
                userName,
                cleaned,
                now
        );

        messagingTemplate.convertAndSend("/topic/rooms/" + roomId, dto);
    }

    private String resolveUserName(Long userId, String bearerAuth) {
        return userNameCache.computeIfAbsent(
                userId,
                __ -> overcutUserClient.fetchUserNameFromServiceToken(bearerAuth)
        );
    }

    private String sanitize(String s) {
        if (s == null) return "";
        s = s.trim();
        if (s.length() > 400) s = s.substring(0, 400);
        return s;
    }
}
