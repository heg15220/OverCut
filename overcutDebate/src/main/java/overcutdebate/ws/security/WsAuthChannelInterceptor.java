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

    private final JwtGenerator jwtGenerator;

    public WsAuthChannelInterceptor(JwtGenerator jwtGenerator) {
        this.jwtGenerator = jwtGenerator;
    }

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {

        StompHeaderAccessor accessor = StompHeaderAccessor.wrap(message);
        if (accessor.getCommand() == null) return message;

        if (StompCommand.CONNECT.equals(accessor.getCommand())) {

            List<String> authHeaders = accessor.getNativeHeader("Authorization");
            if (authHeaders == null || authHeaders.isEmpty()) {
                throw new MessagingException("Missing Authorization header in CONNECT");
            }

            String bearer = authHeaders.get(0); // "Bearer xxx"
            if (!bearer.startsWith("Bearer ")) {
                throw new MessagingException("Invalid Authorization header format");
            }

            String token = bearer.substring("Bearer ".length()).trim();
            JwtInfo info = jwtGenerator.getInfo(token);

            Principal principal = new DebatePrincipal(
                    info.getUserId(),
                    info.getEmail(),
                    info.isAdmin(),
                    info.isRole()
            );
            accessor.setUser(principal);

            // ✅ Guardamos en sesión STOMP para futuros SEND/SUBSCRIBE
            Map<String, Object> session = accessor.getSessionAttributes();
            if (session != null) {
                session.put(SESSION_BEARER, bearer);       // guardamos el "Bearer ..."
                session.put(SESSION_USER_ID, info.getUserId());
            }
        }

        return message;
    }
}
