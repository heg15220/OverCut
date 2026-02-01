package overcutdebate.ws.security;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.HandshakeInterceptor;

import java.net.URI;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.Map;

// overcutdebate.ws.security.WsHandshakeTokenInterceptor
@Component
public class WsHandshakeTokenInterceptor implements HandshakeInterceptor {
    @Override
    public boolean beforeHandshake(ServerHttpRequest request, ServerHttpResponse response,
                                   WebSocketHandler wsHandler, Map<String, Object> attributes) {
        URI uri = request.getURI();
        String query = uri.getQuery(); // st=...
        if (query != null) {
            for (String part : query.split("&")) {
                String[] kv = part.split("=", 2);
                if (kv.length == 2 && kv[0].equals("st")) {
                    attributes.put("ST_TOKEN", URLDecoder.decode(kv[1], StandardCharsets.UTF_8));
                }
            }
        }
        return true;
    }

    @Override public void afterHandshake(ServerHttpRequest req, ServerHttpResponse res,
                                         WebSocketHandler wsHandler, Exception ex) {}
}
