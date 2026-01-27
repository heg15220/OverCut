package overcutdebate.ws.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.*;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // SockJS opcional (si quieres compatibilidad)
        registry.addEndpoint("/ws/debate")
                .setAllowedOriginPatterns("*");
        // .withSockJS();  // si luego te interesa
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        // Cliente envía a /app/...
        registry.setApplicationDestinationPrefixes("/app");

        // Cliente se suscribe a /topic/...
        registry.enableSimpleBroker("/topic");

        // (Opcional) user queues
        registry.setUserDestinationPrefix("/user");
    }
}
