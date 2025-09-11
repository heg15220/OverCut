package overcut.model.services;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.HttpURLConnection;
import java.net.URL;
import java.util.List;
import java.io.BufferedReader;
import java.io.InputStreamReader;

@Service
public class PilotAutoCompleteServiceImpl implements AutoCompleteService {

    @Value("${fastapi.base-url:http://fastapi:8000}")
    private String fastapiBaseUrl;

    private String PYTHON_SERVICE_URL = fastapiBaseUrl + "/autocomplete-pilot-tictactoe?partial=";

    @Override
    public List<String> getSuggestions(String name) {
        try {
            String endpoint = PYTHON_SERVICE_URL + java.net.URLEncoder.encode(name, "UTF-8");
            URL url = new URL(endpoint);
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("GET");

            BufferedReader reader = new BufferedReader(
                    new InputStreamReader(conn.getInputStream(), java.nio.charset.StandardCharsets.UTF_8)
            );

            StringBuilder response = new StringBuilder();
            String line;
            while ((line = reader.readLine()) != null) {
                response.append(line);
            }

            reader.close();

            ObjectMapper mapper = new ObjectMapper();
            return mapper.readValue(response.toString(), new TypeReference<List<String>>() {});

        } catch (Exception e) {
            throw new RuntimeException("Error llamando al microservicio de autocompletado: " + e.getMessage(), e);
        }
    }
}
