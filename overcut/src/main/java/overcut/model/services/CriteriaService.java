package overcut.model.services;

import java.io.IOException;
import java.net.URI;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

/**
 * Servicio para pedir criterios a FastAPI.
 *
 * =========================
 * [NEW] Añadimos el parámetro teamsOnly (true/false)
 * =========================
 */
public class CriteriaService {

    // Ajusta si lo tienes por config/env
    private static final String FASTAPI_BASE_URL = "http://localhost:8000";

    private static final HttpClient client = HttpClient.newHttpClient();

    public static String fetchCriteria(int sinceYear, Integer endYear, boolean teamsOnlyMode) throws IOException, InterruptedException {

        StringBuilder url = new StringBuilder(FASTAPI_BASE_URL)
                .append("/generate-tikitaka-criteria")
                .append("?sinceYear=").append(sinceYear);

        if (endYear != null) {
            url.append("&endYear=").append(endYear);
        }

        // =========================
        // [NEW] teamsOnly
        // =========================
        url.append("&teamsOnly=").append(teamsOnlyMode);

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(url.toString()))
                .GET()
                .build();

        HttpResponse<String> resp = client.send(request, HttpResponse.BodyHandlers.ofString());

        if (resp.statusCode() >= 400) {
            throw new RuntimeException("FastAPI error (" + resp.statusCode() + "): " + resp.body());
        }

        return resp.body();
    }

    // Utilidad por si en el futuro quieres pasar strings
    private static String enc(String s) {
        return URLEncoder.encode(s, StandardCharsets.UTF_8);
    }
}
