package es.udc.fic.tfg.model.services;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

public class CriteriaService {

    private static final HttpClient CLIENT = HttpClient.newHttpClient();
    private static final String ENDPOINT = "http://127.0.0.1:8000/generate";

    /**
     * Llama al servidor FastAPI y devuelve el JSON de criterios.
     */
    public static String fetchCriteria() {
        try {
            HttpRequest req = HttpRequest.newBuilder()
                    .uri(new URI(ENDPOINT))
                    .GET()
                    .build();

            HttpResponse<String> resp = CLIENT.send(req, HttpResponse.BodyHandlers.ofString());

            if (resp.statusCode() != 200) {
                throw new RuntimeException("Error from criteria server: HTTP " + resp.statusCode() +
                        " → " + resp.body());
            }
            return resp.body();
        } catch (Exception e) {
            throw new RuntimeException("No se pudo obtener criterios del servidor", e);
        }
    }
}
