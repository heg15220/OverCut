package overcut.model.services;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import overcut.model.entities.TikiTakaGame;
import overcut.model.entities.TikiTakaGameDao;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
@Service
public class ValidationGameServiceImpl implements ValidationGameService{

    @Autowired
    private TikiTakaGameDao gameDao;

    @Override
    public boolean validatePilot(Long gameId, String rowCriteria, String colCriteria, String piloto) {
        try {
            TikiTakaGame game = gameDao.findById(gameId)
                    .orElseThrow(() -> new RuntimeException("Game not found"));

            StringBuilder url = new StringBuilder("http://127.0.0.1:8000/validate-tikitaka-pilot");
            url.append("?row=").append(URLEncoder.encode(rowCriteria, StandardCharsets.UTF_8));
            url.append("&col=").append(URLEncoder.encode(colCriteria, StandardCharsets.UTF_8));
            url.append("&piloto=").append(URLEncoder.encode(piloto, StandardCharsets.UTF_8));

            if (game.getSinceYear() != null) {
                url.append("&sinceYear=").append(game.getSinceYear());
            }
            if (game.getEndYear() != null) {
                url.append("&endYear=").append(game.getEndYear());
            }

            HttpClient client = HttpClient.newHttpClient();
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url.toString()))
                    .GET()
                    .build();

            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() != 200) {
                System.err.println("FastAPI error: " + response.body());
                return false;
            }

            ObjectMapper mapper = new ObjectMapper();
            JsonNode result = mapper.readTree(response.body());

            return result.get("is_valid").asBoolean();

        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }




}
