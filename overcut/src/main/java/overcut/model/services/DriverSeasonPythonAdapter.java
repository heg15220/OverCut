package overcut.model.services;

import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

@Component
public class DriverSeasonPythonAdapter {

    private final RestTemplate restTemplate = new RestTemplate();

    // Ajusta a tu env (docker compose / nginx / nombre servicio)
    private final String PY_URL = System.getenv().getOrDefault("PY_GAMES_URL", "http://localhost:8000");

    public DriverSeasonGeneratedData generate(String lang) {
        String url = PY_URL + "/generate-driver-season-game?lang=" + lang;
        return restTemplate.getForObject(url, DriverSeasonGeneratedData.class);
    }
}
