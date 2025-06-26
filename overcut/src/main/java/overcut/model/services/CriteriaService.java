package overcut.model.services;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

public class CriteriaService {

    private static final HttpClient CLIENT = HttpClient.newHttpClient();
    private static final String ENDPOINT = "http://127.0.0.1:8000/generate-tikitaka-criteria";

    /**
     * Llama al servidor FastAPI y devuelve el JSON de criterios,
     * filtrado desde sinceYear hasta endYear (inclusive).
     */
    public static String fetchCriteria(int sinceYear, Integer endYear) {
        try {
            StringBuilder sb = new StringBuilder(ENDPOINT)
                    .append("?sinceYear=").append(sinceYear);
            if (endYear != null) {
                sb.append("&endYear=").append(endYear);
            }
            URI uri = new URI(sb.toString());
            HttpRequest req = HttpRequest.newBuilder()
                    .uri(uri)
                    .GET()
                    .build();

            HttpResponse<String> resp = CLIENT.send(req, HttpResponse.BodyHandlers.ofString());

            if (resp.statusCode() != 200) {
                throw new RuntimeException("Error from criteria server: HTTP "
                        + resp.statusCode() + " → " + resp.body());
            }
            return resp.body();

        } catch (Exception e) {
            throw new RuntimeException("No se pudo obtener criterios del servidor", e);
        }
    }
}
