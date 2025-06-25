package overcut.model.services;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.ArrayList;
import java.util.List;

@Component
public class CrosswordGeneratorPythonAdapter {

    private final ObjectMapper mapper = new ObjectMapper();

    public List<CrosswordWordData> generateCrossword(int rows, int cols, String language) {
        try {
            HttpClient client = HttpClient.newHttpClient();
            URI uri = URI.create("http://localhost:8000/generate-crossword?rows=" + rows + "&cols=" + cols + "&lang=" + language);
            HttpRequest request = HttpRequest.newBuilder().uri(uri).GET().build();

            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() != 200) {
                throw new RuntimeException("FastAPI error: " + response.body());
            }

            JsonNode root = mapper.readTree(response.body());
            List<CrosswordWordData> result = new ArrayList<>();
            for (JsonNode node : root.get("words")) {
                CrosswordWordData data = new CrosswordWordData();
                data.word = node.get("word").asText();
                data.clue = node.get("clue").asText();
                data.row = node.get("row").asInt();
                data.col = node.get("col").asInt();
                data.direction = node.get("direction").asText();
                result.add(data);
            }
            return result;

        } catch (Exception e) {
            throw new RuntimeException("Error calling FastAPI for crossword generation", e);
        }
    }

    public boolean validateUserAnswer(String word, String clue, String language) {
        try {
            HttpClient client = HttpClient.newHttpClient();
            String uri = String.format("http://localhost:8000/validate-crossword-word?word=%s&clue=%s&lang=%s",
                    java.net.URLEncoder.encode(word, java.nio.charset.StandardCharsets.UTF_8),
                    java.net.URLEncoder.encode(clue, java.nio.charset.StandardCharsets.UTF_8),
                    language);

            HttpRequest request = HttpRequest.newBuilder().uri(URI.create(uri)).GET().build();
            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() != 200) return false;
            return response.body().trim().equalsIgnoreCase("true");
        } catch (Exception e) {
            return false;
        }
    }

    public static class CrosswordWordData {
        public String word;
        public String clue;
        public int row;
        public int col;
        public String direction;
    }
}
