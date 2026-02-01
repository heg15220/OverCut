package overcutdebate.ws.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.*;
import overcutdebate.ws.security.WsHandshakeTokenInterceptor;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private WsHandshakeTokenInterceptor handshakeTokenInterceptor;

    public WebSocketConfig(WsHandshakeTokenInterceptor handshakeTokenInterceptor) {
        this.handshakeTokenInterceptor = handshakeTokenInterceptor;
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws/debate")
                .addInterceptors(handshakeTokenInterceptor) // ✅ AQUÍ
                .setAllowedOriginPatterns("*");
        // .withSockJS();
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        registry.setApplicationDestinationPrefixes("/app");
        registry.enableSimpleBroker("/topic");
        registry.setUserDestinationPrefix("/user");
    }
}
