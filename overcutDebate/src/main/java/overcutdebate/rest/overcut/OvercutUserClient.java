package overcutdebate.rest.overcut;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.RequestEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.net.URI;
import java.util.Map;

@Component
public class OvercutUserClient {

    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${overcut.baseUrl}")
    private String overcutBaseUrl;

    @SuppressWarnings("unchecked")
    public String fetchUserNameFromServiceToken(String bearerAuthHeader) {

        String base = overcutBaseUrl.endsWith("/")
                ? overcutBaseUrl.substring(0, overcutBaseUrl.length() - 1)
                : overcutBaseUrl;

        URI uri = URI.create(base + "/api/users/loginFromServiceToken");

        RequestEntity<Void> req = RequestEntity
                .post(uri)
                .header(HttpHeaders.AUTHORIZATION, bearerAuthHeader)
                .build();

        Map<String, Object> body = restTemplate.exchange(req, Map.class).getBody();
        if (body == null) return null;

        // 1) raíz: userName
        Object userName = body.get("userName");
        if (userName != null) return userName.toString();

        // 2) raíz: username / name (por si acaso)
        Object username = body.get("username");
        if (username != null) return username.toString();
        Object name = body.get("name");
        if (name != null) return name.toString();

        // 3) anidado: user.userName
        Object userObj = body.get("user");
        if (userObj instanceof Map<?, ?> userMap) {
            Object nested = ((Map<String, Object>) userMap).get("userName");
            if (nested != null) return nested.toString();
            Object nested2 = ((Map<String, Object>) userMap).get("username");
            if (nested2 != null) return nested2.toString();
        }

        // 4) anidado: authenticatedUser.userName (otro patrón típico)
        Object authObj = body.get("authenticatedUser");
        if (authObj instanceof Map<?, ?> authMap) {
            Object nested = ((Map<String, Object>) authMap).get("userName");
            if (nested != null) return nested.toString();
        }

        return null;
    }
}
