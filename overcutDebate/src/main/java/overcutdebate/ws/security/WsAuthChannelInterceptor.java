package overcutdebate.ws.security;

import org.springframework.messaging.*;
import org.springframework.messaging.simp.stomp.*;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.stereotype.Component;
import overcutdebate.rest.common.JwtGenerator;
import overcutdebate.rest.common.JwtInfo;

import java.security.Principal;
import java.util.List;
import java.util.Map;

@Component
public class WsAuthChannelInterceptor implements ChannelInterceptor {

    public static final String SESSION_BEARER = "BEARER_AUTH";
    public static final String SESSION_USER_ID = "USER_ID";

    public static final String SESSION_ST_TOKEN = "ST_TOKEN"; // ✅ mismo nombre que en handshake

    private final JwtGenerator jwtGenerator;

    public WsAuthChannelInterceptor(JwtGenerator jwtGenerator) {
        this.jwtGenerator = jwtGenerator;
    }

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {

        StompHeaderAccessor accessor = StompHeaderAccessor.wrap(message);
        if (accessor.getCommand() == null) return message;

        if (StompCommand.CONNECT.equals(accessor.getCommand())) {

            Map<String, Object> session = accessor.getSessionAttributes();

            // 1) intentar por Authorization header en CONNECT
            String bearer = null;
            List<String> authHeaders = accessor.getNativeHeader("Authorization");
            if (authHeaders != null && !authHeaders.isEmpty()) {
                String h = authHeaders.get(0);
                if (h != null && h.startsWith("Bearer ")) bearer = h.trim();
            }

            // 2) fallback: token por query param capturado en handshake
            String token;
            if (bearer != null) {
                token = bearer.substring("Bearer ".length()).trim();
            } else {
                token = session != null ? (String) session.get(SESSION_ST_TOKEN) : null;
                if (token != null && !token.isBlank()) {
                    bearer = "Bearer " + token; // ✅ normalizamos
                }
            }

            if (token == null || token.isBlank()) {
                throw new MessagingException("Missing token in CONNECT (Authorization or ?st=)");
            }

            JwtInfo info = jwtGenerator.getInfo(token);

            Principal principal = new DebatePrincipal(
                    info.getUserId(),
                    info.getEmail(),
                    info.isAdmin(),
                    info.isRole()
            );
            accessor.setUser(principal);

            // ✅ Guardamos para SEND/SUBSCRIBE
            if (session != null) {
                session.put(SESSION_BEARER, bearer);
                session.put(SESSION_USER_ID, info.getUserId());
            }
        }

        return message;
    }
}
