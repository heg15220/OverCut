package overcutdebate.ws.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;
import overcutdebate.ws.security.WsAuthChannelInterceptor;
import overcutdebate.ws.security.WsRoomAccessInterceptor;

@Configuration
public class WebSocketSecurityConfig implements WebSocketMessageBrokerConfigurer {

    private final WsAuthChannelInterceptor auth;
    private final WsRoomAccessInterceptor roomAccess;

    public WebSocketSecurityConfig(WsAuthChannelInterceptor auth, WsRoomAccessInterceptor roomAccess) {
        this.auth = auth;
        this.roomAccess = roomAccess;
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        // ✅ orden: primero autentica CONNECT, luego aplica reglas
        registration.interceptors(auth, roomAccess);
    }
}
